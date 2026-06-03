# Deploying Attend IT to MongoDB Atlas + Render

Your manuscript architecture: **React (frontend) → MongoDB Atlas (DB) → Render (server host)**.

This guide assumes the code is already in a GitHub repository. If not, do that first
(`git init`, push to a new GitHub repo).

---

## Part 1 — MongoDB Atlas

Free tier (M0) is enough for a capstone demo.

1. Go to https://www.mongodb.com/cloud/atlas and sign up / log in.
2. **Create a cluster** → choose **M0 Free** → pick the region closest to you (or to Render's region — Singapore/Oregon are common).
3. **Database Access** (left sidebar) → **Add New Database User**:
   - Authentication method: **Password**
   - Username: e.g. `attendit-app`
   - Password: click "Autogenerate Secure Password" → **copy it now**, you won't see it again.
   - Built-in role: **Read and write to any database**
4. **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`).
   - Required because Render's outbound IPs are dynamic. Your DB is still protected by username+password.
5. **Database** → **Connect** → **Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://attendit-app:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with the password from step 3, and add the database name `attend_it` after the host:
   ```
   mongodb+srv://attendit-app:YOURPASS@cluster0.xxxxx.mongodb.net/attend_it?retryWrites=true&w=majority
   ```
   Keep this string safe — you'll paste it into Render as `MONGO_URI`.

> **If you previously committed the leaked example connection string**, rotate the password
> in Atlas now (Database Access → Edit the user → reset password) so the old one stops working.

### Seed the Atlas database (optional but recommended for your demo)

You can use the existing `seed.js`. Temporarily point your local `.env` at Atlas:

```bash
# backend/.env  (local file — already gitignored)
MONGO_URI=mongodb+srv://attendit-app:YOURPASS@cluster0.xxxxx.mongodb.net/attend_it?retryWrites=true&w=majority
JWT_SECRET=replace_this_with_a_unique_secret_of_at_least_32_characters
```

Then run:

```bash
cd backend
npm run seed
```

You should see the three test users created. Switch the local `.env` back to `mongodb://localhost:27017/attend_it` afterwards if you want to keep developing offline.

---

## Part 2 — Render deployment

You'll create two services: one for the API (Node web service), one for the frontend (Static Site).

### 2a. One-click via Blueprint (recommended)

There's a `render.yaml` at the repo root that describes both services.

1. Go to https://dashboard.render.com → **New** → **Blueprint**.
2. Connect your GitHub account and pick the repo.
3. Render reads `render.yaml` and proposes **backend** + **frontend**.
4. It will ask you to fill in the secret env vars before applying:
   - **backend → MONGO_URI** = the Atlas connection string from Part 1.
   - **backend → JWT_SECRET** = a long random string. Generate one with:
     ```bash
     node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
     ```
   - **backend → CLIENT_ORIGIN** = leave blank for now, we'll fill it in step 5.
   - **frontend → VITE_API_URL** = leave blank for now, we'll fill it in step 5.
5. Click **Apply**. Render starts building. The backend will deploy first.
6. After the backend deploys, copy its URL (something like `https://backend.onrender.com`).
7. Edit **frontend → VITE_API_URL** = `https://backend.onrender.com/api` → trigger a redeploy.
8. After the frontend deploys, copy its URL (something like `https://frontend.onrender.com`).
9. Edit **backend → CLIENT_ORIGIN** = the frontend URL → trigger a redeploy.

You now have:
- API at `https://backend.onrender.com`
- Web at `https://frontend.onrender.com`

### 2b. Continuous deployment through GitHub Actions

This repository includes `.github/workflows/deploy.yml`. On every push to
`main`, GitHub Actions will:

1. install backend dependencies
2. run backend tests
3. install frontend dependencies
4. lint and build the frontend
5. trigger Render deploy hooks for the backend and frontend

To finish setup:

1. In Render, open the **backend** service.
2. Go to **Settings** → **Deploy Hook** and copy the deploy hook URL.
3. In GitHub, open the repository → **Settings** → **Secrets and variables** →
   **Actions** → **New repository secret**.
4. Add this secret:
   ```txt
   RENDER_BACKEND_DEPLOY_HOOK_URL
   ```
   Paste the backend deploy hook URL as the value.
5. In Render, open the **frontend** service and copy its deploy hook URL.
6. Add another GitHub Actions repository secret:
   ```txt
   RENDER_WEB_DEPLOY_HOOK_URL
   ```
   Paste the frontend deploy hook URL as the value.
7. Push to `main`, or open GitHub → **Actions** → **CI and Deploy** → **Run workflow**.

Keep `MONGO_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`, and `VITE_API_URL` in Render's
environment variables. Do not put those values inside the GitHub workflow.

> If Render's normal auto-deploy is already enabled, each push can trigger a
> Render deploy directly and another deploy from GitHub Actions. To make GitHub
> Actions the gatekeeper, turn off auto-deploy in each Render service and let
> the workflow trigger deploy hooks only after tests pass.

### 2c. Manual setup (if you skip the blueprint)

**Backend (Web Service)**
| Setting | Value |
|---|---|
| Environment | Node |
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |
| Env Vars | `MONGO_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`, `NODE_ENV=production` |

**Frontend (Static Site)**
| Setting | Value |
|---|---|
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |
| Env Vars | `VITE_API_URL=https://<your-backend>.onrender.com/api` |
| Rewrite Rule | Source `/*` → Destination `/index.html` (SPA fallback) |

---

## Part 3 — Bootstrap the admin account

Visit your frontend URL → `/signup`. The first account you create is automatically promoted to **admin** (this is built into the signup controller). After that, public admin signup is blocked, so subsequent admins must be created from inside the app by an existing admin via User Management.

---

## Part 4 — Free-tier gotchas to know about for your defense

- **Cold starts:** Render's free web service sleeps after ~15 minutes of inactivity. The first request after a sleep takes ~30–60 s to wake the container. The frontend (static site) does not sleep.
- **Atlas inactivity:** free clusters pause after long inactivity but resume on the first query.
- **Logs:** check the Logs tab on each Render service if something doesn't work. The backend health check at `/api/health` should return `{"status":"ok","db":"connected"}`.

---

## Local dev still works the same way

Your local `.env` files are gitignored. Production env vars live in Render. Nothing about how you run things locally changed:

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```
