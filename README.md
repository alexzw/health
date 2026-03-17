# Family Health Tracking Web Application

Private family health dashboard for Alex, Amelie, and Ryan.

## Monorepo Structure

- `frontend/`: Next.js and TailwindCSS application
- `backend/`: Express API and service layer
- `database/`: PostgreSQL schema and seed data
- `docs/`: architecture and feature planning notes
- `integrations/`: external integration research and adapters
- `tests/`: end-to-end and manual QA notes

## Feature Delivery Order

1. Family Member Profiles
2. Ryan Growth Tracking
3. Adult Weight Tracking
4. Exercise Logs
5. Apple Health Integration
6. Dashboard

## Local Development

1. Install workspace dependencies:

```bash
npm install
```

2. Start the backend:

```bash
npm run dev:backend
```

3. Start the frontend:

```bash
npm run dev:frontend
```

The backend uses seeded in-memory data when `DATABASE_URL` is not set, which keeps Features 1 and 2 usable during local setup.

## OpenAI Smart Coach

Add these backend env vars to enable AI-written coaching replies on top of the existing rule-based summaries:

```bash
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-5-mini
```

The app will still work without an API key, but Smart Coach will fall back to the built-in coaching engine.

## Mobile Access

The GitHub repository is not the website. To open the app on your phone, deploy it and use the deployment URL.

Recommended setup:

- Frontend: Vercel
- Backend + PostgreSQL: Render

Detailed steps are in [`docs/deployment-mobile-access.md`](/Users/alex/Documents/AI/Health/docs/deployment-mobile-access.md).
