import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { RewriteVariant, HistoryItem } from '../types';
import { analytics } from './analyticsService';

export const generateRewrites = async (
  rawTranscript: string,
  contextHistory: HistoryItem[],
  tone: string,
  userApiKey?: string
): Promise<RewriteVariant[]> => {
  try {
    // 1. Get API Key
    const viteKey = (import.meta as any).env?.VITE_API_KEY;
    const key = userApiKey || viteKey;

    if (!key) {
      return [
        { id: 'original', label: 'Original', text: rawTranscript, description: 'Raw transcript' },
        { id: 'local', label: 'Local', text: rawTranscript, description: 'API key missing; please set it in Settings' }
      ];
    }

    // 2. Initialize Gemini
    const genAI = new GoogleGenerativeAI(key);

    // We'll try the most modern models first (it's Dec 2025)
    // Preference order: 2.5-flash, 1.5-flash
    const modelNames = ['gemini-2.5-flash', 'gemini-1.5-flash'];
    let lastError: any = null;

    for (const modelName of modelNames) {
      try {
        const startTime = performance.now();
        console.log(`🤖 Attempting AI generation with: ${modelName}`);

        const systemInstruction = `
You are an expert AI assistant for voice input processing.
Task: Clean up voice transcripts (remove stutters, corrections, meta-commentary) and generate variations.

Required Variations:
1. Original (Cleaned): The clean intent in the original language.
2. zh-concise: Chinese (Simplified) Concise.
3. zh-expanded: Chinese (Simplified) Expanded (polite).
4. en-concise: English Concise.
5. en-expanded: English Expanded (polite).
6. 1-3 Smart Recommendations: Scenario-based variations (e.g., "Rec: Urgent", "推荐：更礼貌").

Tone: Friendly and humble.
Output Format: Return ONLY valid JSON:
{"variants": [{"id": "...", "label": "...", "text": "...", "description": "..."}]}
`;

        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemInstruction,
          generationConfig: {
            temperature: 0.4,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 512,
            responseMimeType: "application/json",
            responseSchema: {
              type: SchemaType.OBJECT,
              properties: {
                variants: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.OBJECT,
                    properties: {
                      id: { type: SchemaType.STRING },
                      label: { type: SchemaType.STRING },
                      text: { type: SchemaType.STRING },
                      description: { type: SchemaType.STRING }
                    },
                    required: ["id", "label", "text"]
                  }
                }
              }
            }
          }
        });

        // Context filtering
        const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
        const recentContext = contextHistory
          .filter(h => h.timestamp >= tenMinutesAgo)
          .slice(0, 10)
          .map(h => `User: ${h.selected}`)
          .join('\n');

        const userPrompt = `
Context History:
${recentContext || 'None'}

Raw Transcript:
"${rawTranscript}"

Generate cleanup and variations according to system instructions.
`;

        const result = await model.generateContent(userPrompt);
        const response = await result.response;
        const text = response.text();

        const duration = Math.round(performance.now() - startTime);
        console.log(`✅ Success with ${modelName} in ${duration}ms`);
        analytics.logTiming('AI', 'ai_rewrite_latency', duration, modelName);
        analytics.logEvent({
          category: 'AI',
          action: 'ai_rewrite_success',
          label: modelName,
          metadata: { input_length: rawTranscript.length }
        });

        const data = JSON.parse(text);
        return data.variants || [];
      } catch (err: any) {
        console.warn(`⚠️ Failed with ${modelName}:`, err.message);
        lastError = err;
      }
    }

    // If all models failed
    const finalError = lastError?.message || 'All models failed';
    analytics.logError(`AI generation failure: ${finalError}`, false, { transcript: rawTranscript });
    throw lastError;

  } catch (error: any) {
    console.error("Gemini API Ultimate Failure:", error);

    let errorMsg = error?.message || 'Unknown error';
    if (errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('API key not valid')) {
      errorMsg = 'Invalid API Key. Check Settings or .env.local';
    } else if (errorMsg.includes('model not found') || errorMsg.includes('404')) {
      errorMsg = 'AI Model not found. The API might have changed IDs.';
    }

    return [
      { id: 'original', label: 'Original', text: rawTranscript, description: 'Raw transcript' },
      { id: 'error', label: 'Error', text: rawTranscript, description: `AI Error: ${errorMsg}` }
    ];
  }
};
