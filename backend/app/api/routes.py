import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import ValidationError
from app.schemas.messages import (
    AssistantReplyMessage,
    CommandMessage,
    ErrorMessage,
    PingMessage,
    PongMessage,
    incoming_message_adapter,
)
from app.services.command_service import handle_command
from app.schemas.vision import AnalyzeRequest, AnalyzeResponse, MemoryResponse
from app.services.memory_service import memory
from app.services.vision_service import analyze_image, validate_image

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/health")
async def health():
    return {"status": "ok", "service": "accessos-api", "version": "2.0.0"}


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    validate_image(request.image)
    history = memory.get(request.session_id)
    answer, scene_summary, observations = await analyze_image(request.image, request.question, history, request.mode)
    memory.add(request.session_id, scene_summary, observations)
    return AnalyzeResponse(answer=answer, scene_summary=scene_summary, observations=observations, memory_used=bool(history))


@router.get("/memory/{session_id}", response_model=MemoryResponse)
async def get_memory(session_id: str):
    return MemoryResponse(observations=memory.get(session_id))


@router.post("/memory/{session_id}/clear")
async def clear_memory(session_id: str):
    memory.clear(session_id)
    return {"status": "cleared"}


@router.websocket("/ws/assistant")
async def assistant_socket(websocket: WebSocket):
    await websocket.accept()
    logger.info("Assistant WebSocket connected")
    try:
        while True:
            try:
                message = incoming_message_adapter.validate_python(await websocket.receive_json())
            except (TypeError, ValueError, ValidationError):
                logger.warning("Rejected invalid assistant WebSocket message")
                await websocket.send_json(ErrorMessage(text="Invalid assistant message.").model_dump())
                continue

            if isinstance(message, CommandMessage):
                reply = handle_command(message.text)
                response = AssistantReplyMessage(
                    request_id=message.request_id,
                    text=reply.text,
                    intent=reply.intent,
                )
                await websocket.send_json(response.model_dump())
            elif isinstance(message, PingMessage):
                await websocket.send_json(PongMessage(request_id=message.request_id).model_dump())
    except WebSocketDisconnect:
        logger.info("Assistant WebSocket disconnected")
