from fastapi import APIRouter, HTTPException, Depends, Query, status
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from app.models.schemas import (
    LeadCreate, LeadUpdate, LeadResponse, LeadNoteCreate,
    LeadStage, PaginatedResponse
)
from app.core.security import get_current_user
from app.core.database import get_database
from app.utils.helpers import serialize_doc, serialize_docs, log_activity
import math

router = APIRouter(prefix="/leads", tags=["Leads"])


def build_lead_filter(
    organization_id: str,
    stage: Optional[str] = None,
    counselor_id: Optional[str] = None,
    search: Optional[str] = None,
    country: Optional[str] = None,
    source: Optional[str] = None,
):
    query = {"organization_id": organization_id}
    if stage:
        query["stage"] = stage
    if counselor_id:
        query["counselor_id"] = counselor_id
    if country:
        query["country_interest"] = {"$regex": country, "$options": "i"}
    if source:
        query["source"] = source
    if search:
        query["$text"] = {"$search": search}
    return query


@router.get("", response_model=PaginatedResponse)
async def list_leads(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    stage: Optional[str] = None,
    counselor_id: Optional[str] = None,
    search: Optional[str] = None,
    country: Optional[str] = None,
    source: Optional[str] = None,
    sort_by: str = Query("created_at", pattern="^(created_at|score|name|stage)$"),
    sort_order: int = Query(-1, ge=-1, le=1),
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """List leads with filtering, searching and pagination."""
    org_id = current_user.get("organization_id", "default")

    # Counselors can only see their own leads
    if current_user["role"] == "counselor":
        counselor_id = current_user["id"]

    query = build_lead_filter(org_id, stage, counselor_id, search, country, source)
    total = await db.leads.count_documents(query)

    skip = (page - 1) * page_size
    cursor = db.leads.find(query).sort(sort_by, sort_order).skip(skip).limit(page_size)
    leads = await cursor.to_list(length=page_size)
    serialized = serialize_docs(leads)

    # Enrich with counselor names
    counselor_ids = list({l["counselor_id"] for l in serialized if l.get("counselor_id")})
    if counselor_ids:
        counselors = await db.users.find(
            {"_id": {"$in": [ObjectId(cid) for cid in counselor_ids]}}
        ).to_list(length=100)
        counselor_map = {str(c["_id"]): c["name"] for c in counselors}
        for lead in serialized:
            if lead.get("counselor_id"):
                lead["counselor_name"] = counselor_map.get(lead["counselor_id"])

    return PaginatedResponse(
        items=serialized,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size),
    )


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_lead(
    payload: LeadCreate,
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """Create a new lead."""
    org_id = current_user.get("organization_id", "default")
    now = datetime.utcnow()

    # Check duplicate phone
    existing = await db.leads.find_one({"phone": payload.phone, "organization_id": org_id})
    if existing:
        raise HTTPException(status_code=409, detail="A lead with this phone number already exists")

    doc = {
        **payload.model_dump(),
        "organization_id": org_id,
        "score": 0,
        "notes": [],
        "whatsapp_thread_id": None,
        "last_contacted_at": None,
        "created_at": now,
        "updated_at": now,
    }
    result = await db.leads.insert_one(doc)
    doc["_id"] = result.inserted_id

    await log_activity(
        db, "lead", str(result.inserted_id), "lead_created",
        current_user["id"], org_id, {"name": payload.name, "stage": payload.stage}
    )
    return serialize_doc(doc)


@router.get("/{lead_id}", response_model=dict)
async def get_lead(
    lead_id: str,
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """Get a single lead by ID."""
    lead = await db.leads.find_one({"_id": ObjectId(lead_id)})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    serialized = serialize_doc(lead)

    # Fetch counselor info
    if serialized.get("counselor_id"):
        counselor = await db.users.find_one({"_id": ObjectId(serialized["counselor_id"])})
        if counselor:
            serialized["counselor_name"] = counselor["name"]

    # Fetch recent messages
    messages_cursor = db.messages.find({"lead_id": lead_id}).sort("created_at", -1).limit(20)
    serialized["recent_messages"] = serialize_docs(await messages_cursor.to_list(length=20))

    # Fetch activity log
    logs_cursor = db.activity_logs.find({"entity_id": lead_id}).sort("timestamp", -1).limit(20)
    serialized["activity_log"] = serialize_docs(await logs_cursor.to_list(length=20))

    return serialized


@router.put("/{lead_id}", response_model=dict)
async def update_lead(
    lead_id: str,
    payload: LeadUpdate,
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """Update a lead."""
    lead = await db.leads.find_one({"_id": ObjectId(lead_id)})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()

    # Track stage change
    old_stage = lead.get("stage")
    new_stage = update_data.get("stage")

    await db.leads.update_one({"_id": ObjectId(lead_id)}, {"$set": update_data})

    if new_stage and new_stage != old_stage:
        await log_activity(
            db, "lead", lead_id, "stage_changed",
            current_user["id"], current_user.get("organization_id", "default"),
            {"from": old_stage, "to": new_stage}
        )

    updated = await db.leads.find_one({"_id": ObjectId(lead_id)})
    return serialize_doc(updated)


@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lead(
    lead_id: str,
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """Delete a lead (soft-delete by marking inactive)."""
    result = await db.leads.delete_one({"_id": ObjectId(lead_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")

    await log_activity(
        db, "lead", lead_id, "lead_deleted",
        current_user["id"], current_user.get("organization_id", "default"), {}
    )


@router.post("/{lead_id}/notes", response_model=dict)
async def add_note(
    lead_id: str,
    payload: LeadNoteCreate,
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """Add a note to a lead."""
    note = {
        "content": payload.content,
        "created_by": current_user["id"],
        "creator_name": current_user.get("name", "Unknown"),
        "created_at": datetime.utcnow().isoformat(),
    }
    await db.leads.update_one(
        {"_id": ObjectId(lead_id)},
        {"$push": {"notes": note}, "$set": {"updated_at": datetime.utcnow()}},
    )
    await log_activity(
        db, "lead", lead_id, "note_added",
        current_user["id"], current_user.get("organization_id", "default"),
        {"preview": payload.content[:80]}
    )
    updated = await db.leads.find_one({"_id": ObjectId(lead_id)})
    return serialize_doc(updated)


@router.post("/{lead_id}/assign", response_model=dict)
async def assign_counselor(
    lead_id: str,
    counselor_id: str,
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """Assign a counselor to a lead."""
    counselor = await db.users.find_one({"_id": ObjectId(counselor_id)})
    if not counselor:
        raise HTTPException(status_code=404, detail="Counselor not found")

    await db.leads.update_one(
        {"_id": ObjectId(lead_id)},
        {"$set": {"counselor_id": counselor_id, "updated_at": datetime.utcnow()}}
    )
    await log_activity(
        db, "lead", lead_id, "counselor_assigned",
        current_user["id"], current_user.get("organization_id", "default"),
        {"counselor_name": counselor["name"]}
    )
    updated = await db.leads.find_one({"_id": ObjectId(lead_id)})
    return serialize_doc(updated)


@router.get("/pipeline/summary", response_model=dict)
async def get_pipeline_summary(
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """Get count of leads per pipeline stage."""
    org_id = current_user.get("organization_id", "default")
    pipeline = [
        {"$match": {"organization_id": org_id}},
        {"$group": {"_id": "$stage", "count": {"$sum": 1}}},
    ]
    results = await db.leads.aggregate(pipeline).to_list(length=20)
    return {r["_id"]: r["count"] for r in results}
