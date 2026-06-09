# API Architecture

## Overview

The KueskiPay API is a RESTful backend built with **Node.js + Express.js**, connected to a **MySQL** database. It serves as the single source of truth for the Chrome extension, handling authentication, user data, commerce lookups, and transaction processing.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ES Modules) |
| Framework | Express.js |
| Database | MySQL 8 via `mysql2/promise` (connection pool) |
| Authentication | JSON Web Tokens (`jsonwebtoken`) |
| Deployment | Render.com |
| Environment | `dotenv` |

---

## Folder Structure

```
API/
├── app.js                        # Express app — registers routes, middleware, error handlers
├── bin/www                       # HTTP server entry point (starts the app)
├── config/
│   └── database.js               # MySQL connection pool (reads from .env)
├── controllers/                  # Business logic — one file per domain
│   ├── auth.controller.js        # Login, token verification
│   ├── user.controller.js        # Dashboard, loans
│   ├── commerce.controller.js    # Partner lookup, transaction simulation
│   └── transaction.controller.js # Purchase intent, payment confirmation
├── middleware/
│   └── auth.middleware.js        # JWT verification — protects routes
├── routes/                       # Route definitions — thin wrappers over controllers
│   ├── auth.routes.js
│   ├── users.routes.js
│   ├── commerce.routes.js
│   └── transaction.routes.js
└── docs/                         # This documentation
```

---

## Request Lifecycle

Every HTTP request passes through this chain before a response is returned:

```
Incoming HTTP Request
        │
        ▼
    app.js middleware stack
    (logger → JSON parser → cookie parser)
        │
        ▼
    Router match  (e.g. GET /users/me/dashboard)
        │
        ▼
    authMiddleware  ← only on protected routes
    (reads Authorization header, verifies JWT, sets req.user)
        │
        ▼
    Controller function
    (validates input → queries DB → builds response)
        │
        ▼
    HTTP Response  { status, data } or { status, message }
```

---

## Route Map

| Method | Path | Protected | Controller function |
|---|---|---|---|
| POST | `/auth/login` | No | `auth.login` |
| GET | `/auth/verify` | Yes | `auth.verify` |
| GET | `/users/me/dashboard` | Yes | `user.getUserDashboard` |
| GET | `/users/loans` | Yes | `user.getUserLoans` |
| GET | `/commerce/benefits` | No | `commerce.checkBenefits` |
| POST | `/transactions/simulate` | Yes | `commerce.simulateTransaction` |
| POST | `/transactions` | Yes | `transaction.trackIntent` |
| POST | `/transactions/:id/confirm` | Yes | `transaction.confirmTransaction` |

---

## Response Format

All responses follow a consistent shape:

**Success:**
```json
{
  "status": "success",
  "data": { ... }
}
```

**Error:**
```json
{
  "status": "error",
  "message": "Human-readable description of what went wrong"
}
```

---

## Environment Variables

Create a `.env` file in `API/`:

```env
PORT=3000

DB_HOST=your-database-host
DB_PORT=3306
DB_USER=your-db-username
DB_PASSWORD=your-db-password
DB_NAME=default_db

JWT_SECRET=a-long-random-secret-string
```

> **Never commit `.env` to version control.** The `.gitignore` already excludes it.

---

## Database Connection

`config/database.js` creates a **connection pool** using `mysql2/promise`. A pool reuses open connections across requests, which is more efficient than opening a new connection per request.

```js
const db = mysql.createPool({ host, port, user, password, database, ssl: ... });
```

Most queries use `db.execute(sql, params)` — a parameterized query that prevents SQL injection. The `confirmTransaction` controller acquires a dedicated connection (`db.getConnection()`) to run an atomic SQL transaction.

---

## Further Reading

- [AUTHENTICATION.md](./AUTHENTICATION.md) — JWT flow and middleware details
- [ENDPOINTS.md](./ENDPOINTS.md) — Full endpoint reference with request/response examples
- [DATABASE.md](./DATABASE.md) — Entity-relationship diagram and SQL queries
- [SETUP.md](./SETUP.md) — How to run the API locally and seed the database
