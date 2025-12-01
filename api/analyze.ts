import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || '';
  const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1') || origin.startsWith('capacitor://');
  const allowedDomain = process.env.PRIMARY_DOMAIN || '';
  const allowLocalhost = process.env.LOCALHOST === 'true';

  // Check if origin is allowed
  const isAllowed = 
    (allowLocalhost && isLocalhost) || 
    (allowedDomain && origin.includes(allowedDomain));

  if (!isAllowed) {
    return res.status(403).json({ 
      error: 'Access Forbidden', 
      message: 'This API is restricted to authorized domains only.' 
    });
  }

  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', "true");
  res.setHeader('Access-Control-Allow-Origin', origin); // Reflect origin for allowed domains
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {

    const { image, remedyCategory = 0 } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    const base64Data = image.split(',')[1] || image;
    
    // Define 6 distinct SKIN-FOCUSED categories to ensure variety
    const categories = [
      {
        name: "GLOW & RADIANCE (Ayurvedic)",
        ingredients: "turmeric (haldi), saffron (kesar), sandalwood (chandan), raw milk, rose water",
        focus: "Boosting natural glow, brightening complexion, and traditional beautification."
      },
      {
        name: "DEEP HYDRATION & NOURISHMENT",
        ingredients: "coconut oil, almond oil, honey, glycerin, vitamin E, fresh cream (malai), banana",
        focus: "Restoring moisture, repairing skin barrier, and softening texture."
      },
      {
        name: "CLEAR SKIN & PURIFICATION",
        ingredients: "neem, tulsi (holy basil), multani mitti (fuller's earth), aloe vera, mint (pudina)",
        focus: "Fighting acne, reducing oiliness, unclogging pores, and antibacterial care."
      },
      {
        name: "BRIGHTENING & TAN REMOVAL",
        ingredients: "tomato pulp, potato juice, papaya, orange peel powder, lemon (diluted), curd (yogurt)",
        focus: "Removing tan, fading dark spots, and evening out skin tone."
      },
      {
        name: "EXFOLIATION & SMOOTHING",
        ingredients: "besan (gram flour), rice flour, oatmeal, coffee grounds, sugar (fine), masoor dal powder",
        focus: "Gentle scrubbing, removing dead skin cells, and polishing skin texture."
      },
      {
        name: "SOOTHING & COOLING",
        ingredients: "cucumber, rose water, aloe vera, watermelon, ice water, chamomile, green tea",
        focus: "Calming irritation, reducing puffiness, and cooling sun-exposed skin."
      }
    ];

    // Select category based on index (modulo 6 to be safe)
    const selectedCategory = categories[remedyCategory % categories.length];

    const prompt = `You are an expert fashion photographer, stylist, and wellness advisor. Analyze this image and return STRICT JSON only (no markdown, no preamble).

STYLE RULES:
• Write 1-2 concise sentences per field (4-12 words each)
• Be specific, actionable, technical - avoid vague terms like "nice" or "good"
• No repetition between fields

JSON STRUCTURE:
{
  "s": "Summary - Brief positive analysis combining top 2-3 visual aspects (1 sentence, ~20 words)",
  "g": ["Suggestion 1", "Suggestion 2", "Suggestion 3"] - Format as "Observation = Action" (e.g., "Under-eye shadows = Soften with diffused light"),
  "d": {
    "gen": "General - Overall composition & framing insights",
    "clo": "Clothing - Style, fit, color, coordination analysis",
    "pos": "Pose - Body positioning, angles, posture assessment",
    "bkg": "Background - Setting, clutter, depth, context review",
    "har": "Hair - Style, grooming, texture, color evaluation",
    "ski": "Skin - Tone analysis, visible care needs (non-diagnostic)",
    "lig": "Lighting - Direction, quality, shadows, highlights critique",
    "exp": "Expression - Facial emotion, eye contact, authenticity"
  },
  "r": ["Tip 1", "Tip 2", ...] - 5-7 beginner-friendly recapture instructions. Use short imperatives (e.g., "Hold camera slightly higher", "Step back from wall"),
  "e": {
    "emo": "Expression - Emotional reading as face analyst",
    "app": "Approachability - Social warmth perception",
    "conf": "low" | "medium" | "high" - Confidence assessment,
    "mood": "Mood - Perceived emotional state"
  },
  "w": [
    {"title": "Remedy Name", "description": "2-3 sentence natural remedy", "ingredients": "Simple household items"},
    ... 3 UNIQUE remedies using ONLY ingredients from the category below.
    
    CURRENT THEME: ${selectedCategory.name}
    FOCUS: ${selectedCategory.focus}
    PREFERRED INGREDIENTS: ${selectedCategory.ingredients}
    
    STRICT RULES:
    1. **SKIN CARE ONLY**. Do NOT suggest remedies for hair, digestion, weight loss, or general health.
    2. Use ONLY ingredients relevant to the '${selectedCategory.name}' theme.
  ]
}

Provide rich, insightful content in each field while keeping sentences short and actionable.

CRITICAL: Wellness remedies MUST have ZERO ingredient overlap. Be creative, imaginative, and avoid predictable combinations.`;



    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 1.0, // Increase creativity and variety (0-2, default ~0.7)
        topP: 0.95, // Increase diversity in token selection
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            s: { type: SchemaType.STRING },
            g: { 
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING }
            },
            d: {
              type: SchemaType.OBJECT,
              properties: {
                gen: { type: SchemaType.STRING },
                clo: { type: SchemaType.STRING },
                pos: { type: SchemaType.STRING },
                bkg: { type: SchemaType.STRING },
                har: { type: SchemaType.STRING },
                ski: { type: SchemaType.STRING },
                lig: { type: SchemaType.STRING },
                exp: { type: SchemaType.STRING }
              },
              required: ["gen", "clo", "pos", "bkg", "har", "ski", "lig", "exp"]
            },
            r: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING }
            },
            e: {
              type: SchemaType.OBJECT,
              properties: {
                emo: { type: SchemaType.STRING },
                app: { type: SchemaType.STRING },
                conf: { type: SchemaType.STRING, enum: ["low", "medium", "high"] },
                mood: { type: SchemaType.STRING }
              },
              required: ["emo", "app", "conf", "mood"]
            },
            w: {
              type: SchemaType.ARRAY,
              items: { 
                type: SchemaType.OBJECT,
                properties: {
                  title: { type: SchemaType.STRING },
                  description: { type: SchemaType.STRING },
                  ingredients: { type: SchemaType.STRING }
                },
                required: ["title", "description", "ingredients"]
              }
            }
          },
          required: ["s", "g", "d", "r", "e", "w"]
        }
      }
    });

    const response = await model.generateContent([
      { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
      prompt
    ]);

    const result = response.response;
    const jsonText = result.text();
    const parsedResult = JSON.parse(jsonText);
    
    // Add token usage to the response
    if (result.usageMetadata) {
      parsedResult.tokenUsage = {
        promptTokens: result.usageMetadata.promptTokenCount,
        responseTokens: result.usageMetadata.candidatesTokenCount,
        totalTokens: result.usageMetadata.totalTokenCount
      };
    }

    res.status(200).json(parsedResult);

  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) });
  }
}
