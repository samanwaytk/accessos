# Testing

## Frontend

From `frontend`, run `npm run test` for command parsing and `npm run build` for TypeScript and the production bundle.

## Backend

From an activated backend virtual environment, run `python -m pytest`. The suite covers command routing, the health endpoint, a WebSocket command round trip, and invalid WebSocket payload rejection.

## Manual Chrome check

Start both services, open the Vite URL in Chrome, grant microphone permission, select **Start listening**, and say `AccessOS, what can you do?`. Also test a denied microphone permission, the keyboard fallback, stopping listening, and a backend shutdown/restart.
