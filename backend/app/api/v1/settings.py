from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List
from bson import ObjectId
from datetime import datetime
from app.core.security import get_current_user, get_current_admin
from app.core.database import get_database
from app.core.config import settings
from app.utils.helpers import serialize_doc, serialize_docs

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("/profile")
async def get_profile(current_user=Depends(get_current_user)):
    """Get current user profile."""
    return {
        "id": current_user.get("id"),
        "name": current_user.get("name"),
        "email": current_user.get("email"),
        "role": current_user.get("role"),
        "avatar_url": current_user.get("avatar_url"),
        "organization_id": current_user.get("organization_id"),
    }


@router.put("/profile")
async def update_profile(
    payload: dict,
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """Update user profile."""
    allowed = {"name", "avatar_url"}
    update = {k: v for k, v in payload.items() if k in allowed}
    update["updated_at"] = datetime.utcnow()
    await db.users.update_one({"_id": ObjectId(current_user["id"])}, {"$set": update})
    updated = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    return serialize_doc(updated)


@router.get("/team")
async def get_team(current_user=Depends(get_current_user), db=Depends(get_database)):
    """Get all team members."""
    org_id = current_user.get("organization_id", "default")
    members = await db.users.find({"organization_id": org_id, "is_active": True}).to_list(length=100)
    return {"members": serialize_docs(members)}


@router.post("/team/invite")
async def invite_team_member(
    payload: dict,
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """Invite a new team member (admin/manager only)."""
    if current_user.get("role") not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    org_id = current_user.get("organization_id", "default")
    email = payload.get("email")
    role = payload.get("role", "counselor")

    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=409, detail="User already exists")

    from app.core.security import get_password_hash
    now = datetime.utcnow()
    doc = {
        "email": email,
        "name": payload.get("name", email.split("@")[0]),
        "role": role,
        "organization_id": org_id,
        "password_hash": get_password_hash("EduFlow@123"),  # Temp password
        "is_active": True,
        "avatar_url": None,
        "created_at": now,
        "updated_at": now,
    }
    result = await db.users.insert_one(doc)
    doc["_id"] = result.inserted_id

    return {
        "success": True,
        "user": serialize_doc(doc),
        "temp_password": "EduFlow@123",
        "message": "User created. Share the temporary password and ask them to change it."
    }


@router.delete("/team/{user_id}")
async def remove_team_member(
    user_id: str,
    current_user=Depends(get_current_admin),
    db=Depends(get_database),
):
    """Deactivate a team member (admin only)."""
    if user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot remove yourself")

    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
    )
    return {"success": True}


@router.get("/integrations")
async def get_integrations(current_user=Depends(get_current_user)):
    """Get integration status for all connected services."""
    return {
        "whatsapp": {
            "connected": bool(settings.WHATSAPP_ACCESS_TOKEN and settings.WHATSAPP_PHONE_NUMBER_ID),
            "phone_number_id": settings.WHATSAPP_PHONE_NUMBER_ID or None,
        },
        "openai": {
            "connected": bool(settings.OPENAI_API_KEY),
            "provider": settings.AI_PROVIDER,
        },
        "gemini": {
            "connected": bool(settings.GEMINI_API_KEY),
        },
        "google_sheets": {
            "connected": False,  # Will be True after OAuth
            "spreadsheet_id": settings.GOOGLE_SHEETS_SPREADSHEET_ID or None,
        },
    }
