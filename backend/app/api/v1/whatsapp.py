from fastapi import APIRouter, HTTPException, Depends, Request, Header
from typing import Optional
from datetime import datetime
from bson import ObjectId
import httpx
from app.models.schemas import MessageCreate, BulkMessageCreate, MessageStatus, MessageDirection
from app.core.security import get_current_user
from app.core.database import get_database
from app.core.config import settings
from app.utils.helpers import serialize_doc, serialize_docs, log_activity

router = APIRouter(prefix="/whatsapp", tags=["WhatsApp"])

WA_BASE_URL = f"https://graph.facebook.com/{settings.WHATSAPP_API_VERSION}"


async def send_whatsapp_message(phone: str, message: str, template_name: Optional[str] = None, template_params: Optional[list] = None) -> dict:
    """Send a WhatsApp message via Meta Cloud API."""
    if not settings.WHATSAPP_ACCESS_TOKEN or settings.WHATSAPP_ACCESS_TOKEN == "your_whatsapp_access_token" or not settings.WHATSAPP_PHONE_NUMBER_ID:
        # Return mock response if not configured

        return {
            "messages": [{"id": f"mock_msg_{datetime.utcnow().timestamp()}"}],
            "mock": True,
        }

    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }

    if template_name:
        payload = {
            "messaging_product": "whatsapp",
            "to": phone,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {"code": "en"},
                "components": [
                    {
                        "type": "body",
                        "parameters": [{"type": "text", "text": p} for p in (template_params or [])],
                    }
                ] if template_params else [],
            },
        }
    else:
        payload = {
            "messaging_product": "whatsapp",
            "to": phone,
            "type": "text",
            "text": {"body": message},
        }

    url = f"{WA_BASE_URL}/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(url, headers=headers, json=payload)
        if response.status_code not in (200, 201):
            raise HTTPException(status_code=502, detail=f"WhatsApp API error: {response.text}")
        return response.json()


@router.get("/webhook")
async def verify_webhook(
    hub_mode: str = Header(None, alias="hub.mode"),
    hub_challenge: str = Header(None, alias="hub.challenge"),
    hub_verify_token: str = Header(None, alias="hub.verify_token"),
):
    """Meta webhook verification endpoint."""
    if hub_mode == "subscribe" and hub_verify_token == settings.WHATSAPP_VERIFY_TOKEN:
        return int(hub_challenge)
    raise HTTPException(status_code=403, detail="Webhook verification failed")


@router.post("/webhook")
async def receive_webhook(request: Request, db=Depends(get_database)):
    """Receive incoming WhatsApp messages from Meta webhook."""
    body = await request.json()
    try:
        entry = body.get("entry", [{}])[0]
        changes = entry.get("changes", [{}])[0]
        value = changes.get("value", {})
        messages = value.get("messages", [])

        for msg in messages:
            phone = msg.get("from")
            wa_msg_id = msg.get("id")
            content = msg.get("text", {}).get("body", "")

            # Find lead by phone number
            lead = await db.leads.find_one({"phone": phone})
            lead_id = str(lead["_id"]) if lead else None

            await db.messages.insert_one({
                "lead_id": lead_id,
                "phone": phone,
                "direction": MessageDirection.INBOUND,
                "content": content,
                "type": "text",
                "whatsapp_message_id": wa_msg_id,
                "status": MessageStatus.DELIVERED,
                "sent_by_user_id": None,
                "created_at": datetime.utcnow(),
            })

            if lead:
                await db.leads.update_one(
                    {"_id": lead["_id"]},
                    {"$set": {"last_contacted_at": datetime.utcnow()}}
                )
    except Exception:
        pass  # Non-blocking webhook processing

    return {"status": "ok"}


