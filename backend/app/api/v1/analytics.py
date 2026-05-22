from fastapi import APIRouter, Depends, Query
from datetime import datetime, timedelta
from typing import Optional
from app.core.security import get_current_user
from app.core.database import get_database
from app.models.schemas import DashboardStats, FunnelData, DailyActivity, CounselorPerformance
from app.utils.helpers import serialize_docs

router = APIRouter(prefix="/analytics", tags=["Analytics"])

STAGE_ORDER = ["new", "contacted", "interested", "documents_pending", "applied", "converted"]


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """Get all stats for the main dashboard."""
    org_id = current_user.get("organization_id", "default")
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Total leads
    total_leads = await db.leads.count_documents({"organization_id": org_id})

    # New leads today
    new_leads_today = await db.leads.count_documents({
        "organization_id": org_id,
        "created_at": {"$gte": today_start}
    })

    # Converted leads
    converted_leads = await db.leads.count_documents({
        "organization_id": org_id,
        "stage": "converted"
    })

    # Conversion rate
    conversion_rate = (converted_leads / total_leads * 100) if total_leads > 0 else 0.0

    # Tasks
    pending_tasks = await db.tasks.count_documents({
        "organization_id": org_id,
        "status": {"$in": ["pending", "in_progress"]}
    })
    overdue_tasks = await db.tasks.count_documents({
        "organization_id": org_id,
        "due_date": {"$lt": now},
        "status": {"$ne": "done"}
    })

    # Messages today
    messages_today = await db.messages.count_documents({
        "created_at": {"$gte": today_start},
        "direction": "outbound"
    })

    # Revenue estimation (avg $500 per converted lead)
    estimated_revenue = converted_leads * 500.0

    # Funnel data
    funnel_pipeline = [
        {"$match": {"organization_id": org_id}},
        {"$group": {"_id": "$stage", "count": {"$sum": 1}}}
    ]
    funnel_raw = await db.leads.aggregate(funnel_pipeline).to_list(length=20)
    stage_counts = {r["_id"]: r["count"] for r in funnel_raw}
    funnel = [
        FunnelData(
            stage=stage,
            count=stage_counts.get(stage, 0),
            percentage=(stage_counts.get(stage, 0) / total_leads * 100) if total_leads > 0 else 0
        )
        for stage in STAGE_ORDER
    ]

    # Daily activity (last 14 days)
    daily_activity = []
    for i in range(13, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)

        leads_added = await db.leads.count_documents({
            "organization_id": org_id,
            "created_at": {"$gte": day_start, "$lt": day_end}
        })
        msgs_sent = await db.messages.count_documents({
            "created_at": {"$gte": day_start, "$lt": day_end},
            "direction": "outbound"
        })
        tasks_done = await db.tasks.count_documents({
            "organization_id": org_id,
            "status": "done",
            "updated_at": {"$gte": day_start, "$lt": day_end}
        })
        daily_activity.append(DailyActivity(
            date=day_start.strftime("%b %d"),
            leads_added=leads_added,
            messages_sent=msgs_sent,
            tasks_completed=tasks_done,
        ))

    # Counselor performance
    counselors = await db.users.find({
        "organization_id": org_id,
        "role": "counselor",
        "is_active": True
    }).to_list(length=20)

    counselor_performance = []
    for counselor in counselors:
        cid = str(counselor["_id"])
        total = await db.leads.count_documents({"organization_id": org_id, "counselor_id": cid})
        converted = await db.leads.count_documents({
            "organization_id": org_id, "counselor_id": cid, "stage": "converted"
        })
        msgs = await db.messages.count_documents({"sent_by_user_id": cid})
        rate = (converted / total * 100) if total > 0 else 0

        counselor_performance.append(CounselorPerformance(
            counselor_id=cid,
            counselor_name=counselor["name"],
            leads_assigned=total,
            leads_converted=converted,
            conversion_rate=round(rate, 1),
            messages_sent=msgs,
        ))

    return DashboardStats(
        total_leads=total_leads,
        new_leads_today=new_leads_today,
        converted_leads=converted_leads,
        conversion_rate=round(conversion_rate, 1),
        pending_tasks=pending_tasks,
        overdue_tasks=overdue_tasks,
        messages_today=messages_today,
        estimated_revenue=estimated_revenue,
        funnel=funnel,
        daily_activity=daily_activity,
        counselor_performance=counselor_performance,
    )


@router.get("/funnel")
async def get_funnel(
    period_days: int = Query(30, ge=1, le=365),
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """Get lead funnel data for a given time period."""
    org_id = current_user.get("organization_id", "default")
    since = datetime.utcnow() - timedelta(days=period_days)

    pipeline = [
        {"$match": {"organization_id": org_id, "created_at": {"$gte": since}}},
        {"$group": {"_id": "$stage", "count": {"$sum": 1}}}
    ]
    raw = await db.leads.aggregate(pipeline).to_list(length=20)
    stage_counts = {r["_id"]: r["count"] for r in raw}
    total = sum(stage_counts.values())

    return {
        "period_days": period_days,
        "stages": [
            {
                "stage": stage,
                "count": stage_counts.get(stage, 0),
                "percentage": round(stage_counts.get(stage, 0) / total * 100, 1) if total > 0 else 0
            }
            for stage in STAGE_ORDER
        ]
    }


@router.get("/lead-sources")
async def get_lead_sources(
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """Get lead count grouped by source."""
    org_id = current_user.get("organization_id", "default")
    pipeline = [
        {"$match": {"organization_id": org_id}},
        {"$group": {"_id": {"$ifNull": ["$source", "Unknown"]}, "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    results = await db.leads.aggregate(pipeline).to_list(length=20)
    return {"sources": [{"source": r["_id"], "count": r["count"]} for r in results]}


@router.get("/activity-log")
async def get_activity_log(
    limit: int = Query(50, ge=1, le=200),
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """Get recent activity log for the organization."""
    org_id = current_user.get("organization_id", "default")
    logs = await db.activity_logs.find(
        {"organization_id": org_id}
    ).sort("timestamp", -1).limit(limit).to_list(length=limit)
    return {"logs": serialize_docs(logs)}
