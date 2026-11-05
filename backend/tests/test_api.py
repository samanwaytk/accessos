from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_websocket_command_round_trip():
    with client.websocket_connect("/api/ws/assistant") as websocket:
        websocket.send_json({
            "type": "command",
            "request_id": "test-help",
            "text": "what can you do?",
        })
        reply = websocket.receive_json()
    assert reply == {
        "type": "assistant_reply",
        "request_id": "test-help",
        "intent": "help",
        "text": "I am AccessOS. This prototype can respond to voice commands. Camera understanding and browser assistance are planned next.",
    }


def test_websocket_rejects_invalid_message():
    with client.websocket_connect("/api/ws/assistant") as websocket:
        websocket.send_json({"type": "command", "text": "missing request id"})
        reply = websocket.receive_json()
    assert reply["type"] == "error"
    assert reply["text"] == "Invalid assistant message."
