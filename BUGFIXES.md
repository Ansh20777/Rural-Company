# Bug-fix pass – 2026-10-05

Verified with: `npm run lint` (0 errors), `npm run build`, 63 API tests (`backend/tests/api.smoke.mjs`)
and a 27-step browser run against the production build (Chromium, desktop + 390px mobile).

## Backend
| Problem | Fix |
|---|---|
| Two simultaneous requests could create duplicate active bookings | Unique partial index + 409 on duplicate key |
| Two simultaneous "accept" clicks could hire more people than `positions` | Atomic `acceptedCount` claim on the job (a slot is reserved before the application is accepted), plus a recount safety net with rollback; job set to `hired` only if still `open` |
| Booking / job / application status changes were read-modify-write | Conditional atomic updates (`findOneAndUpdate` on the expected current status) → 409 if it changed meanwhile |
| Validation / cast / duplicate-key errors returned 500 | One shared `handleError`: 400 / 409 / 500 (500s are logged, details no longer leaked to clients) |
| Register: duplicate email returned 400 and a race returned 500; wrong-typed fields crashed; password length was never enforced (it was checked on the bcrypt hash) | Type checks, 6–72 char check before hashing, 409 on duplicates |
| Email regex rejected valid addresses (e.g. `.info`, `.online`) | Simplified regex |
| Login returned `id`, `/me` returned `_id` | Both endpoints now return both |
| Public worker list/detail exposed phone numbers | Phone hidden; each side sees the other's phone in bookings only once accepted |
| `GET /api/jobs/:id` exposed hired/cancelled jobs publicly | Non-open jobs visible only to their owner |
| Junk query values (`minRate=abc`, `?status=…`) caused 500s or filter bypass | Numbers sanitised, status values whitelisted |
| `GET /api/workers/not-an-id` → 500 | 400 |
| Any string accepted as `profileImage` | Must be a PNG/JPG/WEBP/GIF data URL ≤ 5 MB |
| Server started listening before MongoDB was ready; no JWT_SECRET check | Starts after DB connects; refuses to start without `JWT_SECRET` |
| Multer / oversized-body errors returned wrong status | 400 / 413 with friendly messages |
| No `.env.example`, no tests | Added both (`npm test` runs the API suite) |

## Frontend
- Renamed **Urban Company → Rural Company** everywhere (it was another company's trademark).
- Developer preview dock removed from production; "DEMO PREVIEW" badge only on actual previews; header avatar shows the real user's initials.
- Fake "250+/80+/12" stats replaced by real counts from the API.
- All 8 lint errors / 1 warning fixed; dead files (`App.css`, `index.css`, `marketplace.js`, template assets) deleted.
- Real URL routing (Back button works, `/dashboard` refresh keeps you signed in, signed-out users are sent to login).
- Session handling: loading screen while restoring a session; expired/invalid token → signed out with a clear message; language remembered and `<html lang>` updated.
- Bug: choosing "Review worker" opened the Applicants dialog instead of the review dialog (async race) – fixed.
- Bug: monthly rates displayed "/ day"; money now formatted Indian-style; "per total" label fixed.
- Bug: edited district/state in the "Post a job" form were ignored if the profile already had one.
- Profile: unsaved edits no longer wiped by background refreshes; photos resized in the browser (≤512 px) before upload; worker save is one request instead of two.
- Signup/login: removed fake Google/Facebook buttons, dead Terms links, fake "Step 1 of 2" and the non-functional role switch on login; added show/hide password, submit-in-progress states, autocomplete hints.
- Accessibility: all text ≥ 12 px (was 7–9 px in 60 places), greys darkened for contrast, visible keyboard focus, dialogs trap focus, close with Escape and restore focus, bigger tap targets.
- Empty states and a loading indicator on dashboard lists; past dates blocked in date pickers.
- Google Fonts loaded with non-blocking `<link>` instead of CSS `@import`.

## Testing notes
`npm test` (backend) needs the API running against a **throwaway** MongoDB. On a real MongoDB 6+ run it as-is. Emulators without
partial indexes / atomic find-and-modify (e.g. FerretDB) should run `NO_PARTIAL_INDEX=1 npm test`, which skips the two
"exactly one winner" checks.

## Navigation follow-up
- Dashboard pages now live in the URL (`/dashboard#profile`, `#discover`, `#activity`): Back/Forward and refresh stay on the page you were on.
- Logo inside the dashboard goes to Overview instead of the public homepage; the public homepage shows "My dashboard" (not Log in / Get started) when you're signed in.
- Dialogs no longer steal keyboard focus when the page re-renders.
- Profile form is rebuilt from the saved data, so opening it before the dashboard finished loading can't show (or save) blank fields.

## Session follow-up
- Removed the temporary "Building and testing?" preview dock and all demo/preview plumbing. It replaced the real login with a fake user and wiped the saved session.
- You stay signed in until you press Sign out (login token lifetime raised from 7 to 30 days). Switching users = sign out, then log in.
- Opening `/login` or `/signup` while signed in sends you to your dashboard instead of showing the form.

## Home page + distance search (new)
- **Home page while signed in:** sidebar link "Home page" in the dashboard. The public search works as before, and "Contact" (customers) / "Apply" (workers) now open the real request/apply form instead of just showing a message.
- **Search by distance (PIN code):** `GET /api/workers` and `GET /api/jobs` accept `?pinCode=781001&radiusKm=30`. Only results within the radius are returned, nearest first, each with `distanceKm`. Radius defaults to 30 km (1-500). A bad/unknown PIN returns a clear 400. Workers whose own PIN is unknown can't be placed, so they are left out of distance searches (the response says how many via `geo.skippedUnknownPin`), and registration warns about it.
- Signed-in users automatically see work/workers within 30 km of their own PIN code (home page and dashboard). The home page has a PIN box and a distance selector (10/20/30/50/100 km or any distance); the dashboard "Find workers / Find work" page now has a real search form (text + PIN + distance).
- Jobs have a `pinCode` (defaults to the poster's PIN, or set it when posting).
- PIN data: `backend/data/pincodes.json` (19,258 PIN codes from India Post open data, see `backend/data/README.md`).
- Distances are straight-line between PIN-code centres (approximate, not road distance). Searches look at up to 2,000 candidate records before filtering; for a large marketplace switch to MongoDB geospatial indexes (`2dsphere` + `$geoNear`).
