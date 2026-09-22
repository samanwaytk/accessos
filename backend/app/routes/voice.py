from fastapi import APIRouter, HTTPException
from app.models.schemas import AskRequest, AskResponse
from app.services import llm_service, context_store

router = APIRouter()

@router.post("/ask", response_model=AskResponse)
async def ask_followup(request: AskRequest):
    try:
        # Retrieve context
        context_data = context_store.get_context(request.context_id)
        if not context_data:
            return AskResponse(
                answer="I'm sorry, I don't remember the previous image context. Please upload or capture the image again.",
                confidence=0.0
            )

        # Process with LLM
        result = llm_service.answer_followup(request.question, context_data)
        
        return AskResponse(**result)
        
    except Exception as e:
        print(f"Error in ask route: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during question processing.")
