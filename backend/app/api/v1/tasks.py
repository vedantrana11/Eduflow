from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from datetime import datetime, timedelta
from bson import ObjectId
from app.models.schemas import TaskCreate, TaskUpdate, TaskResponse, TaskStatus, PaginatedResponse
from app.core.security import get_current_user
from app.core.database import get_database
from app.utils.helpers import serialize_doc, serialize_docs, log_activity
import math

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.get("", response_model=PaginatedResponse)
async def list_tasks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_to: Optional[str] = None,
    lead_id: Optional[str] = None,
    overdue_only: bool = False,
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """List tasks with filtering and pagination."""
    org_id = current_user.get("organization_id", "default")
    query = {"organization_id": org_id}

    if current_user["role"] == "counselor":
        query["assigned_to"] = current_user["id"]
    elif assigned_to:
        query["assigned_to"] = assigned_to

    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    if lead_id:
        query["lead_id"] = lead_id
    if overdue_only:
        query["due_date"] = {"$lt": datetime.utcnow()}
        query["status"] = {"$ne": TaskStatus.DONE}

    total = await db.tasks.count_documents(query)
    skip = (page - 1) * page_size
    tasks = await db.tasks.find(query).sort("due_date", 1).skip(skip).limit(page_size).to_list(length=page_size)

    serialized = serialize_docs(tasks)

    # Enrich with lead names and assignee names
    for task in serialized:
        if task.get("lead_id"):
            lead = await db.leads.find_one({"_id": ObjectId(task["lead_id"])})
            if lead:
                task["lead_name"] = lead["name"]
        if task.get("assigned_to"):
            user = await db.users.find_one({"_id": ObjectId(task["assigned_to"])})
            if user:
                task["assignee_name"] = user["name"]

        # Auto-mark overdue
        if task.get("due_date") and task["status"] == "pending":
            due = datetime.fromisoformat(task["due_date"].replace("Z", "")) if isinstance(task["due_date"], str) else task["due_date"]
            if due < datetime.utcnow():
                task["status"] = "overdue"

    return PaginatedResponse(
        items=serialized, total=total, page=page,
        page_size=page_size, total_pages=math.ceil(total / page_size)
    )


@router.post("", response_model=dict, status_code=201)
async def create_task(
    payload: TaskCreate,
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """Create a new task or follow-up reminder."""
    org_id = current_user.get("organization_id", "default")
    now = datetime.utcnow()

    doc = {
        **payload.model_dump(),
        "status": TaskStatus.PENDING,
        "organization_id": org_id,
        "created_by": current_user["id"],
        "created_at": now,
        "updated_at": now,
    }
    if not doc.get("assigned_to"):
        doc["assigned_to"] = current_user["id"]

    result = await db.tasks.insert_one(doc)
    doc["_id"] = result.inserted_id

    if payload.lead_id:
        await db.leads.update_one(
            {"_id": ObjectId(payload.lead_id)},
            {"$set": {"follow_up_date": payload.due_date, "updated_at": now}}
        )

    await log_activity(
        db, "task", str(result.inserted_id), "task_created",
        current_user["id"], org_id, {"title": payload.title}
    )
    return serialize_doc(doc)


@router.get("/upcoming")
async def get_upcoming_tasks(
    days: int = Query(7, ge=1, le=30),
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """Get tasks due within the next N days."""
    org_id = current_user.get("organization_id", "default")
    now = datetime.utcnow()
    end = now + timedelta(days=days)

    query = {
        "organization_id": org_id,
        "due_date": {"$gte": now, "$lte": end},
        "status": {"$ne": TaskStatus.DONE},
    }
    if current_user["role"] == "counselor":
        query["assigned_to"] = current_user["id"]

    tasks = await db.tasks.find(query).sort("due_date", 1).to_list(length=50)
    return {"tasks": serialize_docs(tasks), "count": len(tasks)}


@router.put("/{task_id}", response_model=dict)
async def update_task(
    task_id: str,
    payload: TaskUpdate,
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """Update a task."""
    task = await db.tasks.find_one({"_id": ObjectId(task_id)})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()

    await db.tasks.update_one({"_id": ObjectId(task_id)}, {"$set": update_data})

    if payload.status == TaskStatus.DONE:
        await log_activity(
            db, "task", task_id, "task_completed",
            current_user["id"], current_user.get("organization_id", "default"), {}
        )

    updated = await db.tasks.find_one({"_id": ObjectId(task_id)})
    return serialize_doc(updated)


@router.delete("/{task_id}", status_code=204)
async def delete_task(
    task_id: str,
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """Delete a task."""
    result = await db.tasks.delete_one({"_id": ObjectId(task_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")


@router.post("/{task_id}/complete", response_model=dict)
async def complete_task(
    task_id: str,
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """Mark a task as complete."""
    await db.tasks.update_one(
        {"_id": ObjectId(task_id)},
        {"$set": {"status": TaskStatus.DONE, "completed_at": datetime.utcnow(), "updated_at": datetime.utcnow()}}
    )
    updated = await db.tasks.find_one({"_id": ObjectId(task_id)})
    return serialize_doc(updated)
