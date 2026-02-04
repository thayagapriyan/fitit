import { Hono } from 'hono';
import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';
import { config } from '../config/index.js';
import { chatRepository } from '../repositories/index.js';
import { success, fromError, errors } from '../utils/response.js';
import { AppError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import type { AIResponse } from '@fixit/shared-types';

/**
 * AI API Routes
 * Handles chat interactions with Google Gemini AI
 */
const ai = new Hono();

// Validation schema
const aiRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  history: z.array(
    z.object({
      role: z.enum(['user', 'model']),
      text: z.string(),
    })
  ).default([]),
  sessionId: z.string().optional(),
});

// System prompt for the Fixit AI assistant
const SYSTEM_PROMPT = `You are a helpful AI assistant for FixitHub, a home repair and maintenance platform. 
You help users with:
- DIY repair guidance and step-by-step instructions
- Tool recommendations and usage tips
- Safety advice for home repairs
- When to call a professional vs. DIY
- Cost estimates and project planning
- Material recommendations

Be friendly, practical, and safety-conscious. If a task seems dangerous or requires professional licensing (like major electrical or plumbing work), recommend hiring a professional from our platform.`;

/**
 * POST /api/ai - Process AI chat request
 * This is the endpoint the frontend expects
 */
ai.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const result = aiRequestSchema.safeParse(body);
    
    if (!result.success) {
      throw new ValidationError('Invalid request data', {
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { prompt, history, sessionId } = result.data;

    // Check for API key
    if (!config.GEMINI_API_KEY) {
      logger.warn('Gemini API key not configured');
      const response: AIResponse = {
        text: "I'm currently offline. Please configure the AI service and try again later.",
        sessionId,
      };
      return success(c, response);
    }

    // Initialize Gemini client
    const genAI = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });

    // Build conversation history
    const contents = [
      { role: 'user' as const, parts: [{ text: SYSTEM_PROMPT }] },
      { role: 'model' as const, parts: [{ text: 'Understood! I\'m ready to help with home repair questions.' }] },
      ...history.map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: msg.text }],
      })),
      { role: 'user' as const, parts: [{ text: prompt }] },
    ];

    // Generate response
    const generationResult = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents,
    });

    const responseText = generationResult.text || "I'm having trouble thinking of a solution right now. Please try again.";

    // Optionally save to chat history
    if (sessionId) {
      await chatRepository.addMessage(sessionId, 'user', prompt);
      await chatRepository.addMessage(sessionId, 'model', responseText);
    }

    const response: AIResponse = {
      text: responseText,
      sessionId,
    };

    logger.debug('AI response generated', { 
      promptLength: prompt.length, 
      responseLength: responseText.length,
      sessionId,
    });

    return success(c, response);
  } catch (error) {
    logger.error('AI request failed', { error: String(error) });
    
    if (error instanceof AppError) {
      return fromError(c, error);
    }
    
    // Return a friendly error for external service failures
    const response: AIResponse = {
      text: "Sorry, I am currently offline or experiencing high traffic. Please try again later.",
    };
    return success(c, response);
  }
});

/**
 * GET /api/ai/history/:sessionId - Get chat history
 */
ai.get('/history/:sessionId', async (c) => {
  try {
    const sessionId = c.req.param('sessionId');
    const history = await chatRepository.getSessionHistory(sessionId);
    return success(c, history);
  } catch (error) {
    if (error instanceof AppError) return fromError(c, error);
    return errors.internalError(c);
  }
});

/**
 * DELETE /api/ai/history/:sessionId - Clear chat history
 */
ai.delete('/history/:sessionId', async (c) => {
  try {
    const sessionId = c.req.param('sessionId');
    await chatRepository.clearSession(sessionId);
    return success(c, { message: 'Chat history cleared' });
  } catch (error) {
    if (error instanceof AppError) return fromError(c, error);
    return errors.internalError(c);
  }
});

export { ai };
