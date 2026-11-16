# Deploying ITMS Bug Tracker

## Architecture in production

```
Browser  →  itmsbugtacker.com
                │
       ┌────────▼────────┐
       │  Render.com     │
       │  Web Service    │
       │                 │
       │  Express server │  ← serves React SPA + /api/* routes
       │  port 10000     │
       └─────────────────┘
```

Both the React app and the Express API run as a **single service** on Render.
The Express server serves the pre-built React `index.html` for every non-API route.

---

## Step 1 — Push to GitHub

```bash
# In "Bug Tracking Agent" folder
git init
git add .
git commit -m "Initial commit: ITMS Bug Tracker"

# Create a repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/itms-bug-tracker.git
git push -u origin main
```

---

## Step 2 — Deploy to Render (free)

1. Go to **https://render.com** → Sign up / Log in
2. Click **New → Web Service**
3. Connect your GitHub repo
4. Fill in settings:

| Field | Value |
|---|---|
| **Name** | `itms-bug-tracker` |
| **Region** | Oregon (or closest to you) |
| **Root Directory** | `server` |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build:client` |
| **Start Command** | `node index.js` |
| **Plan** | Free |

5. Add **Environment Variables**:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `CLIENT_ORIGIN` | *(leave blank for now, fill after first deploy)* |

6. Click **Create Web Service**

Render will:
- Install server deps
- Build the React app (`client/dist/`)
- Start Express which serves both API and SPA

After deploy you get a free URL like:
```
https://itms-bug-tracker.onrender.com
```

---

## Step 3 — Get your custom domain

### Register the domain
1. Go to **https://www.namecheap.com** (or GoDaddy, Cloudflare Registrar)
2. Search for `itmsbugtacker.com` (~$10–15/year)
3. Purchase and complete checkout

> **Note:** Underscores (`_`) are not valid in domain names.
> Use `itmsbugtacker.com` or `itms-bug-tracker.com`.

---

## Step 4 — Connect domain to Render

### In Render dashboard:
1. Go to your service → **Settings** → **Custom Domains**
2. Click **Add Custom Domain**
3. Enter `itmsbugtacker.com` (and optionally `www.itmsbugtacker.com`)
4. Render gives you a **CNAME value**, e.g.:
   ```
   itms-bug-tracker.onrender.com
   ```

### In Namecheap DNS:
1. Go to your domain → **Advanced DNS**
2. Add a CNAME record:

| Type | Host | Value |
|---|---|---|
| CNAME | `www` | `itms-bug-tracker.onrender.com` |
| URL Redirect | `@` | `https://www.itmsbugtacker.com` |

3. Wait 5–30 minutes for DNS to propagate

### Update CLIENT_ORIGIN in Render:
Go to **Environment** → update `CLIENT_ORIGIN` to:
```
https://www.itmsbugtacker.com
```

---

## Step 5 — HTTPS / SSL

Render **automatically provisions a free SSL certificate** (via Let's Encrypt) for
your custom domain. No extra setup needed.

Your app will be live at:
```
https://www.itmsbugtacker.com   ← your ITMS Bug Tracker
```

---

## Local development (unchanged)

```bash
# Terminal 1 — API
cd server
node index.js          # → http://localhost:4000

# Terminal 2 — React (with hot reload)
cd client
npx vite               # → http://localhost:5173
```

---

## Free tier limits (Render)

| Limit | Free tier |
|---|---|
| Hours/month | 750 (enough for 1 service) |
| RAM | 512 MB |
| Cold start | ~30s after 15min inactivity |
| Bandwidth | 100 GB/month |

Upgrade to **Starter ($7/month)** to remove cold starts.

---

## Quick summary

```
1. git push to GitHub
2. Render → New Web Service → connect repo
   Build: npm install && npm run build:client
   Start: node index.js
3. Register domain on Namecheap
4. Add custom domain in Render → copy CNAME
5. Set CNAME in Namecheap DNS
6. Done — https://www.itmsbugtacker.com is live!
```
