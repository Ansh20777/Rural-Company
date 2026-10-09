# Rural Company

**A local hiring marketplace for rural, semi-urban, and urban communities.**

**Live website:** [rural-company-jet.vercel.app](https://rural-company-jet.vercel.app/)

Rural Company helps people find nearby workers and helps workers discover local jobs. The name reflects our starting focus on underserved local labor markets, while the product is designed for communities of every size.

## The problem

Finding a dependable plumber, electrician, carpenter, farm worker, driver, tutor, or other local professional often depends on asking friends and neighbors. Workers face the reverse problem: many hear about opportunities only through people they already know. This makes hiring slower and limits access to work for people outside established networks.

## Our solution

Rural Company brings local workers and employers together in one searchable marketplace. Users can discover people and opportunities by skill and location, compare relevant details, and connect through either a direct service request or a longer-term job post.

### Two ways to hire

- **Quick booking:** A customer finds a worker and sends a request for a specific task, such as fixing a pipe or making a table.
- **Post and apply:** An employer publishes a longer job with its requirements, location, duration, hours, and pay. Workers can apply and the employer can review applicants.

The platform supports hourly, short-term, contract, part-time, and full-time work.

## Who it serves

- **Workers:** Skilled and unskilled professionals, including tradespeople, drivers, mechanics, agricultural workers, domestic workers, tutors, and others.
- **Employers:** Households, farmers, contractors, shops, small businesses, construction teams, event organizers, and organizations that need local help.
- **Communities:** Rural villages, semi-urban towns, and urban neighborhoods.

## Current project features

- Separate customer and worker accounts with role-aware experiences.
- Worker profiles with skills, experience, location, expected rates, and availability.
- Search for workers and jobs using location and relevant filters.
- Direct booking requests and job posting/application flows.
- Booking and application status management.
- Ratings and reviews after completed work.
- Hindi/English language option on the landing experience.

This is an early MVP. Notifications, in-app chat, integrated payments, and advanced map-based discovery are planned future features, not currently available in the app.

## What makes Rural Company different

Our focus is the **local work graph**: connecting people to opportunities close to where they live and work, across both informal short jobs and longer employment. The product brings together two needs that are usually handled separately—finding a worker for a task and finding a worker for a job—and builds reputation through completed work and reviews.

As the marketplace grows, we plan to pair digital discovery with community-level onboarding and support. That can help workers who have limited digital experience participate alongside users who are already comfortable with online services.

## Startup and scaling plan

We plan to grow through focused local pilots rather than expanding everywhere at once:

1. **Validate one launch area:** Interview workers and employers, identify high-demand professions, and test whether both sides complete real hires.
2. **Build local marketplace density:** Onboard a balanced supply of workers and employers in selected neighborhoods, towns, and nearby villages. Use local partners and demonstrations to support registration.
3. **Improve from real usage:** Track searches, replies, completed bookings, filled jobs, repeat hires, and user feedback. Prioritize reliability and trust before adding complexity.
4. **Expand to adjacent areas:** Enter nearby areas once the pilot shows repeat usage and enough active listings, adapting language and work categories to local needs.
5. **Develop a sustainable business:** Explore transparent employer tools or service fees only after validating what users value and what they can reasonably afford. Keep access and worker participation central to product decisions.

### Planned product roadmap

- **Notifications:** Alerts for booking updates, applications, new matching jobs, and messages, with SMS or WhatsApp options for users who do not regularly open the site.
- **In-app chat:** A safe, convenient way for both sides to confirm scope, timing, and agreed pay.
- **Better location discovery:** Map-based search, more precise distance and locality filters, and improved support for villages, towns, districts, and urban neighborhoods.
- **Payments and records:** Explore secure digital payments, payment status, receipts, and clear records of agreed work.
- **Trust and accessibility:** Stronger identity and phone verification, reporting tools, more Indian languages, assisted onboarding, and low-data experiences.

These are roadmap ideas; timing and rollout will depend on pilot feedback, technical readiness, and user needs.

## Technology

- **Frontend:** React, JavaScript, and Vite
- **Backend:** Node.js and Express
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT-based role-aware access with a browser session cookie

## Run locally

You need Node.js, npm, and a MongoDB connection.

### 1. Start the backend

```bash
cd backend
npm install
```

Create `backend/.env` using `backend/.env.example` as a guide. Set `MONGODB_URI` and a secure `JWT_SECRET`, then start the API:

```bash
npm run dev
```

### 2. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local Vite URL shown in the terminal. By default, the frontend's `/api` requests are proxied to the backend at `http://localhost:5000`.
