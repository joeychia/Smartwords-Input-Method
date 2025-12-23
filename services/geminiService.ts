import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { RewriteVariant, HistoryItem } from '../types';

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
    // Preference order: 3-flash, 2.5-flash, 1.5-flash
    const modelNames = ['gemini-3-flash', 'gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-1.5-flash'];
    let lastError: any = null;

    for (const modelName of modelNames) {
      try {
        console.log(`🤖 Attempting AI generation with: ${modelName}`);

        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
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

        const prompt = `
You are an expert AI assistant for voice input processing. Your task is to intelligently clean up and rewrite voice transcripts.

**Recent Conversation Context (last 10 minutes, max 10 messages):**
${recentContext || 'No recent context'}

**Raw Voice Transcript:**
"${rawTranscript}"

**CRITICAL FIRST STEP - Intelligent Cleanup:**
The raw transcript may contain:
- Stutters and repetitions (嗯, 呃, um, uh)
- Self-corrections and mistakes
- Verbal instructions about names, spelling, or corrections
- Meta-commentary about the dictation itself

Examples:
- "提醒安卓把外套带回家，嗯是英文名安卓，不是手机名，嗯，还是不对，是英文名字安主，ANDREW。"
  → Clean intent: "提醒Andrew把外套带回家。"
- "Send email to um John no wait I mean Jane about the meeting"
  → Clean intent: "Send email to Jane about the meeting"

**Your Task:**
1. **First, extract the clean intent** by removing all stutters, corrections, instructions, and meta-commentary
2. **Then generate variations** based on this clean intent:

**Required Variations (5 fixed variations):**
1. **Original (Cleaned)**: The clean intent itself, with stutters/corrections removed, in the original language
2. **Chinese (Simplified) - Concise**: Short, efficient, removes unnecessary words
3. **Chinese (Simplified) - Expanded**: More detailed, polite, elaborates on the intent
4. **English - Concise**: Short, efficient, removes unnecessary words  
5. **English - Expanded**: More detailed, polite, elaborates on the intent

**Smart Recommendations (up to 3 contextual variations):**
Based on the context and intent, intelligently recommend up to 3 additional common expressions that would be useful in this scenario. These should be variations that users might commonly need but aren't covered by the fixed variations above.

Examples of smart recommendations:
- For "提醒Andrew把外套带回家" → "更礼貌：麻烦你提醒Andrew把外套带回家", "问询：请你提醒Andrew把外套带回家，好吗？", "紧急：赶快提醒Andrew把外套带回家"
- For "Send email to Jane" → "With deadline: Send email to Jane by EOD", "Follow-up: Following up - send email to Jane", "Polite request: Could you please send email to Jane?"

The recommendations should:
- Be contextually relevant and commonly used
- Help the user quickly choose an appropriate expression
- Cover different tones/scenarios (polite, urgent, questioning, formal, casual, etc.)
- Be in the same language as the original input (or the dominant language if mixed)

**Tone:** Friendly and humble (default). Use polite, warm language.

**Output Format:** Return ONLY valid JSON with this exact structure:
{
  "variants": [
    {"id": "original", "label": "Original", "text": "...", "description": "Cleaned up version"},
    {"id": "zh-concise", "label": "中文精简", "text": "...", "description": "简短高效"},
    {"id": "zh-expanded", "label": "中文详细", "text": "...", "description": "礼貌详尽"},
    {"id": "en-concise", "label": "English Concise", "text": "...", "description": "Short and efficient"},
    {"id": "en-expanded", "label": "English Expanded", "text": "...", "description": "Polite and detailed"},
    {"id": "rec-1", "label": "推荐：[scenario]", "text": "...", "description": "Context-based recommendation"},
    {"id": "rec-2", "label": "推荐：[scenario]", "text": "...", "description": "Context-based recommendation"},
    {"id": "rec-3", "label": "推荐：[scenario]", "text": "...", "description": "Context-based recommendation"}
  ]
}

Note: The label for recommendations should describe the scenario/tone (e.g., "推荐：更礼貌", "推荐：问询", "Rec: Urgent", "Rec: Formal")
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log(`✅ Success with ${modelName}`);
        const data = JSON.parse(text);
        return data.variants || [];
      } catch (err: any) {
        console.warn(`⚠️ Failed with ${modelName}:`, err.message);
        lastError = err;
        // Continue to next model in list
      }
    }

    // If all models failed
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
