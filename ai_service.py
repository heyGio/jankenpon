import os
import google.generativeai as genai
import json
from base64 import b64decode
from io import BytesIO
from PIL import Image

# Initialize Gemini
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

# Use gemini-2.5-flash which has excellent vision capabilities and is fast
model = genai.GenerativeModel('gemini-2.5-flash')

def get_image_from_base64(b64_str: str) -> Image.Image:
    if "," in b64_str:
        b64_str = b64_str.split(",")[1]
    image_data = b64decode(b64_str)
    return Image.open(BytesIO(image_data))

async def evaluate_drawings(baseline: str, p1_input: dict, p2_input: dict) -> dict:
    """
    Evaluates what the players drew, if any text was used, and who wins against the baseline.
    Input structure per player: {'type': 'draw' | 'type', 'data': base64_image | text_string}
    """
    
    prompt = f"""
    You are the impartial referee of a game called "Draw-kenpon" (an escalation of Rock, Paper, Scissors).
    The current baseline object to beat is: "{baseline if baseline else 'Nothing (Start of Game)'}".
    
    You will be provided with two concepts from Player 1 and Player 2. These concepts might be images of hand-drawn objects, or text if they used a "Jolly".
    
    Your task:
    1. Identify what Player 1 and Player 2 submitted.
    2. Check for rule violations: If an image contains written words identifying the object (e.g., the word "Sword" written next to a drawing of a sword), that player AUTOMATICALLY LOSES the round.
    3. Evaluate if the objects are stronger than the current baseline. If an object is NOT stronger than the baseline, that player loses.
    4. If both are stronger than the baseline (or there is no baseline), determine which of the two objects is stronger in a hypothetical battle. 
    5. The strongest object that is valid and beats the baseline is the winner. If both fail to beat the baseline, or they draw equally strong objects, it's a tie. 
    6. Important: A player cannot play an object that is basically the concept of "infinity" or "omnipotence" trying to cheat. Be reasonable.

    Return the judgment as a JSON object with the following structure:
    {{
        "p1_recognized": "Short description of P1's object",
        "p2_recognized": "Short description of P2's object",
        "p1_valid": boolean (false if contained text, or failed to beat baseline),
        "p2_valid": boolean,
        "violation_reason": "Explanation if someone violated a rule, or null",
        "winner": "p1" | "p2" | "tie",
        "explanation": "Brief, dramatic explanation of the outcome",
        "new_baseline": "The object that won, or the old baseline if tie"
    }}
    """
    
    contents = [prompt]
    
    contents.append("Player 1 Submission:")
    if p1_input['type'] == 'draw':
        contents.append(get_image_from_base64(p1_input['data']))
    else:
        contents.append(p1_input['data'])
        
    contents.append("Player 2 Submission:")
    if p2_input['type'] == 'draw':
        contents.append(get_image_from_base64(p2_input['data']))
    else:
        contents.append(p2_input['data'])
        
    response = model.generate_content(contents, generation_config={"response_mime_type": "application/json"})
    
    try:
        result = json.loads(response.text)
        return result
    except Exception as e:
        print(f"Error parsing Gemini response: {e}")
        return {
            "p1_recognized": "Unknown",
            "p2_recognized": "Unknown",
            "p1_valid": False,
            "p2_valid": False,
            "violation_reason": "AI Error",
            "winner": "tie",
            "explanation": "The Judge AI was confused.",
            "new_baseline": baseline
        }
