from app.services.command_service import handle_command


def test_help_command():
    reply = handle_command("what can you do?")
    assert reply.intent == "help"
    assert "AccessOS" in reply.text


def test_camera_not_ready_is_honest():
    reply = handle_command("describe the camera")
    assert reply.intent == "camera_not_ready"
    assert "not connected" in reply.text


def test_unknown_command():
    reply = handle_command("open a portal")
    assert reply.intent == "unknown"


def test_empty_command_is_handled_gracefully():
    reply = handle_command("   ")
    assert reply.intent == "empty"
