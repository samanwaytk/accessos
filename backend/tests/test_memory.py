from app.schemas.vision import Observation
from app.services.memory_service import SessionMemory


def test_session_memory_is_bounded_and_clearable():
    memory = SessionMemory(limit=2)
    memory.add("demo", "desk", [Observation(name="keys", position="left")])
    memory.add("demo", "door", [])
    memory.add("demo", "sofa", [])
    observations = memory.get("demo")
    assert [item.scene_summary for item in observations] == ["door", "sofa"]
    memory.clear("demo")
    assert memory.get("demo") == []
