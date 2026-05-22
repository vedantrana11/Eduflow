# Google Sheets Sync — SOP

## Overview
This directive covers the two-way synchronization between EduFlow AI MongoDB and Google Sheets. Education consultancies often require spreadsheet access for external reporting or legacy processes.

## Inputs
- Google Cloud Project with Google Sheets API enabled
- OAuth 2.0 Credentials (`credentials.json`)
- Target Spreadsheet ID in `.env` (`GOOGLE_SHEETS_SPREADSHEET_ID`)

## Tools / Scripts
- `backend/app/api/v1/sheets.py` — Endpoints to trigger sync manually
- `backend/app/services/sheets_sync.py` — Core synchronization logic

## Workflow

### Setup
1. Create a project in Google Cloud Console.
2. Enable the **Google Sheets API**.
3. Create OAuth client ID credentials (Desktop app type).
4. Download the JSON and save it as `backend/credentials.json`.
5. Create a new Google Sheet and copy its ID from the URL.
6. Set `GOOGLE_SHEETS_SPREADSHEET_ID` in `.env`.
7. The first time the sync is run locally, it will open a browser to authenticate and create `token.json`. For production, `token.json` must be generated locally and uploaded to the server securely, or use a Service Account instead of OAuth.

### Exporting Leads (MongoDB -> Sheets)
- Call `POST /api/v1/sheets/export`
- The system reads all leads from the DB and overwrites the target Google Sheet's "Leads" tab.
- Formats columns: ID, Name, Phone, Email, Country, Course, Stage, Score, Counselor.

### Importing Leads (Sheets -> MongoDB)
- Call `POST /api/v1/sheets/import`
- The system reads the "Leads" tab.
- Matches leads based on `phone` or `email`.
- Updates existing leads or creates new ones.
- **Conflict Resolution**: DB wins if the DB `updated_at` is newer than the last sync timestamp.

## Edge Cases
- Rate limit: Google Sheets API has a limit of 60 requests per minute per user. Use batch updates.
- Service Accounts: If moving to a purely automated cloud environment (no user interaction), switch `credentials.json` to a Service Account JSON and share the spreadsheet with the Service Account email.
- Handling empty cells: Ensure empty cells in Sheets don't overwrite populated DB fields with nulls.
