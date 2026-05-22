"""
Utility helpers for serializing MongoDB documents to JSON-safe dicts.
"""
from typing import Any, Dict, List, Optional
from bson import ObjectId
from datetime import datetime


def serialize_doc(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Convert a single MongoDB document to a JSON-serializable dict."""
    if doc is None:
        return None
    result = {}
    for key, value in doc.items():
        if key == "_id":
            result["id"] = str(value)
        elif isinstance(value, ObjectId):
            result[key] = str(value)
        elif isinstance(value, datetime):
            result[key] = value.isoformat()
        elif isinstance(value, list):
            result[key] = [serialize_doc(item) if isinstance(item, dict) else item for item in value]
        elif isinstance(value, dict):
            result[key] = serialize_doc(value)
        else:
            result[key] = value
    return result


def serialize_docs(docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Serialize a list of MongoDB documents."""
    return [serialize_doc(doc) for doc in docs if doc is not None]


async def log_activity(
    db,
    entity_type: str,
    entity_id: str,
    action: str,
    performed_by: str,
    organization_id: str,
    metadata: Dict[str, Any] = None,
):
    """Append an activity log entry."""
    await db.activity_logs.insert_one(
        {
            "entity_type": entity_type,
            "entity_id": entity_id,
            "action": action,
            "performed_by": performed_by,
            "organization_id": organization_id,
            "metadata": metadata or {},
            "timestamp": datetime.utcnow(),
        }
    )
