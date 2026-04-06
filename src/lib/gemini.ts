import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

export interface GeminiMessage {
  role: 'user' | 'model';
  text: string;
}

export const SYSTEM_PROMPT = `You are the Context-Lens AI—a Senior Multimodal Field Engineer. Your goal is to provide hands-free guidance. Analyze the live video feed to identify components, tools, and progress. Cross-reference them with the uploaded manual. If you see a safety risk (wrong tool, wrong wiring), say 'STOP' immediately. Before giving an instruction, perform an internal safety/logic check. Output exactly one step-by-step instruction at a time. Use a calm, professional, and encouraging tone.`;

export async function callGemini(
  apiKey: string,
  goal: string,
  snapshots: string[], // base64 strings
  pdfBase64: string | null,
  history: GeminiMessage[]
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  
  const contents: any[] = [];

  // Add PDF if available
  if (pdfBase64) {
    contents.push({
      inlineData: {
        data: pdfBase64,
        mimeType: "application/pdf"
      }
    });
  }

  // Add snapshots
  snapshots.forEach((s) => {
    contents.push({
      inlineData: {
        data: s,
        mimeType: "image/jpeg"
      }
    });
  });

  // Add goal and prompt
  contents.push({
    text: `Current Goal: ${goal}\n\nAnalyze the snapshots and manual to provide the next instruction.`
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [{ role: 'user', parts: contents }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
      },
    });

    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes("API_KEY_INVALID")) {
      throw new Error("Invalid API Key. Please check your settings.");
    }
    throw error;
  }
}
