# AI Features — SOP

## Overview
EduFlow AI uses OpenAI (GPT-4o) or Google Gemini for intelligent automation.

## Tools / Scripts
- `backend/app/api/v1/ai.py` — All AI endpoints
- Endpoints:
  - `POST /api/v1/ai/score-lead/{id}` — Score a single lead
  - `POST /api/v1/ai/generate-reply/{id}` — Draft WhatsApp reply
  - `POST /api/v1/ai/summarize-conversation/{id}` — Summarize chat
  - `POST /api/v1/ai/detect-intent/{id}` — Detect student intent
  - `POST /api/v1/ai/chat` — General AI assistant
  - `POST /api/v1/ai/bulk-score` — Score all leads (rule-based)

## AI Provider Selection
- Set `AI_PROVIDER=openai` or `AI_PROVIDER=gemini` in `.env`
- System tries configured provider first, falls back to OpenAI
- If no API key: responses are mocked/rule-based

## Workflow

### Daily Scoring (Automated)
1. Call `POST /api/v1/ai/bulk-score` each morning
2. Scores update based on stage progression + message activity
3. High-score leads surface first in counselor view

### AI Reply Generation
1. Counselor opens WhatsApp conversation
2. Clicks "AI Reply" button
3. System sends last 5 messages + lead context to LLM
4. Returns a 2-3 sentence professional reply
5. Counselor reviews → sends or edits

### Intent Detection
- Triggers when new inbound message arrives
- Returns: `ready_to_apply | still_researching | needs_more_info | price_sensitive | urgent | cold`
- High-intent signals → auto-notify assigned counselor

## Prompt Engineering Notes
- Always include lead stage in prompts — it anchors the AI response
- Use `temperature=0.7` for reply generation (creative but professional)
- Use `temperature=0.2` for scoring (deterministic)
- Include conversation length in scoring context

## Edge Cases
- OpenAI rate limits: 10,000 RPM on tier 2 (plenty for 500 leads)
- Gemini free tier: 60 requests/minute
- Malformed JSON response: falls back to rule-based scoring
- Empty conversation: returns generic helpful response
