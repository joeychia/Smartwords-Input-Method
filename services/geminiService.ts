import { GoogleGenAI, Type } from "@google/genai";
import { RewriteVariant, HistoryItem } from '../types';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateRewrites = async (
  rawTranscript: string,
  contextHistory: HistoryItem[],
  tone: string
): Promise<RewriteVariant[]> => {
  try {
    // Construct context string from previous history to help the model understand continuity
    const recentContext = contextHistory
      .slice(0, 5) // Last 5 messages
      .map(h => `User: ${h.selected}`)
      .join('\n');

    const prompt = `
      You are an expert copy editor and input method assistant.
      
      Context of recent conversation:
      ${recentContext}
      
      Current raw voice transcript (may contain errors/fillers):
      "${rawTranscript}"
      
      Task: Rewrite the raw transcript into 4 distinct variations based on the user's preferred tone: ${tone}.
      
      Variations required:
      1. Natural: Correct grammar, remove fillers, keep original meaning closely.
      2. Concise: Short, punchy, efficient.
      3. Friendly: Softer tone, polite, suitable for chat.
      4. Expanded: More detailed, elaborating slightly on the intent.
      
      Return JSON only.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            variants: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  text: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["id", "label", "text"]
              }
            }
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");

    const data = JSON.parse(jsonText);
    return data.variants || [];

  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback in case of API failure to allow UI to show something
    return [
      { id: 'original', label: 'Original', text: rawTranscript, description: 'Raw transcript' },
      { id: 'error', label: 'Error', text: rawTranscript, description: 'Could not connect to AI' }
    ];
  }
};