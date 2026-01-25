import { apiClient } from './api/apiClient';

/**
 * Frontend wrapper for Gemini AI service.
 * This calls a backend proxy endpoint (/api/ai) instead of directly calling Google GenAI.
 * 
 * IMPORTANT: The backend must implement a POST /api/ai endpoint that:
 * 1. Accepts { prompt, history } in the request body
 * 2. Calls Google GenAI API server-side with the API key
 * 3. Returns { text: string } response
 * 
 * This approach keeps API keys secure on the backend.
 */

export interface GeminiRequest {
  prompt: string;
  history: { role: 'user' | 'model'; text: string }[];
}

export interface GeminiResponse {
  text: string;
}

export const getGeminiResponse = async (
  prompt: string,
  history: { role: 'user' | 'model'; text: string }[]
): Promise<string> => {
  try {
    const response = await apiClient.post<GeminiResponse>('/api/ai', {
      prompt,
      history,
    });

    return response.text || "I'm having trouble thinking of a solution right now. Please try again.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I am currently offline or experiencing high traffic. Please try again later.";
  }
};
