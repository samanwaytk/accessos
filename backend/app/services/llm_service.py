import os
from google import genai
from google.genai import types

def answer_followup(question: str, context_data: dict) -> dict:
    """
    Answers a follow-up question based on the previous image analysis context.
    """
    client = get_client()
    model = 'gemini-3.6-flash'
    
    system_instruction = """
    You are AccessOS, an AI accessibility assistant for blind and visually impaired users.
    You previously analyzed an image and found the following context:
    """
    
    # Inject context into the prompt
    context_str = f"""
    Context: {context_data.get('context', 'Unknown')}
    Summary: {context_data.get('summary', '')}
    Important Info: {', '.join(context_data.get('important_information', []))}
    Previous Response to User: {context_data.get('response', '')}
    """
    
    prompt = f"""
    {system_instruction}
    {context_str}
    
    The user is now asking a follow-up question: "{question}"
    
    Please answer concisely in a way that is easy to understand via voice output.
    If you do not know the answer based on the provided context, state that clearly and do not hallucinate.
    
    Return a JSON object with this schema:
    {{
       "answer": "string (the natural language answer)",
       "confidence": float (0.0 to 1.0)
    }}
    """
    
    try:
        response = client.models.generate_content(
            model=model,
            contents=[prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            )
        )
        import json
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
        print(f"Error calling Gemini API for follow-up: {e}")
        return {
            "answer": "I'm sorry, I couldn't process your question at the moment.",
            "confidence": 0.0
        }

def get_client():
    api_key = os.environ.get("LLM_API_KEY") or os.environ.get("VISION_API_KEY") or os.environ.get("GEMINI_API_KEY")
    return genai.Client(api_key=api_key)
