# tilak-server-oprations

REST API for **Tilak Industries** — orders, manufacturing status, customers and user logins for a corrugated box business.

Built with Node.js, Express, MongoDB (Mongoose), TypeScript and Zod. The React frontend lives in [tilak-client-operations](https://github.com/rushabhchothani2001/tilak-client-operations).

## Requirements

- Node.js 18 or newer
- MongoDB (local or MongoDB Atlas)

## Getting started

```bash
npm install
cp .env.example .env     # then set JWT_SECRET (and MONGODB_URI if needed)
npm run create-admin     # create the first admin login
npm run dev              # API on http://localhost:5000
```

Generate a `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

**Forgot the admin password?** Run `npm run create-admin` again with the same username to reset it.

## Deployment

Step-by-step free hosting (MongoDB Atlas + Render + Vercel): see **[DEPLOYMENT.md](DEPLOYMENT.md)**.

## Environment variables (`.env`)

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `5000` | API port |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/tilak_industries` | Database connection |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |
| `NODE_ENV` | `development` | `production` also serves a built client from `../client/dist` if present |
| `JWT_SECRET` | — (**required**, min 32 chars) | Signs login sessions. Keep secret; changing it logs everyone out |
| `COOKIE_SECURE` | `false` | Set `true` when served over HTTPS |
| `TRUST_PROXY` | `0` | Number of proxies in front of the app. `2` on Render behind the Vercel rewrite |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start with auto-reload (tsx) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled server |
| `npm run typecheck` | Type-check only |
| `npm run create-admin` | Create an admin, or reset a user's password and make them admin |
| `npm run create-admin:prod` | Same, using the compiled `dist/` (no dev dependencies needed) |

## Roles

- **Admin** — everything: orders, customers, users, manufacturing.
- **Worker** — manufacturing only. Customer details are never returned to workers.

## API

All endpoints except `/api/health` and `/api/auth/login` need a logged-in session (httpOnly cookie).

| Access | Method | Endpoint | Description |
| --- | --- | --- | --- |
| Public | GET | `/api/health` | Health check |
| Public | POST | `/api/auth/login` | `{ username, password }` — 10 failed attempts per 15 min per IP + username |
| Public | POST | `/api/auth/logout` | Clear session |
| Logged in | GET | `/api/auth/me` | Current user |
| Admin | GET / POST | `/api/users` | List / create users |
| Admin | PATCH | `/api/users/:id` | Update name, role, active, or reset password |
| Admin | GET / POST | `/api/customers` | List (`?search=`) / create customers |
| Admin | GET / PUT / DELETE | `/api/customers/:id` | Read / update / delete (blocked if customer has orders) |
| Admin | GET / POST | `/api/orders` | List (`?status=&customer=`) / place order (`productName` is required) |
| Admin | GET / DELETE | `/api/orders/:id` | Order with customer details / delete |
| Admin, Worker | GET | `/api/manufacturing/orders` | Orders without customer data (`?status=active` or a status) |
| Admin, Worker | GET | `/api/manufacturing/orders/:id` | Order without customer data |
| Admin, Worker | PATCH | `/api/manufacturing/orders/:id/status` | `{ status, producedQuantity }` — quantity required for `ready_to_shipment` |

**Order statuses:** `order_placed` → `paper_cutting_in_process` → `paper_import_from_outside` → `liner_in_process` → `liner_process_completed` → `packaging_in_process` → `ready_to_shipment`

**Inside paper fluted** accepts one or more values: `120`, `"120/150/160"` or `[120, 150, 160]`.

## Project structure

```
src/
├── config/        env, database connection, startup migrations
├── constants/     ply, paper, print types, statuses, roles
├── models/        User, Customer, Order, Counter (order numbers)
├── validators/    Zod request schemas
├── controllers/   auth, user, customer, order, manufacturing
├── routes/        Express routers
├── middleware/    login/role checks, validation, error handling
├── utils/         scrypt password hashing
└── scripts/       create-admin command
```
