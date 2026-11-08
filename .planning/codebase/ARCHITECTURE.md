# Architecture Specification: FixMySpot

## Architectural Layers
1. **Client Tier (Citizen & Municipal Portals):** Single-page application built on React 19 providing geolocated issue reporting, client-side photo downscaling via canvas, voice transcription input, and role-based municipal triage dashboards.
2. **API & Business Logic Tier:** Asynchronous FastAPI service exposing OpenAPI-compliant REST endpoints with JWT bearer authentication, dependency-injected database sessions, and background tasks.
3. **Data & Storage Tier:** MongoDB Atlas cluster with compound indexes across status, category, geocoordinates, creation timestamps, and verification workflows.

## Security Architecture & OWASP Hardening
- **BOLA / IDOR Verification Loop:** Citizens who report issues retain exclusive authorization to verify resolution proof or reopen tickets.
- **Client-Side Image Downscaling:** Canvas resizing (max 1280px) eliminates multi-megabyte denial-of-service risks and database bloating.
- **NoSQL Injection Defense:** Strict Pydantic models validate and sanitize all document payloads prior to database queries.
