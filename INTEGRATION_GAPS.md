# Frontend–Backend Integration Status and Remaining Gaps

Audit date: 2026-10-04

## Integration completed (2026-10-04)

- Frontend now has a shared API client, configurable API base URL, local Vite `/api` proxy, JWT persistence, refresh-time user restoration, signup, login, sign-out, and role-aware dashboards.
- Registration/profile contracts include age, address, PIN code, location, worker profession and experience; worker and customer profile edits save through protected routes, including profile-image data.
- Public landing search now reads live worker/job listings. Worker and customer dashboards read real profiles, availability, bookings, applications, and posted jobs.
- Connected quick booking create/status flows; long-job post/search/apply/withdraw/applicant accept/reject/status flows; and eligible review submission.
- Kept the temporary role preview for development. Preview mode remains intentionally disconnected from writes that require an authenticated account.
- Public job search now stays open-only and searches title/description. Worker search supports text, maximum experience, and rate unit while retaining other filters.
- Review input errors and duplicate review submissions return client errors; worker profile updates persist uploaded image data; express JSON body limit is configured for image data.

## Fixed in the bug-fix pass (2026-10-05)

See `BUGFIXES.md` for the full list. Highlights: concurrency races closed (bookings, accepting applicants, status changes, reviews), correct 400/409/500 codes, worker/customer phone privacy, startup order, `.env.example`, an API test suite, session-expiry handling, URL routing, accessibility and demo-code cleanup.

## Still open

### Product / features
- Google/Facebook sign-in is not implemented (the buttons were removed from the UI).
- No password reset / email verification.
- Distance search is straight-line between PIN-code centres and scans up to 2,000 candidates; move to `2dsphere` geo queries at scale. PIN codes newer than the dataset are not found.
- Public worker profile page, review list (`GET /api/reviews/worker/:id` exists, no UI), and a fuller filter panel (rate, experience, availability, work type) are not built.
- Dashboard, forms and toasts are English only; only the landing page is translated to Hindi.
- Booking uses the customer's saved address; no per-request address entry.
- Worker `workTypes` multi-select is not in the profile editor.
- `location.village` currently receives the address string; decide on a canonical village/town field.

### Infrastructure
- Profile images are stored as base64 in MongoDB (now resized in the browser and size-checked on the server). Move to object storage before real use.
- No rate limiting on login/register (add `express-rate-limit`).
- JWT is kept in `localStorage` (acceptable for an MVP; an httpOnly cookie is safer).
- Multi-document operations are made safe with atomic conditional updates, not MongoDB transactions. Cancelling a job and rejecting its pending applications are still two writes (the second is idempotent and safe to retry).
- Frontend has no automated tests yet.

## Backend logic already present

- JWT login tokens contain both `userId` and `role`; role middleware is used for customer/worker-only routes.
- Quick booking creation checks worker role/existence, availability, and existing pending/accepted bookings; booking transitions and participant-only detail access are implemented.
- Long jobs support public search, customer posting, one application per worker/job, owner-only applicant management, worker withdrawal while pending, position-based hiring, and cancellation of pending applications.
- Review eligibility checks completed bookings/jobs and hired workers; unique indexes prevent duplicate reviews, and worker average rating/review count are recalculated.

## Local run requirements

- Frontend build verified with Vite. Start the frontend from `frontend` with `npm run dev`; its `/api` proxy targets `http://localhost:5000`. Set `VITE_API_BASE_URL` in `frontend/.env` only if the API is hosted elsewhere.
- Backend requires its dependencies plus `backend/.env` containing `MONGODB_URI`, `JWT_SECRET`, and optional `PORT`. No real database credentials are stored in this repository, so end-to-end API requests could not be run here.
