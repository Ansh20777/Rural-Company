# Frontend–Backend Integration Status and Remaining Gaps

Audit and verification date: 2026-10-05

## Integration completed (2026-10-04)

- Frontend now has a shared API client, configurable API base URL, local Vite `/api` proxy, cookie-backed refresh-time user restoration, signup, login, sign-out, and role-aware dashboards.
- Registration/profile contracts include age, address, PIN code, location, worker profession and experience; worker and customer profile edits save through protected routes, including profile-image data.
- Public landing search now reads live worker/job listings. Worker and customer dashboards read real profiles, availability, bookings, applications, and posted jobs.
- Connected quick booking create/status flows; long-job post/search/apply/withdraw/applicant accept/reject/status flows; and eligible review submission.
- Removed the temporary role preview before the integrated pilot flow; protected dashboards now require a restored or new account session.
- Public job search now stays open-only and searches title/description. Worker search supports text, maximum experience, and rate unit while retaining other filters.
- Review input errors and duplicate review submissions return client errors; worker profile updates persist uploaded image data; express JSON body limit is configured for image data.

## Fixed in the bug-fix pass (2026-10-05)

See `BUGFIXES.md` for the full list. Highlights: concurrency races closed (bookings, accepting applicants, status changes, reviews), correct 400/409/500 codes, worker/customer phone privacy, startup order, `.env.example`, an API test suite, session-expiry handling, URL routing, accessibility and demo-code cleanup.

## Completed in the integration follow-up (2026-10-05)

- Home-page worker and job location search accepts a place name and matches village, district, or state. An explicitly entered place takes precedence over the signed-in user's saved PIN radius.
- Home-page search adds filters for profession, availability, experience, rate, work type, job type, and job pay range.
- Signup and profile editing separate village/town from street address; work locations can be entered for bookings and job posts.
- Workers can edit their accepted work types. Customers can open a public worker profile and read that worker's reviews.
- Login and registration have in-memory rate limits. Browser sessions use an HttpOnly cookie; Bearer tokens remain supported for API clients. Cookie CORS uses an explicit `CORS_ORIGIN` allowlist.
- The previous dashboard `notice is not defined` crash is guarded and the notice prop is passed from the app.

## Still open

### Product / features
- Google/Facebook sign-in is not implemented (the buttons were removed from the UI).
- No password reset / email verification.
- Distance search is straight-line between PIN-code centres and scans up to 2,000 candidates; move to `2dsphere` geo queries at scale. PIN codes newer than the dataset are not found.
- Dashboard, forms and toasts are English only; only the landing page is translated to Hindi.
- Existing profiles created before village/town was separated may have their street address stored in `location.village`; those users can correct it in profile settings.

### Infrastructure
- Profile images are stored as base64 in MongoDB (now resized in the browser and size-checked on the server). Move to object storage before real use.
- Rate limits use process memory and do not coordinate across multiple backend instances; use a shared store such as Redis before horizontal scaling.
- Browser JWT sessions use an HttpOnly cookie. Production deployments must set `CORS_ORIGIN` to the exact trusted frontend origins and configure HTTPS (cookies are Secure in production).
- Multi-document operations are made safe with atomic conditional updates, not MongoDB transactions. Cancelling a job and rejecting its pending applications are still two writes (the second is idempotent and safe to retry).

## Backend logic already present

- JWT login tokens contain both `userId` and `role`; role middleware is used for customer/worker-only routes.
- Quick booking creation checks worker role/existence, availability, and existing pending/accepted bookings; booking transitions and participant-only detail access are implemented.
- Long jobs support public search, customer posting, one application per worker/job, owner-only applicant management, worker withdrawal while pending, position-based hiring, and cancellation of pending applications.
- Review eligibility checks completed bookings/jobs and hired workers; unique indexes prevent duplicate reviews, and worker average rating/review count are recalculated.

## Local run requirements

- Frontend build verified with Vite. Start the frontend from `frontend` with `npm run dev`; its `/api` proxy targets `http://localhost:5000`. Set `VITE_API_BASE_URL` in `frontend/.env` only if the API is hosted elsewhere.
- Backend requires `backend/.env` containing `MONGODB_URI`, `JWT_SECRET`, and optional `PORT`.
- Set `CORS_ORIGIN` to a comma-separated allowlist when the frontend is served from a different origin. Default development allowlist is `http://localhost:5173,http://127.0.0.1:5173`.

## Verification on 2026-10-05

- Backend API suite: **73 passed, 0 failed**, run against a fresh isolated test database on a temporary port. The suite creates records and must never be run against a production or shared database.
- Frontend ESLint: passed with no reported issues.
- Frontend Vite production build: passed.
- Backend JavaScript syntax check: passed for all 24 JavaScript files.
- The frontend has no standalone test script; production build and lint are its available automated checks.
- The previous DevTools `notice is not defined` dashboard crash was fixed by passing the prop from `App.jsx` and giving `DashboardPage` a safe default.


