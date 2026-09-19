from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from app.firestore.client import get_firestore_client
from app.schemas.thought import ThoughtResponse, ThoughtCreate, ThoughtUpdate


class FirestoreThoughtRepository:
    """
    Direct Firestore repository for synchronized thoughts mapping to PRD §5 & §6 schema:
    - users/{uid}/thoughts/{thoughtId}
    - devices/{deviceId}/thoughts/{thoughtId} (for anonymous captures)
    """
    def __init__(self):
        self.db = get_firestore_client()

    def _get_collection(self, user_id: Optional[str], device_id: str):
        if not self.db:
            return None
        if user_id:
            return self.db.collection("users").document(user_id).collection("thoughts")
        return self.db.collection("devices").document(device_id).collection("thoughts")

    async def save_thought(self, thought: ThoughtResponse) -> None:
        if not self.db:
            return
        col = self._get_collection(thought.user_id, thought.device_id)
        if col:
            doc_ref = col.document(thought.id)
            doc_ref.set(thought.model_dump(mode="json"), merge=True)

    async def get_thought(self, thought_id: str, user_id: Optional[str], device_id: str) -> Optional[Dict[str, Any]]:
        if not self.db:
            return None
        col = self._get_collection(user_id, device_id)
        if col:
            doc = col.document(thought_id).get()
            if doc.exists:
                return doc.to_dict()
        return None

    async def delete_thought(self, thought_id: str, user_id: Optional[str], device_id: str) -> None:
        if not self.db:
            return
        col = self._get_collection(user_id, device_id)
        if col:
            col.document(thought_id).update({
                "is_deleted": True,
                "deleted_at": datetime.now(timezone.utc).isoformat()
            })
