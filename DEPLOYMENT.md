# Deploying Tilak Industries for free

| Part | Service | Free plan | Repo |
| --- | --- | --- | --- |
| Database | MongoDB Atlas | M0 cluster, 512 MB | — |
| API | Render | Free web service | `tilak-server-oprations` |
| Frontend | Vercel | Hobby | `tilak-client-operations` |

```
Browser ──► Vercel (React app)
              │  /api/*  is forwarded (vercel.json rewrite)
              ▼
            Render (Express API) ──► MongoDB Atlas
```

The browser only ever talks to Vercel. Vercel forwards `/api` calls to Render, so the login cookie stays on the Vercel site and works in every browser (including Safari and Chrome's third‑party cookie blocking).

Do the steps **in this order**: Atlas → Render → Vercel → connect them → admin login → test.

Use the same region everywhere you can. **Singapore** is the closest free region to India on both Render and Atlas (AWS `ap-southeast-1`); keeping the API and database in the same region makes every page faster.

---

## 1. MongoDB Atlas (database)

1. Sign up at <https://www.mongodb.com/cloud/atlas/register>.
2. **Create a cluster** → choose **M0 (Free)** → provider **AWS** → region **Singapore (ap-southeast-1)** → name it `tilak` → Create.
3. **Database user** (Atlas asks right away, or go to *Security → Database Access → Add New Database User*):
   - Authentication: Password
   - Username: `tilak_app`
   - Click **Autogenerate Secure Password**, then **copy it somewhere safe**
   - Role: **Read and write to any database**
4. **Network access** (*Security → Network Access → Add IP Address*): choose **Allow access from anywhere** (`0.0.0.0/0`).
   Render's free plan has no fixed IP address, so this is required. The strong database password is what protects the data.
5. **Get the connection string**: *Database → Connect → Drivers*. It looks like:
   ```
   mongodb+srv://tilak_app:<db_password>@tilak.abcde.mongodb.net/?retryWrites=true&w=majority&appName=tilak
   ```
   Replace `<db_password>` with the password from step 3, and add the database name **`tilak_industries`** right after `.net/`:
   ```
   mongodb+srv://tilak_app:YOUR_PASSWORD@tilak.abcde.mongodb.net/tilak_industries?retryWrites=true&w=majority&appName=tilak
   ```
   This full string is your **`MONGODB_URI`**. Keep it private — it contains the password.

### 1b. (Optional) Copy your existing local data to Atlas

Moves your current customers, orders **and logins** (so you can skip step 4 later). Run on the computer that has the local database:

```bash
mongodump --uri="mongodb://127.0.0.1:27017/tilak_industries" --out=./tilak-backup
```

```bash
read -s "ATLAS?Paste MONGODB_URI: " && echo && mongorestore --uri="$ATLAS" --nsInclude="tilak_industries.*" ./tilak-backup; unset ATLAS
```

(`read -s` keeps the database password out of your shell history.) Delete the `tilak-backup` folder afterwards.

---

## 2. Render (API server)

1. Sign up at <https://render.com> **with GitHub** (the `rushabhchothani2001` account) and allow access to the `tilak-server-oprations` repo.
2. **New → Web Service** → pick `tilak-server-oprations`.
3. Settings:

   | Field | Value |
   | --- | --- |
   | Name | `tilak-server-oprations` (gives `https://tilak-server-oprations.onrender.com`) |
   | Region | **Singapore** |
   | Branch | `main` |
   | Root Directory | *(leave empty)* |
   | Runtime / Language | **Node** |
   | Build Command | `npm install --include=dev && npm run build` |
   | Start Command | `npm start` |
   | Instance Type | **Free** |

   The build command must include `--include=dev`: with `NODE_ENV=production`, a plain `npm install` skips TypeScript and the build fails with `tsc: not found`.

4. **Environment Variables** (*Advanced* or the *Environment* tab):

   | Key | Value |
   | --- | --- |
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | the full Atlas string from step 1.5 |
   | `JWT_SECRET` | a **new** random value (see below) — don't reuse your local one |
   | `COOKIE_SECURE` | `true` |
   | `TRUST_PROXY` | `2` |
   | `CLIENT_ORIGIN` | `https://tilak-client-operations.vercel.app` (update in step 3.4 if Vercel gives a different URL) |

   Don't add `PORT` — Render sets it automatically.

   Generate the `JWT_SECRET` on your computer:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

5. *Advanced → Health Check Path*: `/api/health`
6. Click **Create Web Service**. The first build takes 2–4 minutes. In **Logs** you should see:
   ```
   MongoDB connected: tilak_industries
   API server running on http://localhost:10000
   ```
7. Open `https://tilak-server-oprations.onrender.com/api/health` → it should show `{"status":"ok"}`.

> **If Render gives a different URL** (for example because the name was taken), copy it — you'll need it in `vercel.json` (step 3.1).

---

## 3. Vercel (frontend)

1. **Check `vercel.json`** in the `tilak-client-operations` repo. The `destination` must be your Render URL:
   ```json
   { "source": "/api/:path*", "destination": "https://tilak-server-oprations.onrender.com/api/:path*" }
   ```
   If your Render URL is different, edit it, commit and push before continuing.
2. Sign up at <https://vercel.com> **with GitHub** and allow access to `tilak-client-operations`.
3. **Add New → Project** → import `tilak-client-operations`. Vercel detects **Vite** automatically:

   | Field | Value |
   | --- | --- |
   | Framework Preset | Vite |
   | Root Directory | `./` |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |
   | Environment Variables | *none needed* |

   Click **Deploy**. You get a URL like `https://tilak-client-operations.vercel.app`.
4. **Connect them:** if the Vercel URL differs from the `CLIENT_ORIGIN` you entered on Render, go to Render → your service → **Environment** → update `CLIENT_ORIGIN` to the real Vercel URL → **Save** (Render redeploys).

---

## 4. Create the first admin login on the live database

Skip this if you copied your data in step 1b — your existing logins came with it.

Render's free plan has no shell, so run the command **from your computer** against the Atlas database:

```bash
cd tilak-server-oprations    # your local clone of the server repo
npm install
read -s "ATLAS?Paste MONGODB_URI: " && echo && MONGODB_URI="$ATLAS" npm run create-admin; unset ATLAS
```

It asks for a name, username and password (the password is hidden while you type).

---

## 5. Test the live app

1. Open your Vercel URL → you should see the login page.
2. Log in as the admin → add a customer → place an order.
3. **Users** → add a worker → log out → log in as the worker → you should only see **Manufacturing**, and opening the order should show no customer details.
4. Change a status to **Ready for Shipment** with a produced quantity → log back in as admin → the order shows both quantities.

---

## Free-plan behaviour to know about

- **Render sleeps after 15 minutes without traffic.** The next request wakes it, which takes about 30–60 seconds. If the first login after a quiet period shows an error or spins, wait a moment and try again.
  *Optional fix:* create a free monitor at <https://uptimerobot.com> that requests `https://tilak-server-oprations.onrender.com/api/health` every 5 minutes. One always-awake service fits inside Render's 750 free hours per month.
- **Atlas M0** gives 512 MB of storage — enough for many thousands of orders.
- **Auto-deploy:** every push to `main` redeploys automatically — the server on Render, the frontend on Vercel.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Render build fails with `tsc: not found` | Build command missing `--include=dev` | Use `npm install --include=dev && npm run build` |
| Render log: `JWT_SECRET is missing or too short` | Env var not set | Add `JWT_SECRET` (64+ random characters) |
| Render log: `MongoServerSelectionError` / `bad auth` | Atlas network access or password | Allow `0.0.0.0/0` in Atlas Network Access; re-check the password in `MONGODB_URI` |
| Login page shows "Cannot reach the server" or 404 | `vercel.json` points to the wrong Render URL | Fix the `destination`, push again |
| Login seems to succeed but you're sent back to login | Cookie blocked | Make sure you open the **Vercel** URL (not the Render URL) and `COOKIE_SECURE=true` on Render |
| "Too many login attempts" for everyone | `TRUST_PROXY` not set | Set `TRUST_PROXY=2` on Render |
| Refreshing a page like `/orders/123` shows 404 | `vercel.json` missing the `/(.*)` → `/index.html` rewrite | Restore that rule |
