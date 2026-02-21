const { GoogleGenAI } = require('@google/genai');

let ai;

function getAi() {
    if (!ai) {
        if (!process.env.GEMINI_API_KEY) {
            console.warn('GEMINI_API_KEY is not set. Gemini functions will fail.');
            return null;
        }
        console.log('Using GEMINI_API_KEY:', process.env.GEMINI_API_KEY);
        ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return ai;
}

/**
 * Normalizes an object label.
 */
function normalizeLabel(label) {
    if (!label) return 'unknown';
    return label.toLowerCase().trim()
        .replace(/[^\w\s]/g, '')
        .replace(/s$/i, ''); // very basic singularize
}

/**
 * Uses Gemini Vision to classify the doodle.
 */
async function classifyDoodle(base64Image) {
    const aiClient = getAi();
    if (!aiClient) return { label: 'unknown', contains_text: false };

    try {
        // base64Image comes as data:image/png;base64,...
        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

        const response = await aiClient.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{
                role: "user",
                parts: [
                    { text: "You are evaluating a quick Pictionary-style doodle. Identify the single most likely object drawn in this image. Use 1–3 words. Prefer common nouns. No adjectives unless essential. Even if the drawing is very rough or simple, make your best guess at what it represents. Only return \"unknown\" if the image is completely blank or just random scribbles without form. Also indicate whether written text appears in the drawing." },
                    { inlineData: { data: base64Data, mimeType: "image/png" } }
                ]
            }],
            config: {
                systemInstruction: "You are a doodle classifier for a competitive party game. Return ONLY valid JSON.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        label: { type: "STRING" },
                        confidence: { type: "NUMBER" },
                        alternatives: { type: "ARRAY", items: { type: "STRING" } },
                        contains_text: { type: "BOOLEAN" }
                    },
                    required: ["label", "confidence", "alternatives", "contains_text"]
                }
            }
        });

        const resultText = response.text;
        if (resultText) {
            const parsed = JSON.parse(resultText);
            parsed.label = normalizeLabel(parsed.label);
            return parsed;
        }
        return { label: 'unknown', contains_text: false };
    } catch (error) {
        console.error("Gemini Vision Error:", error);
        return { label: 'unknown', contains_text: false };
    }
}

/**
 * Uses Gemini LLM to act as referee.
 */
async function referee(baseline, playerALabel, playerBLabel, history) {
    const aiClient = getAi();
    if (!aiClient) return { winner: 'tie', reason: 'AI disabled', strongest_object: baseline };

    try {
        const prompt = `
Baseline Object: ${baseline || 'None'}
Player A's Object: ${playerALabel}
Player B's Object: ${playerBLabel}

Rules to enforce strictly:
1. If an object is "unknown", it automatically loses against any valid object.
2. A player ONLY WINS if BOTH of these conditions are true:
    a) Their object would realistically defeat the other player's object in a fight or conceptually.
    b) AND their object is stronger than the Baseline Object (if a Baseline exists).
3. If Player A beats Player B, but Player A does NOT beat the Baseline Object, then Player A DOES NOT WIN.
4. If neither player's object is stronger than the Baseline Object, the result is a "tie".
5. The strongest valid object drawn this round becomes the new strongest_object (even if the round was a tie).

Decide the winner based on conventional logic or physics. Who would win in a fight or which is conceptually stronger? Follow the strict Baseline rules!
`;

        const response = await aiClient.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: "You are a referee for an object scaling battle game. Decide the winner and explain briefly. Return ONLY valid JSON.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        winner: { type: "STRING", enum: ["A", "B", "tie"] },
                        reason: { type: "STRING" },
                        strongest_object: { type: "STRING" }
                    },
                    required: ["winner", "reason", "strongest_object"]
                }
            }
        });

        const resultText = response.text;
        if (resultText) {
            return JSON.parse(resultText);
        }
        return { winner: 'tie', reason: 'AI parsing failed', strongest_object: baseline };
    } catch (error) {
        console.error("Gemini Referee Error:", error);
        return { winner: 'tie', reason: 'AI request failed', strongest_object: baseline };
    }
}

module.exports = {
    classifyDoodle,
    referee,
    normalizeLabel
};
