from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from app.models.schemas import AnalyzeResponse
from app.services import vision_service, context_store

router = APIRouter()

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_visual_input(
    image: UploadFile = File(...),
    user_query: Optional[str] = Form(None)
):
    try:
        # Read image data
        image_bytes = await image.read()
        mime_type = image.content_type
        
        if not mime_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File provided is not an image.")

        # Analyze using Vision service
        result = vision_service.analyze_image(image_bytes, mime_type, user_query)
        
        # Save context for follow-up questions
        context_id = context_store.save_context(result)
        result["context_id"] = context_id
        
        return AnalyzeResponse(**result)

    except Exception as e:
        print(f"Error in analyze route: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during analysis.")
