# Lead Management — SOP

## Overview
This directive covers the full lead lifecycle in EduFlow AI CRM.

## Pipeline Stages
1. **New** → Lead just added, not yet contacted
2. **Contacted** → First touch done (call/WhatsApp)
3. **Interested** → Student showed interest, gathering requirements
4. **Documents Pending** → Application agreed, awaiting documents
5. **Applied** → University application submitted
6. **Converted** → Offer received + fee paid
7. **Lost** → Student went elsewhere or went cold

## Tools / Scripts
- `backend/app/api/v1/leads.py` — All CRM API endpoints
- `POST /api/v1/leads` — Create lead
- `PUT /api/v1/leads/{id}` — Update stage/details
- `POST /api/v1/leads/{id}/notes` — Add note
- `POST /api/v1/ai/score-lead/{id}` — AI score
- `GET /api/v1/leads/pipeline/summary` — Pipeline counts

## Workflow

### Adding a Lead
1. Capture name, phone, country/course interest, source
2. Assign counselor
3. Set stage to `new`
4. Create follow-up task for within 24h

### Stage Transitions
- **New → Contacted**: Log first call in notes, send welcome WhatsApp
- **Contacted → Interested**: Document student requirements, share university options
- **Interested → Documents Pending**: Send document checklist via WhatsApp template
- **Documents Pending → Applied**: Verify all docs, submit to university
- **Applied → Converted**: Offer letter received, collect consultation fee

### Follow-up Rules
- New leads: Contact within **24 hours**
- Interested: Follow up every **48 hours**
- Documents Pending: Weekly reminder until complete
- Applied: Check university portal weekly

### AI Scoring
- Run `POST /api/v1/ai/bulk-score` daily to refresh all scores
- Score 75-100: Priority leads — counselor should focus here
- Score 50-74: Active — maintain regular follow-up
- Score 25-49: Warm — nurture with content
- Score 0-24: Cold — re-engagement or archive

## Edge Cases
- Duplicate phone numbers blocked at API level
- Leads with no activity in 30 days → auto-flag as stale
- Lost leads can be re-activated by moving back to `contacted`
