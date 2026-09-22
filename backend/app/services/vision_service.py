import os
from google import genai
from google.genai import types
import json

import httpx

def get_client():
    api_key = os.environ.get("VISION_API_KEY") or os.environ.get("GEMINI_API_KEY")
    http_client = httpx.Client(verify=False)
    return genai.Client(api_key=api_key, http_options={'httpx_client': http_client})

def analyze_image(image_bytes: bytes, mime_type: str, user_query: str = None) -> dict:
    """
    Analyzes an image using Gemini Pro Vision to extract text, understand structure,
    prioritize relevant information, and generate a concise response.
    """
    client = get_client()
    
    # We use gemini-3.5-flash as it's fast and excellent at multimodal tasks
    model = 'gemini-3.5-flash'
    
    system_instruction = """
    You are AccessOS, an AI accessibility assistant for blind and visually impaired users.
    Your job is to See, Understand, Prioritize, and Explain the provided image.
    
    Analyze the image and return a JSON object with the following schema:
    {
      "success": true/false (true if image is understandable, false if blurry or unreadable),
      "context": "string (e.g., 'Shopping Page', 'Registration Form', 'Warning Dialog')",
      "summary": "string (A brief 1-sentence summary of what this is)",
      "important_information": ["array", "of", "strings", "highlighting actionable or critical information"],
      "confidence": float (0.0 to 1.0, where < 0.5 means you aren't sure),
      "response": "string (The concise, natural language explanation to be spoken to the user. Do NOT just list text. Explain what is happening and what the user needs to know. Prioritize actionable and critical information.)",
      "needs_retry": true/false (true if the image is too blurry/unclear to give a confident answer)
    }
    
    If a user_query is provided, tailor your 'response' and 'important_information' to answer their question directly.
    Do NOT invent information. If you cannot read it clearly, set confidence low, needs_retry to true, and explain that in the response.
    """
    
    prompt = "Please analyze this image."
    if user_query:
        prompt = f"The user asked: '{user_query}'. Please analyze the image to answer this."

    import time
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model=model,
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                    prompt
                ],
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                )
            )
            
            # Parse the JSON response
            text = response.text.strip()
            if text.startswith('```json'):
                text = text[7:]
            if text.startswith('```'):
                text = text[3:]
            if text.endswith('```'):
                text = text[:-3]
            result = json.loads(text.strip())
            return result
        except Exception as e:
            if "503" in str(e) and attempt < 2:
                time.sleep(2)
                continue
                
            import traceback
            with open("error_log.txt", "w") as f:
                f.write(traceback.format_exc())
            print(f"Error calling Gemini Vision API: {e}")
            
            if "503" in str(e):
                return {
                    "success": False,
                    "context": "unknown",
                    "summary": "",
                    "important_information": [],
                    "confidence": 0.0,
                    "response": "The AI service is currently experiencing high demand. Please try again in a few moments.",
                    "needs_retry": False
                }
            
            return {
                "success": False,
                "context": "unknown",
                "summary": "",
                "important_information": [],
                "confidence": 0.0,
                "response": "I'm sorry, I encountered an error while trying to analyze the image.",
                "needs_retry": True
            }
