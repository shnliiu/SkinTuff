import { GoogleGenAI, Type } from "@google/genai";
import type { UserProfile } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const productProperties = {
    name: { type: Type.STRING },
    price: { type: Type.NUMBER },
    currency: { type: Type.STRING },
    key_ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
    link: { 
        type: Type.STRING,
        description: "A validated, up-to-date, and working direct URL to the product's official page on Amazon.com. This MUST NOT be a search page. It must be a real, verifiable link. Example: 'https://www.amazon.com/CeraVe-Hydrating-Facial-Cleanser-Fragrance/dp/B01MSSDEPK/'. Do not invent URLs."
    },
    why_this_pick: { type: Type.STRING }
};

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        screening_summary: {
            type: Type.OBJECT,
            properties: {
                skin_type: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, confidence: { type: Type.NUMBER } } },
                possible_concerns: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, confidence: { type: Type.NUMBER } } } },
                limitations: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
        },
        ingredient_guidance: {
            type: Type.OBJECT,
            properties: {
                beneficial: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { ingredient: { type: Type.STRING }, why: { type: Type.STRING } } } },
                avoid_or_limit: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { ingredient: { type: Type.STRING }, reason: { type: Type.STRING } } } },
                interaction_warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
        },
        routines: {
            type: Type.OBJECT,
            properties: {
                AM: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { step: { type: Type.STRING }, usage: { type: Type.STRING }, products: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: productProperties } } } } },
                PM: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { step: { type: Type.STRING }, usage: { type: Type.STRING }, schedule: { type: Type.STRING }, products: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: productProperties } } } } },
                weekly: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { step: { type: Type.STRING }, frequency: { type: Type.STRING }, guardrails: { type: Type.STRING }, products: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: productProperties } } } } },
            },
        },
        personalization_flags: {
            type: Type.OBJECT,
            properties: {
                budget_mode: { type: Type.BOOLEAN },
                fragrance_free_only: { type: Type.BOOLEAN },
                pregnant_or_breastfeeding: { type: Type.BOOLEAN },
                prescription_overlap_detected: { type: Type.BOOLEAN },
            },
        },
        follow_up: {
            type: Type.OBJECT,
            properties: {
                patch_test_instructions: { type: Type.STRING },
                what_to_expect: { type: Type.ARRAY, items: { type: Type.STRING } },
                when_to_seek_dermatology: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
        },
        disclaimer: { type: Type.STRING },
    },
};

const buildPrompt = (profile: UserProfile): string => {
  return `
You are a cautious, expert product assistant building a modern, aesthetic, interactive web/mobile app.
Your goal is to assess a user’s skin type and common skin concerns from an image, then recommend evidence-based ingredients and a personalized day/night routine.

**USER PROFILE:**
- Age Range: ${profile.ageRange}
- Sensitivities/Allergies: ${profile.sensitivities || 'None specified'}
- Pregnant or Breastfeeding: ${profile.isPregnantOrBreastfeeding ? 'Yes' : 'No'}
- Budget: ${profile.budget}

**ABSOLUTE SAFETY RULES (DO NOT BREAK):**
1.  Do not claim to diagnose, treat, or cure any disease. Use phrases like "non-diagnostic screening," "possible," "may be consistent with," and "for informational purposes only."
2.  For any potentially serious findings (e.g., suspicious moles, bleeding lesions, sudden changes), instruct the user to "seek a board-certified dermatologist promptly."
3.  If the image quality is poor (bad lighting, blurry, obstructed), state this in the 'limitations' field and explain why.
4.  Be sensitive and neutral in tone. Avoid shaming language.
5.  If the user is pregnant or breastfeeding, you MUST avoid recommending retinoids and certain acids. Suggest safer alternatives like azelaic acid and niacinamide.

**TASK:**
Analyze the provided user image and profile. Based on your analysis, generate a JSON object that strictly adheres to the provided schema.

**ANALYSIS GUIDELINES:**
- **Skin Type:** Estimate normal, dry, oily, combination, or sensitive with a confidence score.
- **Concerns:** Detect common non-diagnostic concerns like dehydration, redness, uneven tone, hyperpigmentation, texture/congestion, enlarged pores, fine lines, visible oiliness.
- **Routine:** Create a logical AM, PM, and Weekly routine with clear steps, usage instructions, and 2-4 product suggestions per step. Flag any ingredient conflicts.

**Product Link Generation (CRITICAL REQUIREMENT):**
- For each product, you MUST provide a direct, validated, and up-to-date working URL on Amazon.com.
- CRITICAL: Do not invent, guess, or hallucinate URLs. Providing a broken or incorrect link is a major failure. The link's accuracy is paramount.
- The URL must lead directly to a specific product page, not a search results page, a category page, or an error page.
- Fallback Mechanism: If, and ONLY IF, you cannot locate a verified, direct product URL, you must use the specific search link format as a fallback: 'https://www.amazon.com/s?k=BRAND+PRODUCT+NAME'. This is the only acceptable alternative to a direct link.

Now, analyze the image and generate the JSON output.
`;
};


export const analyzeSkin = async (base64Image: string, profile: UserProfile) => {
    try {
        const imagePart = {
            inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image,
            },
        };

        const textPart = {
            text: buildPrompt(profile),
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error analyzing skin:", error);
        throw new Error("Failed to analyze skin. The AI model may be temporarily unavailable or the image could not be processed.");
    }
};

const buildLivePrompt = (): string => {
  return `
You are an expert AI skin analyzer providing a real-time, non-diagnostic screening from a live video feed.
Analyze the user's face in the provided image frame.
**CRITICAL:** Respond ONLY with a single, valid JSON object containing the 'screening_summary'.
Your entire output must be a single block of parsable JSON. Do not add any other text, markdown, code fences, or explanations.
The JSON must adhere to this structure:
{
  "skin_type": {"label": string, "confidence": number},
  "possible_concerns": [{"label": string, "confidence": number}],
  "limitations": [string]
}
If the image is blurry, poorly lit, or doesn't contain a face, state so in the 'limitations' field.
Keep your analysis concise and fast for the live feed. Now, analyze the image and provide the JSON output.
`;
};

export const analyzeSkinStream = async (base64Image: string) => {
    try {
        const imagePart = {
            inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image,
            },
        };

        const textPart = {
            text: buildLivePrompt(),
        };

        const stream = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
            }
        });
        
        return stream;

    } catch (error) {
        console.error("Error starting skin analysis stream:", error);
        throw new Error("Failed to start live analysis stream.");
    }
};