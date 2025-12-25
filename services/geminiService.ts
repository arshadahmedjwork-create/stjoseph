
import { GoogleGenAI } from "@google/genai";

export const generateFunFact = async (year: number): Promise<string> => {
  const API_KEY = process.env.API_KEY;
  
  if (!API_KEY) {
    console.warn("Gemini API key is not set.");
    return `Fun fact generation is unavailable. API key not configured.`;
  }

  try {
    // Initialize the client immediately before use to ensure fresh configuration
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Tell me one, short, and interesting fun fact about a major world event that happened in the year ${year}. Be concise and cheerful.`,
    });
    
    // Directly access .text property as per strict guidelines
    return response.text || `Could not retrieve a fact for ${year}.`;
  } catch (error) {
    console.error("Error generating fun fact:", error);
    return `Could not generate a fun fact for ${year}. Please try again later.`;
  }
};
