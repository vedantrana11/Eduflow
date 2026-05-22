from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from app.core.security import get_current_user, get_current_admin
from app.core.database import get_database
from app.core.config import settings
from app.utils.helpers import serialize_doc, serialize_docs
import httpx

router = APIRouter(prefix="/sheets", tags=["Google Sheets"])


async def get_sheets_service():
    """Get authenticated Google Sheets service."""
    try:
        import os
        from google.auth.transport.requests import Request
        from google.oauth2.credentials import Credentials
        from google_auth_oauthlib.flow import InstalledAppFlow
        from googleapiclient.discovery import build

        SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]
        creds = None

        if os.path.exists(settings.GOOGLE_SHEETS_TOKEN_FILE):
            creds = Credentials.from_authorized_user_file(settings.GOOGLE_SHEETS_TOKEN_FILE, SCOPES)

        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                return None  # Not authenticated

        return build("sheets", "v4", credentials=creds)
    except Exception:
        return None


@router.post("/export")
async def export_leads_to_sheets(
    spreadsheet_id: Optional[str] = None,
    sheet_name: str = "EduFlow Leads",
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """Export all leads to Google Sheets."""
    org_id = current_user.get("organization_id", "default")
    sid = spreadsheet_id or settings.GOOGLE_SHEETS_SPREADSHEET_ID

    leads = await db.leads.find({"organization_id": org_id}).to_list(length=5000)
    serialized = serialize_docs(leads)

    # Build sheet rows
    headers = [
        "ID", "Name", "Email", "Phone", "Country Interest", "Course Interest",
        "Stage", "Score", "Source", "Counselor ID", "Follow-up Date",
        "Last Contacted", "Created At", "Tags"
    ]
    rows = [headers]
    for lead in serialized:
        rows.append([
            lead.get("id", ""),
            lead.get("name", ""),
            lead.get("email", ""),
            lead.get("phone", ""),
            lead.get("country_interest", ""),
            lead.get("course_interest", ""),
            lead.get("stage", ""),
            str(lead.get("score", 0)),
            lead.get("source", ""),
            lead.get("counselor_id", ""),
            lead.get("follow_up_date", ""),
            lead.get("last_contacted_at", ""),
            lead.get("created_at", ""),
            ", ".join(lead.get("tags", [])),
        ])

    service = await get_sheets_service()
    if not service:
        return {
            "success": False,
            "message": "Google Sheets not configured. Please set up OAuth credentials.",
            "data": {"rows_prepared": len(rows) - 1, "headers": headers},
        }

    if not sid:
        # Create new spreadsheet
        spreadsheet = service.spreadsheets().create(
            body={"properties": {"title": "EduFlow AI — Lead Export"}}
        ).execute()
        sid = spreadsheet["spreadsheetId"]

    # Write data
    service.spreadsheets().values().update(
        spreadsheetId=sid,
        range=f"{sheet_name}!A1",
        valueInputOption="RAW",
        body={"values": rows},
    ).execute()

    return {
        "success": True,
        "spreadsheet_id": sid,
        "rows_exported": len(rows) - 1,
        "url": f"https://docs.google.com/spreadsheets/d/{sid}",
    }


@router.post("/import")
async def import_leads_from_sheets(
    spreadsheet_id: str,
    sheet_name: str = "Sheet1",
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """Import leads from a Google Sheets spreadsheet."""
    service = await get_sheets_service()
    if not service:
        raise HTTPException(status_code=400, detail="Google Sheets not configured")

    org_id = current_user.get("organization_id", "default")
    result = service.spreadsheets().values().get(
        spreadsheetId=spreadsheet_id,
        range=f"{sheet_name}!A:Z",
    ).execute()

    values = result.get("values", [])
    if not values:
        raise HTTPException(status_code=400, detail="Spreadsheet is empty")

    headers = [h.lower().replace(" ", "_") for h in values[0]]
    imported = 0
    skipped = 0

    from datetime import datetime
    from app.utils.helpers import log_activity

    for row in values[1:]:
        row_dict = dict(zip(headers, row))
        phone = row_dict.get("phone", "").strip()
        if not phone:
            skipped += 1
            continue

        existing = await db.leads.find_one({"phone": phone, "organization_id": org_id})
        if existing:
            skipped += 1
            continue

        now = datetime.utcnow()
        lead_doc = {
            "name": row_dict.get("name", "Unknown"),
            "email": row_dict.get("email"),
            "phone": phone,
            "country_interest": row_dict.get("country_interest") or row_dict.get("country"),
            "course_interest": row_dict.get("course_interest") or row_dict.get("course"),
            "stage": row_dict.get("stage", "new"),
            "source": row_dict.get("source", "sheets_import"),
            "tags": [],
            "score": 0,
            "notes": [],
            "organization_id": org_id,
            "created_at": now,
            "updated_at": now,
        }
        result_insert = await db.leads.insert_one(lead_doc)
        await log_activity(
            db, "lead", str(result_insert.inserted_id), "lead_imported_from_sheets",
            current_user["id"], org_id, {}
        )
        imported += 1

    return {"imported": imported, "skipped": skipped}


@router.get("/status")
async def get_sheets_status(current_user=Depends(get_current_user)):
    """Check Google Sheets connection status."""
    service = await get_sheets_service()
    return {
        "connected": service is not None,
        "spreadsheet_id": settings.GOOGLE_SHEETS_SPREADSHEET_ID or None,
        "credentials_file": settings.GOOGLE_SHEETS_CREDENTIALS_FILE,
    }
