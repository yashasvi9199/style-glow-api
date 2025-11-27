import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', "true");
  res.setHeader('Access-Control-Allow-Origin', '*');
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
      You are an expert photographer, fashion stylist, and dermatologist.
      Analyze the attached image based on the 18-point checklist.
      
      IMPORTANT: For the 'suggestions' field, provide exactly 3 specific, actionable edit suggestions for EACH of the 10 categories.
      These suggestions will be presented to the user as buttons to click to auto-fix the image. 
      Make them short and punchy (e.g., "Warm up skin tone", "Wear a navy blazer", "Blur background").

      ALSO IMPORTANT: For the 'recaptureSuggestions' field, provide 5-7 specific tips on how the user can retake the photo to get a better result naturally.
      Focus on:
      - Facial expressions (e.g., "Relax your jaw", "Smile with your eyes")
      - Pose and Body Language (e.g., "Tilt head slightly left", "Straighten shoulders")
      - Gestures (e.g., "Place hand on chin")
      - Clothing adjustments (e.g., "Straighten collar", "Remove wrinkles")
      - Background/Environment (e.g., "Step away from the wall", "Find better lighting")
      - Camera angle (e.g., "Hold camera slightly higher")

      Categories for suggestions:
      1. General (Overall enhancements)
      2. Clothing (Fashion advice)
      3. Pose (Body language adjustments)
      4. Background (Setting improvements)
      5. Hair (Hairstyle changes)
      6. Skin (Texture/Tone fixes)
      7. Makeup (Grooming/Cosmetic)
      8. Lighting (Atmosphere)
      9. Accessories (Additions)
      10. Expression (Facial adjustments)

      NEW FEATURES TO INCLUDE:

      4. Facial Feature Analysis (Non-medical):
      - Texture (e.g., "skin texture appears uneven")
      - Forehead (e.g., "forehead has shiny areas")
      - Eyes (e.g., "under-eye area looks darker")
      - Cheeks (e.g., "cheek redness detected")
      
      5. Emotional & Social Perception:
      - Expression (e.g., "Expression reads slightly tired")
      - Confidence (e.g., "Confidence level: medium")
      - Approachability (e.g., "Approachability high")
      - Mood (e.g., "calm / neutral / stressed / cheerful")

      6. Aesthetic Enhancements Simulator (Textual suggestions):
      - Ideal lighting setup for this face shape
      - Best angles for profile shots
      - Glasses styles that complement this face
      - Hairstyles that match forehead shape / jaw line
      - Beard or no-beard recommendations (for male subjects)

      7. Skin Wellness Advisor (Non-medical, gentle advice):
      - Observations (non-medical)
      - Lifestyle Factors (sleep, hydration, stress)
      - Gentle Home Care Ideas (safe herbs, masks, no chemicals)
      - Natural Ingredients to Support Skin Health
      - Professional Recommendation (soft: "If symptoms persist...")
      * AVOID: Naming diseases, drug names, chemical treatments, strict dosages.

      EXECUTIVE SUMMARY UPDATE:
      Include specific pointers like "Reduce shadow under eyes", "Even out skin tone", "Reduce highlights on forehead", "Balance color temperature".

      Output Format: JSON.
    `;

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            summary: { type: SchemaType.STRING },
            details: {
              type: SchemaType.OBJECT,
              properties: {
                subjectClarity: { type: SchemaType.STRING },
                lightingQuality: { type: SchemaType.STRING },
                skinTones: { type: SchemaType.STRING },
                facialShadowsAndTexture: { type: SchemaType.STRING },
                eyes: { type: SchemaType.STRING },
                expressionAndPosture: { type: SchemaType.STRING },
                composition: { type: SchemaType.STRING },
                backgroundQuality: { type: SchemaType.STRING },
                colorHarmony: { type: SchemaType.STRING },
                contrastAndTonalBalance: { type: SchemaType.STRING },
                sharpness: { type: SchemaType.STRING },
                croppingAndAspectRatio: { type: SchemaType.STRING },
                clothingAndStyling: { type: SchemaType.STRING },
                moodConsistency: { type: SchemaType.STRING },
                noiseAndGrain: { type: SchemaType.STRING },
                detailHierarchy: { type: SchemaType.STRING },
                lensDistortion: { type: SchemaType.STRING },
                intent: { type: SchemaType.STRING },
                hairstyle: { type: SchemaType.STRING },
                makeup: { type: SchemaType.STRING }
              },
              required: ["subjectClarity", "lightingQuality", "skinTones", "facialShadowsAndTexture", "eyes", "expressionAndPosture", "composition", "backgroundQuality", "colorHarmony", "contrastAndTonalBalance", "sharpness", "croppingAndAspectRatio", "clothingAndStyling", "moodConsistency", "noiseAndGrain", "detailHierarchy", "lensDistortion", "intent", "hairstyle", "makeup"]
            },
            suggestions: {
              type: SchemaType.OBJECT,
              properties: {
                general: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                clothing: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                pose: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                background: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                hair: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                skin: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                makeup: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                lighting: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                accessories: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                expression: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              },
              required: ["general", "clothing", "pose", "background", "hair", "skin", "makeup", "lighting", "accessories", "expression"]
            },
            recaptureSuggestions: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING }
            },
            facialFeatures: {
              type: SchemaType.OBJECT,
              properties: {
                texture: { type: SchemaType.STRING },
                forehead: { type: SchemaType.STRING },
                eyes: { type: SchemaType.STRING },
                cheeks: { type: SchemaType.STRING }
              },
              required: ["texture", "forehead", "eyes", "cheeks"]
            },
            emotionalAnalysis: {
              type: SchemaType.OBJECT,
              properties: {
                expression: { type: SchemaType.STRING },
                confidence: { type: SchemaType.STRING },
                approachability: { type: SchemaType.STRING },
                perceivedMood: { type: SchemaType.STRING }
              },
              required: ["expression", "confidence", "approachability", "perceivedMood"]
            },
            aestheticEnhancements: {
              type: SchemaType.OBJECT,
              properties: {
                lighting: { type: SchemaType.STRING },
                angles: { type: SchemaType.STRING },
                glasses: { type: SchemaType.STRING },
                hairstyles: { type: SchemaType.STRING },
                grooming: { type: SchemaType.STRING }
              },
              required: ["lighting", "angles", "glasses", "hairstyles", "grooming"]
            },
            skinWellness: {
              type: SchemaType.OBJECT,
              properties: {
                observations: { type: SchemaType.STRING },
                lifestyleFactors: { type: SchemaType.STRING },
                homeCare: { type: SchemaType.STRING },
                naturalIngredients: { type: SchemaType.STRING },
                professionalRecommendation: { type: SchemaType.STRING }
              },
              required: ["observations", "lifestyleFactors", "homeCare", "naturalIngredients", "professionalRecommendation"]
            }
          },
          required: ["summary", "details", "suggestions", "recaptureSuggestions", "facialFeatures", "emotionalAnalysis", "aestheticEnhancements", "skinWellness"]
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
    
    res.status(200).json(parsedResult);

  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) });
  }
}
