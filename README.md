# AccessOS V2 — Voice-first accessibility assistant

AccessOS is an AI-powered accessibility platform designed for visually impaired users. It uses computer vision and AI to analyze images and provide meaningful descriptions and answers to user queries through voice-based interaction. This repository currently implements only the first, local voice-core milestone:

**Automatic speech recognition → voice/camera command handling → FastAPI → spoken response**

It is intentionally a working foundation, not a claim that all planned AI features are already implemented. Camera understanding and Chrome page intelligence are documented as later phases.

## Requirements

- Windows 10/11
- Python 3.12+ (tested with Python 3.14.2)
- Node.js 20+
- Google Chrome (recommended)
- Microphone and speakers/headphones

## 1. Start the backend

Open PowerShell in the project folder:

```powershell
cd accessos-v2\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

If PowerShell blocks activation, run this once in that terminal:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Backend health check: http://127.0.0.1:8000/api/health

## 2. Start the frontend

Open a **second** PowerShell terminal:

```powershell
cd accessos-v2\frontend
npm install
npm run dev
```

Open the local URL printed by Vite (usually http://localhost:5173).

## Vision configuration

Copy `backend/.env.example` to `backend/.env` and set `VISION_API_KEY` and
`VISION_MODEL` to a vision-capable model available from your provider. Keep this
file on the backend only. `VISION_BASE_URL` defaults to the OpenAI-compatible
chat-completions endpoint (`https://api.openai.com/v1`) and can be changed for a
compatible provider. Without these settings, camera analysis clearly reports
that vision has not been configured; it never returns a fabricated result.

## 3. Run automated checks

```powershell
# frontend
cd accessos-v2\frontend
npm run test
npm run build

# backend, after activating its virtual environment
cd ..\backend
python -m pytest -q
```

## 4. Try the voice loop

1. Allow microphone permission in Chrome.
2. Grant microphone permission; AccessOS begins listening automatically. The microphone button mutes or resumes it.
3. Say **“Start camera”** and grant camera permission, then say **“Capture”**.
4. Ask a question such as “Where is my water bottle?” or type it using the keyboard fallback. The current captured frame is used.
5. The assistant replies aloud and shows the transcript/status on screen. Use
   **Clear session memory** to discard the bounded in-memory observation history.

### Supported voice commands

- **Start/open camera** — enables the camera after browser permission is granted.
- **Stop/close camera** — stops the stream and releases the camera.
- **Capture**, **take a picture**, or **capture image** — captures and analyzes the active camera view.
- **Clear session memory** or **forget everything you saw** — clears only the current visual-memory session.
- **Read this page**, **read the text in front of me**, **read this label**, or **what is written here** — reads clearly visible text from the current captured frame in reading order.

For the first prototype, Chrome's Web Speech API is used. Browser support and recognition quality vary, and recognition may use a remote browser service; this is not guaranteed to work offline. No wake phrase is required, and the browser tab must remain open and active.

## Project structure

```text
accessos-v2/
├── backend/
│   ├── app/
│   │   ├── api/routes.py
│   │   ├── core/config.py
│   │   ├── services/command_service.py
│   │   └── main.py
│   ├── tests/test_commands.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/StatusPanel.tsx
│   │   ├── hooks/useSpeechRecognition.ts
│   │   ├── services/accessosSocket.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── styles.css
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── docs/ROADMAP.md
```

## Current scope and limitations

- Implemented: local React UI, FastAPI health endpoint, validated WebSocket request/response protocol, basic command responses, browser speech recognition, browser speech synthesis, keyboard fallback, and bounded WebSocket reconnection.
- Implemented: on-demand camera capture, configurable provider-backed vision analysis,
  visual questions about the captured frame, and a bounded per-session observation memory.
- Not implemented yet: dedicated Porcupine wake-word model, Chrome extension,
  arbitrary-tab inspection, and offline speech recognition.
- This is not an assistive navigation or obstacle-avoidance system.
- The assistant does not make purchases, submit forms, or change files.
- Chrome may use a remote recognition service; voice recognition is not guaranteed to work offline. Text extraction is vision-model based, so small or blurry text may be reported as unreadable rather than guessed.

## Troubleshooting

- **Microphone unavailable:** use Chrome, check site microphone permission, and close other apps using the mic.
- **Speech recognition unsupported:** use a current Chrome version. The app displays a browser support warning if the API is missing.
- **WebSocket disconnected:** ensure the backend is running on `127.0.0.1:8000`.
- **Port already in use:** stop the process using the port or change the backend port and update `VITE_WS_URL` in `frontend/.env`.
