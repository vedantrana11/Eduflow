# WhatsApp Automation — SOP

## Overview
This directive covers WhatsApp Cloud API setup and automation workflows for EduFlow AI.

## Inputs
- Meta Business Account with WhatsApp API access
- `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_ACCESS_TOKEN` in `.env`

## Tools / Scripts
- `backend/app/api/v1/whatsapp.py` — All WhatsApp API endpoints
- Endpoint: `POST /api/v1/whatsapp/send` — Send single message
- Endpoint: `POST /api/v1/whatsapp/bulk-send` — Send to multiple leads
- Endpoint: `GET /api/v1/whatsapp/templates` — List templates

## Workflow

### Setup
1. Create Meta Business Account at business.facebook.com
2. Add WhatsApp Business App → get Phone Number ID + Access Token
3. Set `WHATSAPP_VERIFY_TOKEN` to match your .env value
4. Register webhook at: `https://your-backend.com/api/v1/whatsapp/webhook`
5. Subscribe to `messages` webhook topic

### Sending Messages
```python
# Single message
POST /api/v1/whatsapp/send
{
  "lead_id": "...",
  "content": "Hi Aisha, following up on your MBA inquiry.",
  "type": "text"
}

# Template message
POST /api/v1/whatsapp/send
{
  "lead_id": "...",
  "content": "",
  "type": "template",
  "template_name": "follow_up_reminder",
  "template_params": {"student_name": "Aisha"}
}
```

### Automated Follow-ups
- Schedule via `tasks.py` endpoint — set `due_date` for follow-up
- Use APScheduler (see `services/scheduler.py`) for time-based triggers
- Template: `document_reminder` for leads in `documents_pending` stage

## Edge Cases
- Rate limit: WhatsApp allows 250 messages/second per business
- 24-hour rule: Template messages required after 24h of last customer message
- Failed messages: Check `status: "failed"` and retry with exponential backoff

## Learnings
- Always validate phone format with E.164 (+country_code number)
- Test mode: Without credentials, messages are mocked — set `mock: True` in response
