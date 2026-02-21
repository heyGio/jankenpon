import os
import json
from base64 import b64decode
from io import BytesIO
from PIL import Image

from google import genai
from google.genai import types

# Initialize Gemini Client lazily
client = None

def get_client():
    global client
    if not client:
        api_key = os.environ.get("GEMINI_API_KEY")
        if api_key:
            client = genai.Client(api_key=api_key)
        else:
            client = genai.Client()
    return client

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
        
    try:
        c = get_client()
        response = await c.aio.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        result = json.loads(response.text)
        return result
    except Exception as e:
        print(f"Error parsing Gemini response: {e}")
        return {
            "p1_recognized": "Unknown",
            "p2_recognized": "Unknown",
            "p1_valid": False,
            "p2_valid": False,
            "violation_reason": f"AI Error: {e}",
            "winner": "tie",
            "explanation": "The Judge AI was confused or an error occurred.",
            "new_baseline": baseline
        }

async def generate_cartoon_avatar(concept: str) -> str | None:
    """
    Given a concept, asks Imagen 3 to generate a cartoonish avatar of it.
    Returns the base64 encoded image string, or None if it fails.
    """
    # Don't try to generate images for empty concepts or "Nothing"
    if not concept or concept.lower() == "nothing" or concept.lower() == "unknown":
        return None
        
    prompt = f"A vibrant, cool, cartoonish, and dramatic illustration of: {concept}. Standalone object with a clean background. High quality digital art style, suitable for a video game character portrait."
    
    try:
        c = get_client()
        result = await c.aio.models.generate_images(
            model='imagen-3.0-generate-001',
            prompt=prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                aspect_ratio="1:1",
                output_mime_type="image/jpeg",
                person_generation="DONT_ALLOW"
            )
        )
        for gen_image in result.generated_images:
            return gen_image.image.image_bytes.decode('utf-8') if isinstance(gen_image.image.image_bytes, bytes) else gen_image.image.image_bytes
        return None
    except Exception as e:
        print(f"Error generating image for {concept}: {e}")
        return None

