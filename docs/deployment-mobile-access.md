# Deployment and Mobile Access

This project can be opened on a phone after it is deployed to the public internet. A GitHub repository URL is only for source code and will not open the app itself.

## Recommended Setup

- Frontend on Vercel
- Backend and PostgreSQL on Render

This split keeps the Next.js frontend simple to publish while the Express API and database stay together.

## Frontend on Vercel

1. Import the GitHub repository into Vercel.
2. Set the project root to `frontend`.
3. Add:
   - `NEXT_PUBLIC_API_BASE_URL=https://YOUR-BACKEND-DOMAIN/api/v1`
4. Deploy and keep the generated URL, for example `https://family-health.vercel.app`.

## Backend and PostgreSQL on Render

1. Create a PostgreSQL instance.
2. Create a web service for the backend.
3. Set the root directory to the repository root.
4. Use these commands:
   - Build: `npm install`
   - Start: `npm run start:backend`
5. Add env vars:
   - `PORT=4000`
   - `DATABASE_URL=...`
   - `CORS_ORIGIN=https://YOUR-FRONTEND-DOMAIN`
   - `OPENAI_API_KEY=...`
   - `OPENAI_MODEL=gpt-5-mini`
6. Run the schema and seed SQL against Render PostgreSQL.

## Database Setup

Run these files in order:

1. [`database/schema.sql`](/Users/alex/Documents/AI/Health/database/schema.sql)
2. [`database/seed.sql`](/Users/alex/Documents/AI/Health/database/seed.sql)

## Phone Access

After deployment:

1. Open the Vercel frontend URL on your iPhone.
2. Add it to the Home Screen if you want faster access.
3. The frontend will call the Render API over HTTPS.

## Notes

- Smart Coach works without `OPENAI_API_KEY`, but AI-written replies need the key.
- Apple Health auto-import from iCloud Drive only works on the machine that has access to that local iCloud folder. For a public deployment, keep manual XML upload available.
