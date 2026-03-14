# CoreInventory

A modern full-stack **Inventory Management System** for tracking stock in real time, with a SaaS-style dashboard, multi-warehouse support, receipts, delivery orders, internal transfers, and inventory adjustments.

## Tech stack

- **Frontend:** Next.js 14, React, Tailwind CSS
- **Backend:** Node.js, Express
- **Database:** MongoDB (with Mongoose)
- **Auth:** JWT + OTP-based password reset

## Features

- **Authentication:** Sign up, login, logout, OTP password reset, redirect to dashboard after login
- **Dashboard:** KPI cards (total in stock, low/out-of-stock, pending receipts/deliveries/transfers), filters by warehouse and category, low stock alerts
- **Products:** CRUD with name, SKU, category, unit of measure, initial stock, warehouse; search by SKU; low stock filter
- **Warehouses:** Create and manage locations
- **Receipts:** Incoming stock from suppliers; validate to increase stock
- **Delivery orders:** Outgoing stock to customers; validate to decrease stock
- **Internal transfers:** Move stock between warehouses; validate to update locations
- **Adjustments:** Reconcile physical vs system stock; apply to update quantities
- **Movement history:** Ledger of all movements (date, product, type, quantity, location, user) with filters

## Quick start

### 1. MongoDB

Have MongoDB running locally (e.g. `mongod`) or set `MONGODB_URI` in the server `.env`.

### 2. Backend

```bash
cd server
npm install
cp .env.example .env
# Edit .env if needed (JWT_SECRET, MONGODB_URI, FRONTEND_URL)
npm run dev
```

API runs at **http://localhost:4000**.

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

App runs at **http://localhost:3000**. The frontend proxies `/api/*` to the backend.

### 4. First use

1. Open http://localhost:3000 and **Sign up**.
2. Create at least one **Warehouse** (e.g. "Main", code "WH1").
3. Create **Products** (with optional initial stock and warehouse).
4. Use **Receipts** / **Deliveries** / **Transfers** / **Adjustments** as needed; validate or apply to update stock.
5. Check **Dashboard** for KPIs and **Movement history** for the ledger.

## Environment (server)

| Variable         | Description                    |
|------------------|--------------------------------|
| PORT             | API port (default 4000)        |
| MONGODB_URI       | MongoDB connection string      |
| JWT_SECRET        | Secret for JWT signing         |
| JWT_EXPIRES_IN    | Token expiry (e.g. 7d)          |
| OTP_EXPIRES_MINUTES | OTP validity for password reset |
| FRONTEND_URL      | Allowed CORS origin (e.g. http://localhost:3000) |
| SMTP_*            | Optional; for sending OTP emails (e.g. Ethereal) |

## Project structure

```
CoreInventory/
├── client/                 # Next.js app
│   ├── app/                # Routes & pages
│   ├── components/         # Sidebar, Modal, Table, AppLayout
│   ├── context/            # AuthContext
│   └── lib/                # API client
├── server/                 # Express API
│   ├── models/             # User, Warehouse, Product, StockLevel, Receipt, Delivery, Transfer, Adjustment, Movement
│   ├── routes/             # auth, dashboard, products, warehouses, receipts, deliveries, transfers, adjustments, movements
│   ├── middleware/         # auth (JWT)
│   ├── services/           # stockService (update stock, record movement)
│   └── utils/              # email (OTP)
└── README.md
```

## API overview

- `POST /api/auth/signup` – Register
- `POST /api/auth/login` – Login (returns JWT)
- `POST /api/auth/forgot-password` – Request OTP
- `POST /api/auth/reset-password` – Reset password with OTP
- `GET /api/auth/me` – Current user (Bearer token)
- `GET /api/dashboard/kpis` – Dashboard KPIs (query: warehouse, category)
- `GET|POST /api/warehouses` – List, create
- `GET|POST /api/products` – List (query: sku, category, warehouse, lowStock), create
- `GET|POST /api/receipts`, `POST /api/receipts/:id/validate`
- `GET|POST /api/deliveries`, `POST /api/deliveries/:id/validate`
- `GET|POST /api/transfers`, `POST /api/transfers/:id/validate`
- `GET|POST /api/adjustments`, `POST /api/adjustments/:id/apply`
- `GET /api/movements` – Query: type, warehouse, product, fromDate, toDate

All protected routes require header: `Authorization: Bearer <token>`.
