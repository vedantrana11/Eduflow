# EduFlow AI Backend API Documentation

This document provides a high-level overview of the REST API endpoints available in the EduFlow AI backend.

For detailed schemas and interactive testing, run the backend and visit the Swagger UI at `http://localhost:8000/api/docs`.

---

## 1. Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/v1/auth/signup` | Register a new user | No |
| POST | `/api/v1/auth/login` | Login and receive JWT access and refresh tokens | No |
| POST | `/api/v1/auth/refresh` | Obtain a new access token using a refresh token | No |
| GET | `/api/v1/auth/me` | Get the current authenticated user's profile | Yes |

---

## 2. Leads (`/api/v1/leads`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/v1/leads` | List leads (supports pagination, filtering by stage, search) | Yes |
| POST | `/api/v1/leads` | Create a new lead | Yes |
| GET | `/api/v1/leads/{id}` | Get a specific lead by ID | Yes |
| PUT | `/api/v1/leads/{id}` | Update a specific lead | Yes |
| DELETE | `/api/v1/leads/{id}` | Delete a lead | Yes |
| POST | `/api/v1/leads/{id}/notes` | Add a note to a lead | Yes |
| POST | `/api/v1/leads/{id}/assign` | Assign a counselor to a lead | Yes |
| GET | `/api/v1/leads/pipeline/summary` | Get count of leads in each stage | Yes |

---

## 3. WhatsApp (`/api/v1/whatsapp`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/v1/whatsapp/send` | Send a single WhatsApp message (text or template) | Yes |
| POST | `/api/v1/whatsapp/bulk-send` | Send a message to multiple leads | Yes |
| GET | `/api/v1/whatsapp/conversations` | List all WhatsApp conversations | Yes |
| GET | `/api/v1/whatsapp/conversations/{lead_id}` | Get conversation thread for a specific lead | Yes |
| GET | `/api/v1/whatsapp/templates` | List available Meta-approved WhatsApp templates | Yes |
| POST | `/api/v1/whatsapp/webhook` | Meta Webhook Receiver for incoming messages | No |

---

## 4. AI Features (`/api/v1/ai`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/v1/ai/score-lead/{id}` | Calculate 0-100 score for a lead based on activity | Yes |
| POST | `/api/v1/ai/generate-reply/{id}` | Draft an AI-suggested reply for a conversation | Yes |
| POST | `/api/v1/ai/summarize-conversation/{id}`| Generate a summary of a chat thread | Yes |
| POST | `/api/v1/ai/detect-intent/{id}` | Detect intent of the last inbound message | Yes |
| POST | `/api/v1/ai/chat` | General-purpose AI assistant chat | Yes |
| POST | `/api/v1/ai/bulk-score` | Score all active leads asynchronously | Yes |

---

## 5. Tasks (`/api/v1/tasks`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/v1/tasks` | List tasks (filterable by status) | Yes |
| POST | `/api/v1/tasks` | Create a new task/reminder | Yes |
| PUT | `/api/v1/tasks/{id}` | Update a task | Yes |
| DELETE | `/api/v1/tasks/{id}` | Delete a task | Yes |
| POST | `/api/v1/tasks/{id}/complete` | Mark a task as completed | Yes |

---

## 6. Analytics (`/api/v1/analytics`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/v1/analytics/dashboard` | Get KPIs, activity stats, and counselor leaderboards | Yes |
| GET | `/api/v1/analytics/funnel` | Get lead funnel data | Yes |
| GET | `/api/v1/analytics/lead-sources` | Get breakdown of lead sources | Yes |
| GET | `/api/v1/analytics/activity-log` | Get recent activity stream | Yes |

---

## 7. Settings & Integrations (`/api/v1/settings`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/v1/settings/integrations` | Get connection status of all external integrations | Yes |
| GET | `/api/v1/settings/team` | List team members in the current organization | Yes |
| PUT | `/api/v1/settings/profile` | Update the current user's profile information | Yes |

---

## 8. Google Sheets Sync (`/api/v1/sheets`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/v1/sheets/export` | Export leads to Google Sheets | Yes |
| POST | `/api/v1/sheets/import` | Import and sync leads from Google Sheets | Yes |
