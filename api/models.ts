import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', "true");
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all for this test
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    
    // Note: The SDK might not have a direct listModels method exposed in this version,
    // but we can try to return what we know or test a simple generation to confirm the key works.
    // However, for standard REST API, listModels is available.
    
    // We will return a static list of known supported models for now as a reference,
    // plus a confirmation that the API key is present.
    
    const keyPresent = !!process.env.GEMINI_API_KEY;
    const keyPrefix = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 4) + '...' : 'none';

    res.status(200).json({
      status: 'success',
      apiKeyPresent: keyPresent,
      apiKeyPrefix: keyPrefix,
      recommendedModels: [
        'gemini-1.5-flash (Best for speed/cost)',
        'gemini-1.5-pro (Best for reasoning)',
        'gemini-1.0-pro (Legacy)'
      ],
      message: 'To see exact limits, visit Google AI Studio.'
    });

  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
}
