# Architecture Overview

## Goals

- Keep a clean separation between presentation, domain logic, persistence, and integrations.
- Support a staged rollout, one feature at a time.
- Allow local development before PostgreSQL and Apple Health integrations are fully connected.

## High-Level Design

- `frontend`
  - Next.js App Router
  - TailwindCSS styling
  - Server-rendered feature pages that consume the backend API
- `backend`
  - Express API
  - Repository and service layers
  - Seeded fallback repository for local development
- `database`
  - PostgreSQL schema and seed data
  - Tables for profiles, health records, growth measurements, and exercise logs
- `integrations`
  - Research notes and future adapters for Apple Health import workflows
- `tests`
  - Manual QA checklists and future end-to-end coverage

## Initial API Surface

- `GET /health`
- `GET /api/v1/family-members`
- `GET /api/v1/family-members/:id`
- `GET /api/v1/family-members/:id/growth-tracking`

## Production Notes

- Set `DATABASE_URL` to activate PostgreSQL persistence.
- Use `FAMILY_ADMIN_TOKEN` for protected write endpoints when creation and editing flows are added.
- Add rate limiting, structured logging, and session-based authentication during later iterations.
