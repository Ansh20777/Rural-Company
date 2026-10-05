# Rural Company – frontend

React 19 + Vite. Talks to the Express API in `../backend`.

```bash
npm install
npm run dev      # http://localhost:5173  (the /api proxy targets http://localhost:5000)
npm run lint
npm run build    # production build in dist/
```

* Set `VITE_API_BASE_URL` in `frontend/.env` only if the API is hosted on another origin.
* The app uses real URLs (`/`, `/login`, `/signup`, `/dashboard`). When you deploy `dist/` to a static host,
  configure an **SPA fallback** (serve `index.html` for unknown paths) or refreshing `/dashboard` will 404.
* The "Preview worker/customer page" dock only exists in `npm run dev`; it is removed from production builds.