@router.post("/send")
async def send_message(
    payload: MessageCreate,
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """Send a WhatsApp message to a lead."""
    lead = await db.leads.find_one({"_id": ObjectId(payload.lead_id)})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    phone = lead["phone"]
    wa_response = await send_whatsapp_message(
        phone, payload.content, payload.template_name,
        list(payload.template_params.values()) if payload.template_params else None
    )

    wa_msg_id = wa_response.get("messages", [{}])[0].get("id")
    status = MessageStatus.SENT if not wa_response.get("mock") else MessageStatus.QUEUED

    msg_doc = {
        "lead_id": payload.lead_id,
        "direction": MessageDirection.OUTBOUND,
        "content": payload.content,
        "type": payload.type,
        "template_name": payload.template_name,
        "whatsapp_message_id": wa_msg_id,
        "status": status,
        "sent_by_user_id": current_user["id"],
        "created_at": datetime.utcnow(),
    }
    result = await db.messages.insert_one(msg_doc)

    await db.leads.update_one(
        {"_id": ObjectId(payload.lead_id)},
        {"$set": {"last_contacted_at": datetime.utcnow()}}
    )

    await log_activity(
        db, "message", str(result.inserted_id), "message_sent",
        current_user["id"], current_user.get("organization_id", "default"),
        {"lead_id": payload.lead_id, "lead_name": lead.get("name")}
    )

    msg_doc["_id"] = result.inserted_id
    return serialize_doc(msg_doc)


@router.post("/bulk-send")
async def bulk_send(
    payload: BulkMessageCreate,
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """Send a WhatsApp message to multiple leads."""
    results = {"sent": 0, "failed": 0, "details": []}

    for lead_id in payload.lead_ids:
        try:
            lead = await db.leads.find_one({"_id": ObjectId(lead_id)})
            if not lead:
                results["failed"] += 1
                continue

            await send_whatsapp_message(lead["phone"], payload.content)
            await db.messages.insert_one({
                "lead_id": lead_id,
                "direction": MessageDirection.OUTBOUND,
                "content": payload.content,
                "type": payload.type,
                "status": MessageStatus.SENT,
                "sent_by_user_id": current_user["id"],
                "created_at": datetime.utcnow(),
            })
            results["sent"] += 1
            results["details"].append({"lead_id": lead_id, "status": "sent"})
        except Exception as e:
            results["failed"] += 1
            results["details"].append({"lead_id": lead_id, "status": "failed", "error": str(e)})

    return results


@router.get("/conversations/{lead_id}")
async def get_conversation(
    lead_id: str,
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """Get all messages for a lead (conversation thread)."""
    messages = await db.messages.find(
        {"lead_id": lead_id}
    ).sort("created_at", 1).to_list(length=200)
    return {"messages": serialize_docs(messages)}


@router.get("/conversations")
async def list_conversations(
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """Get latest conversation per lead (inbox view)."""
    org_id = current_user.get("organization_id", "default")

    # Aggregate last message per lead
    pipeline = [
        {"$sort": {"created_at": -1}},
        {"$group": {
            "_id": "$lead_id",
            "last_message": {"$first": "$content"},
            "last_message_at": {"$first": "$created_at"},
            "unread_count": {"$sum": {"$cond": [{"$eq": ["$direction", "inbound"]}, 1, 0]}},
        }},
        {"$sort": {"last_message_at": -1}},
        {"$limit": 50},
    ]
    conversations = await db.messages.aggregate(pipeline).to_list(length=50)

    # Enrich with lead info
    enriched = []
    for conv in conversations:
        if conv["_id"]:
            lead = await db.leads.find_one({"_id": ObjectId(conv["_id"])})
            if lead:
                lead_data = serialize_doc(lead)
                enriched.append({
                    "lead_id": conv["_id"],
                    "lead_name": lead_data["name"],
                    "lead_phone": lead_data["phone"],
                    "lead_stage": lead_data["stage"],
                    "last_message": conv["last_message"],
                    "last_message_at": conv["last_message_at"].isoformat() if conv["last_message_at"] else None,
                    "unread_count": conv["unread_count"],
                })
    return {"conversations": enriched}


@router.get("/templates")
async def get_templates(current_user=Depends(get_current_user)):
    """Get available WhatsApp message templates."""
    # Returns built-in templates — expand with actual Meta API call if needed
    return {
        "templates": [
            {
                "name": "follow_up_reminder",
                "display_name": "Follow-up Reminder",
                "body": "Hi {{1}}, this is a follow-up from EduFlow. Have you had a chance to review the information we sent?",
                "params": ["student_name"],
            },
            {
                "name": "document_reminder",
                "display_name": "Document Submission Reminder",
                "body": "Hi {{1}}, we noticed your documents are still pending. Please submit them by {{2}} to continue your application.",
                "params": ["student_name", "deadline"],
            },
            {
                "name": "application_update",
                "display_name": "Application Status Update",
                "body": "Great news {{1}}! Your application to {{2}} has been updated. Please login to check the status.",
                "params": ["student_name", "university"],
            },
            {
                "name": "welcome_message",
                "display_name": "Welcome Message",
                "body": "Welcome to EduFlow AI, {{1}}! We're excited to help you with your education journey. Your counselor will reach out shortly.",
                "params": ["student_name"],
            },
        ]
    }
