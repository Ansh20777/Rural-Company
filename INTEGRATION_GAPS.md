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

## Remaining integration and backend gaps

These are the remaining issues identified during the integration review. They do not prevent the frontend bundle from building, but they matter before a public pilot.

### Frontend work still needed

#### Authentication and user experience

- Google/Facebook buttons are still presentation-only; no OAuth provider or backend endpoints are configured.
- Add route-level role guarding/navigation polish, visible loading indicators, and a dedicated session-expired message. Current protected API errors are surfaced as toasts.
- Add complete server-side registration field validation and map unique-email races to HTTP 409 rather than 500.

#### Signup and profiles

- Profile images are stored as base64 data in MongoDB for the MVP. Move them to durable object storage before real use to control document size and backups.
- Worker work-type selection is part of the backend model but the current profile editor still needs a multi-select control.
- Signup asks for district and state. `location.village` currently receives the address string; decide a cleaner canonical village/town field contract.

#### Quick-job booking

- Public worker profile detail and a fuller filter panel (rate, experience, availability, work type, district/state) are not yet available in the landing UI.
- The booking form uses the customer’s profile location. Allow per-request address/location entry for customers hiring outside their saved address.
- Add visible empty/loading/error states for search and activity sections.

#### Long-job post-and-apply

- Add search filters for job type and pay range and a detailed public job view.
- Review flow currently asks customers to load accepted workers after marking the job complete; improve the interface so the selected hired worker is explicit before completion/review.
- Hiring capacity checks are not transactionally atomic. Concurrent accepts can still exceed positions; use MongoDB transactions or an atomic capacity claim.
- Cancellation status and pending-application rejection are separate writes and need transactional/recovery handling.

#### Reviews and shared dashboards

- A public worker review list/detail panel using `GET /api/reviews/worker/:workerId` is not yet implemented.
- Add integration tests for registration/login, role denial, booking transitions, job/application lifecycle, contact visibility, and review eligibility before pilot use.

## Backend logic and API gaps found

### Data contract and missing endpoints

- Add age and PIN-code fields (or formally remove them from the frontend requirements) and settle how a user-entered address maps to village/district/state.
- Add a customer profile read/update endpoint. `GET /api/user/me` can read the account, but there is no customer profile update route; worker profile updates are separate.
- Worker profile-image upload is not complete: Multer receives the file, but `updateWorkerProfile` only logs the filename and does not store a URL. Customer photo upload has no endpoint. Add persistent image storage and return the saved URL.
- Registration does not return a JWT. That is workable with a subsequent login request, but the frontend flow must account for it or the API should return a token.
- Google/Facebook sign-in has no backend implementation despite the frontend demo buttons.

### Search and privacy

- Worker search implements profession, skill, district, state, availability, min/max rate, minimum experience, and work type, and sorts by rating then review count. It has no PIN-code filter, maximum-experience filter, or rate-unit filter; min/max rates can otherwise compare hourly and daily/monthly rates as if they shared a unit.
- Public job search defaults to open jobs, but accepts an arbitrary `status` query parameter. That can expose hired, completed, or cancelled jobs despite the stated public-open-jobs flow. Restrict public search to open jobs or expose non-open statuses only through owner routes.
- Job keyword search matches title only, not description.
- `GET /api/workers` and `GET /api/workers/:id` currently include a worker phone number in public responses. Decide whether that is intended; if not, hide it until an authenticated booking/contact step.
- Employer phone is removed from a worker’s application response until that application is accepted, which matches the stated rule. `GET /api/jobs/:id` never includes employer phone, including after acceptance, so the frontend should use the applications endpoint after acceptance or the API should provide an explicit authorized contact route.

### Concurrency and validation risks

- Duplicate active quick bookings are checked before insert but not protected by a unique constraint/atomic operation. Two simultaneous requests can both pass the check and create duplicate active bookings.
- Accepting applications and counting accepted workers is not transactional. Concurrent accepts can exceed `positions` or race with job cancellation/hiring. Use a transaction or an atomic job-capacity claim and consistently reject remaining pending applications.
- Job cancellation and pending-application rejection are separate writes, so partial failure can leave inconsistent state. Make the state change atomic where supported or add recovery handling.
- Review creation checks for an existing review before insert; concurrent duplicate requests can hit the unique index and currently fall through to a 500 response. Map duplicate-key errors to a client conflict response.
- Review rating validation uses range comparisons without requiring a finite number. Invalid strings can reach Mongoose casting and produce a 500 instead of a 400.
- Several controllers return 500 for input/Mongoose validation or cast failures (for example booking creation). Normalize validation errors to 400 and unexpected server errors to 500.
- Registration can also race on the unique email index; map duplicate-key errors to a clear 409/400 rather than 500.

### Operations and verification

- There is no backend test suite yet; the `test` script is a placeholder that exits with an error.
- Add an `.env.example` documenting `MONGODB_URI`, `JWT_SECRET`, and `PORT` without real secrets. Confirm the local MongoDB setup and frontend/backend development URLs/CORS policy.
- `connectDB()` is called without awaiting completion before `app.listen()`. Consider starting the listener only after the database is connected so early requests do not arrive before readiness.

## Backend logic already present

- JWT login tokens contain both `userId` and `role`; role middleware is used for customer/worker-only routes.
- Quick booking creation checks worker role/existence, availability, and existing pending/accepted bookings; booking transitions and participant-only detail access are implemented.
- Long jobs support public search, customer posting, one application per worker/job, owner-only applicant management, worker withdrawal while pending, position-based hiring, and cancellation of pending applications.
- Review eligibility checks completed bookings/jobs and hired workers; unique indexes prevent duplicate reviews, and worker average rating/review count are recalculated.

## Local run requirements

- Frontend build verified with Vite. Start the frontend from `frontend` with `npm run dev`; its `/api` proxy targets `http://localhost:5000`. Set `VITE_API_BASE_URL` in `frontend/.env` only if the API is hosted elsewhere.
- Backend requires its dependencies plus `backend/.env` containing `MONGODB_URI`, `JWT_SECRET`, and optional `PORT`. No real database credentials are stored in this repository, so end-to-end API requests could not be run here.
