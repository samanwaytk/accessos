# Privacy

Microphone use starts only after the user selects **Start listening** and grants Chrome permission. Milestone 1 sends recognized command text to the local FastAPI backend over `ws://127.0.0.1`; it does not store audio, camera frames, or transcripts.

No API keys are exposed to the frontend. Future camera, OCR, cloud vision, and browser-sharing features require separate consent, configuration, and privacy review.
