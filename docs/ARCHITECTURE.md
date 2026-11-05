# Architecture

AccessOS V2 is a local React/Vite web application paired with a local FastAPI service.

## Voice core

Chrome Web Speech API receives microphone transcripts after the user explicitly starts listening. The frontend detects the transcript-based `AccessOS` wake phrase, sends the extracted command through a WebSocket, and speaks the validated backend reply with browser SpeechSynthesis.

`frontend/src/services/accessosSocket.ts` owns WebSocket connection state, bounded reconnect attempts, request correlation, and timeouts. `backend/app/schemas/messages.py` validates each inbound message before `command_service` routes it.

Camera, OCR, vision providers, and the Chrome extension are intentionally outside Milestone 1.

## Privacy boundaries

The browser owns microphone permissions and SpeechSynthesis. The backend receives only command text in Milestone 1 and does not persist audio or camera data.
