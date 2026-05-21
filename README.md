# Kueski API

REST API built with Express.js that simulates a fintech backend. Covers authentication with JWT, user dashboard, loan management, and commerce benefits.

## Stack

- **Node.js** + **Express.js** — ES Modules (`"type": "module"`)
- **jsonwebtoken** — JWT signing and verification
- **dotenv** — environment variable management

## Project Structure

```
├── app.js                  # Express app setup and route mounting
├── bin/www                 # HTTP server entry point
├── controllers/
│   ├── auth.controller.js
│   ├── user.controller.js
│   └── commerce.controller.js
├── middleware/
│   └── auth.middleware.js  # JWT verification middleware
├── routes/
│   ├── auth.routes.js
│   ├── users.routes.js
│   └── commerce.routes.js
└── postman/                # Postman collection and environment
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a `.env` file in the project root:

```env
JWT_SECRET=your_secret_here
```

### 3. Start the server

```bash
npm start
```

Server runs on `http://localhost:3000`.

## API Reference

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/login` | No | Login and receive a JWT |

**POST /auth/login**
```json
// Request body
{ "email": "valeria@kueski.com", "password": "kueski123" }

// Response
{ "status": "success", "data": { "token": "<jwt>", "user": { ... } } }
```

---

### Users — requires `Authorization: Bearer <token>`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/me/dashboard` | Balance and cashback |
| GET | `/users/loans` | Active loans summary |

---

### Commerce — requires `Authorization: Bearer <token>`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/commerce/benefits?domain=` | Check if a domain is a partner |
| POST | `/commerce/transactions/simulate` | Simulate a purchase with payment plans |

**POST /commerce/transactions/simulate**
```json
// Request body
{ "monto": 1500, "id_partner": "store_001" }
```

## Authentication Flow

1. `POST /auth/login` → receive JWT (valid for 2 hours)
2. Include the token in all protected requests:
   ```
   Authorization: Bearer <token>
   ```
3. Requests without a valid token return `401`.

## Test Credentials

| Email | Password |
|-------|----------|
| valeria@kueski.com | kueski123 |
| carlos@kueski.com | kueski456 |

## Postman

Import the collection and environment from the `postman/` folder. Run **POST Login** first — it automatically saves the token to `{{authToken}}` for use in subsequent requests.
