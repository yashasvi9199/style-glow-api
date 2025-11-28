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
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    const base64Data = image.split(',')[1] || image;

    const prompt = `
      You are a Highly Calibrated Expert Analyst: an award-winning photographer, a professional fashion stylist, and a non-diagnostic skin wellness advisor.
Input: A single image.
Output: A single JSON object that MUST STRICTLY MATCH the existing schema keys. Return JSON ONLY. No preamble, no explanation, no markdown (e.g., \`\`\`json).

---
### I. GLOBAL TOKEN EFFICIENCY & STYLE MANDATE

1.  SENTENCE BREVITY: For ALL string fields, use **1–2 concise, information-dense sentences only**. Sentences must be short (4–12 words). DO NOT write paragraphs longer than two sentences.
2.  CONCRETE LANGUAGE: Avoid vague or flowery language (e.g., "nice," "good"). Use actionable verbs and specific technical, emotional, or physical descriptors (e.g., "Soften contrast," "Slight tension in jaw," "Diffuse light source").
3.  CONTENT SEPARATION: Avoid repeating the same observation across different fields. Keep points strictly within the most relevant category.

---
### II. FIELD-SPECIFIC CONSTRAINTS & RICHNESS

**1. Summary (Field 1):**
-   Provide a brief, positive analysis (1 sentence, max ~25 words) that combines the top 2-3 strongest visual aspects.

**2. General Suggestions (Field 2):**
-   The array MUST contain **EXACTLY 3** concise pointers.
-   Format each pointer as a short Observation/Action pairing: "Observation = Action" (e.g., "Under-eye shadows = Soften by diffusing light") to maximize information density.

**3. Detailed Analysis (Field 3 - 10 Categories):**
-   For EACH of the 10 category fields (General, Clothing, Pose, Background, Hair, Skin, Makeup, Lighting, Accessories, Expression), provide 1–2 highly specific, short sentences detailing the analysis.

**4. Recapture (Field 4):**
-   The array MUST contain **5 to 7** explicit, step-by-step tips for a complete beginner.
-   Each tip must be a short, imperative instruction (e.g., "Hold camera slightly higher," "Lean slightly toward the light," "Take one small step away from the wall").

**5. Emotional & Social Analysis (Field 5):**
-   For each field (Expression, Confidence, Approachability, Mood), provide 1–2 short, insightful sentences, detailing the assessment as a non-judgmental face reader.

**6. Facial & Body Analysis (Field 6):**
-   This output MUST be an array of up to 5 short bullets.
-   Each bullet MUST be prefixed by its category (Body:, Skin:, Face:, Color:, Other:) followed by a concise 6–12 word observation (e.g., "Skin: Visible uneven texture around T-zone," "Body: Shoulders slightly tense, indicating mild stress").

**7. Wellness Advisor (Field 7):**
-   Based on observations from the physical analysis, generate safe, non-diagnostic home remedy advice (Hydration, Sleep, Natural Ingredients, Sun Protection, Mild Exercise).
-   **SAFETY MANDATE:** DO NOT name conditions, recommend dosages, or chemical treatments.

**8. Mandatory Disclaimer:**
-   Ensure the 'disclaimerText' field contains the full legal boilerplate: "The content provided here is for informational and creative improvement purposes only and is not a substitute for professional medical advice, diagnosis, or treatment."

Output Format: STRICT JSON.
    `;

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
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
                mak: { type: SchemaType.STRING },
                lig: { type: SchemaType.STRING },
                acc: { type: SchemaType.STRING },
                exp: { type: SchemaType.STRING }
              },
              required: ["gen", "clo", "pos", "bkg", "har", "ski", "mak", "lig", "acc", "exp"]
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
            bf: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING }
            },
            w: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING }
            },
            disc: { type: SchemaType.STRING }
          },
          required: ["s", "g", "d", "r", "e", "bf", "w", "disc"]
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
