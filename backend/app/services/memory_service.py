from collections import defaultdict, deque
from datetime import datetime, timezone
from app.schemas.vision import MemoryObservation, Observation


class SessionMemory:
    def __init__(self, limit: int = 10):
        self._items: dict[str, deque[MemoryObservation]] = defaultdict(lambda: deque(maxlen=limit))

    def add(self, session_id: str, scene_summary: str, observations: list[Observation]) -> None:
        self._items[session_id].append(MemoryObservation(
            timestamp=datetime.now(timezone.utc).isoformat(), scene_summary=scene_summary, observations=observations
        ))

    def get(self, session_id: str) -> list[MemoryObservation]:
        return list(self._items.get(session_id, ()))

    def clear(self, session_id: str) -> None:
        self._items.pop(session_id, None)


memory = SessionMemory()
