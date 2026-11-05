from dataclasses import dataclass


@dataclass
class AssistantReply:
    text: str
    intent: str


def handle_command(command: str) -> AssistantReply:
    """Small deterministic command handler for the first end-to-end prototype."""
    normalized = " ".join(command.lower().strip().split())

    if not normalized:
        return AssistantReply("I didn't catch that. Please say the command again.", "empty")

    if any(term in normalized for term in ("what can you do", "help", "your features")):
        return AssistantReply(
            "I am AccessOS. This prototype can respond to voice commands. "
            "Camera understanding and browser assistance are planned next.",
            "help",
        )

    if any(term in normalized for term in ("describe the camera", "look around", "what do you see")):
        return AssistantReply(
            "Camera understanding is not connected in this build yet. "
            "It will be added in the camera intelligence phase.",
            "camera_not_ready",
        )

    if any(term in normalized for term in ("stop listening", "go to sleep", "pause listening")):
        return AssistantReply("Okay. I will stop listening now.", "stop_listening")

    if any(term in normalized for term in ("hello", "hi accessos", "hey accessos")):
        return AssistantReply("Hello. I am ready. How can I help?", "greeting")

    return AssistantReply(
        f"You said: {command}. I heard you, but that command is not supported yet.",
        "unknown",
    )
