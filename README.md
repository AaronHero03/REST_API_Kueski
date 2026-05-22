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
└── └── commerce.routes.js

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

| Method | Endpoint      | Auth | Description             |
| ------ | ------------- | ---- | ----------------------- |
| POST   | `/auth/login` | No   | Login and receive a JWT |

**POST /auth/login**

```json
// Request body
{ "email": "valeria@kueski.com", "password": "kueski123" }

// Response
{ "status": "success", "data": { "token": "<jwt>", "user": { ... } } }
```

---

### Users — requires `Authorization: Bearer <token>`

| Method | Endpoint              | Description          |
| ------ | --------------------- | -------------------- |
| GET    | `/users/me/dashboard` | Balance and cashback |
| GET    | `/users/loans`        | Active loans summary |

---

### Commerce — requires `Authorization: Bearer <token>`

| Method | Endpoint                          | Description                            |
| ------ | --------------------------------- | -------------------------------------- |
| GET    | `/commerce/benefits?domain=`      | Check if a domain is a partner         |
| POST   | `/commerce/transactions/simulate` | Simulate a purchase with payment plans |

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

| Email              | Password  |
| ------------------ | --------- |
| valeria@kueski.com | kueski123 |
| carlos@kueski.com  | kueski456 |

## Database Structure

MySQL database (`kueski_db`) hosted on Aiven Cloud. The schema covers clients, accounts, loans, cashback, partner stores, and transactions.

### `cliente`
Stores registered users. Each client has a unique email and optionally an active session token.

| Column          | Type           | Description                        |
| --------------- | -------------- | ---------------------------------- |
| `id_cliente`    | INT (PK)       | Auto-increment primary key         |
| `nombre`        | VARCHAR(100)   | Full name                          |
| `email`         | VARCHAR(150)   | Unique email address               |
| `password`      | VARCHAR(255)   | Plain-text password (no hashing)   |
| `token_session` | VARCHAR(255)   | Last issued JWT session token      |
| `created_at`    | TIMESTAMP      | Account creation timestamp         |

---

### `cuenta`
Account balance for each client. A client may have one active account.

| Column       | Type                              | Description                        |
| ------------ | --------------------------------- | ---------------------------------- |
| `id_cuenta`  | INT (PK)                          | Auto-increment primary key         |
| `id_cliente` | INT (FK → cliente)                | Owner of the account               |
| `saldo`      | DECIMAL(12,2)                     | Available balance in MXN           |
| `estado`     | ENUM('ACTIVA','INACTIVA','BLOQUEADA') | Account status                 |
| `created_at` | TIMESTAMP                         | Account creation timestamp         |

---

### `cashback`
Tracks cashback balance per client, split between pending (not yet approved) and approved (usable) amounts.

| Column            | Type           | Description                              |
| ----------------- | -------------- | ---------------------------------------- |
| `id_cashback`     | INT (PK)       | Auto-increment primary key               |
| `id_cliente`      | INT (FK → cliente) | Owner of the cashback balance        |
| `monto_pendiente` | DECIMAL(12,2)  | Cashback earned but not yet approved     |
| `monto_aprobado`  | DECIMAL(12,2)  | Cashback available to use               |
| `updated_at`      | TIMESTAMP      | Last update timestamp                    |

---

### `solicitud_prestamo`
Loan applications submitted by clients. Approved applications generate a record in `prestamo`.

| Column         | Type                                  | Description                        |
| -------------- | ------------------------------------- | ---------------------------------- |
| `id_soliPres`  | INT (PK)                              | Auto-increment primary key         |
| `id_cliente`   | INT (FK → cliente)                    | Applicant                          |
| `cantidad`     | DECIMAL(12,2)                         | Requested loan amount in MXN       |
| `fecha_inicio` | DATE                                  | Loan start date                    |
| `fecha_fin`    | DATE                                  | Loan end / due date                |
| `estado`       | ENUM('PENDIENTE','APROBADA','RECHAZADA') | Application status              |
| `created_at`   | TIMESTAMP                             | Submission timestamp               |

---

### `prestamo`
Approved and active loans. Each loan is linked to exactly one `solicitud_prestamo`.

| Column        | Type                               | Description                          |
| ------------- | ---------------------------------- | ------------------------------------ |
| `id_prestamo` | INT (PK)                           | Auto-increment primary key           |
| `id_solicitud`| INT (FK → solicitud_prestamo, UNI) | Source loan application (1-to-1)     |
| `monto`       | DECIMAL(12,2)                      | Approved loan amount in MXN          |
| `cuotas`      | INT                                | Number of monthly installments       |
| `tasa`        | DECIMAL(5,2)                       | Annual interest rate (%)             |
| `estado`      | ENUM('ACTIVO','PAGADO','ATRASADO') | Current loan status                  |
| `created_at`  | TIMESTAMP                          | Approval timestamp                   |

---

### `tiendas_partner`
Partner stores that offer cashback to clients when they shop there.

| Column          | Type          | Description                            |
| --------------- | ------------- | -------------------------------------- |
| `id_partner`    | INT (PK)      | Auto-increment primary key             |
| `nombre`        | VARCHAR(100)  | Store name                             |
| `dominio`       | VARCHAR(255)  | Store domain (e.g. `amazon.com.mx`)    |
| `cashback_rate` | DECIMAL(5,2)  | Cashback percentage offered (e.g. 5.00 = 5%) |
| `created_at`    | TIMESTAMP     | Record creation timestamp              |

---

### `transaccion`
Records purchases made by clients at partner stores.

| Column           | Type                                    | Description                    |
| ---------------- | --------------------------------------- | ------------------------------ |
| `id_transaccion` | INT (PK)                                | Auto-increment primary key     |
| `id_cliente`     | INT (FK → cliente)                      | Client who made the purchase   |
| `id_partner`     | INT (FK → tiendas_partner)              | Store where the purchase was made |
| `monto`          | DECIMAL(12,2)                           | Transaction amount in MXN      |
| `fecha`          | DATETIME                                | Transaction date and time      |
| `estado`         | ENUM('PENDIENTE','COMPLETADA','CANCELADA') | Transaction status          |

---

### `solicitud_cb`
Cashback claim requests tied to a transaction. Once verified, they generate an `aprobacion_cb` record.

| Column           | Type                                    | Description                        |
| ---------------- | --------------------------------------- | ---------------------------------- |
| `id_SoliCB`      | INT (PK)                                | Auto-increment primary key         |
| `id_transaccion` | INT (FK → transaccion)                  | Transaction that generated the cashback |
| `url`            | VARCHAR(500)                            | Supporting URL or receipt link     |
| `cantidad_CB`    | DECIMAL(12,2)                           | Cashback amount being claimed      |
| `estado`         | ENUM('PENDIENTE','APROBADA','RECHAZADA') | Claim status                      |
| `created_at`     | TIMESTAMP                               | Submission timestamp               |

---

### `aprobacion_cb`
Records approved cashback payouts. Links a cashback claim to the transaction that funded it.

| Column              | Type                   | Description                          |
| ------------------- | ---------------------- | ------------------------------------ |
| `id_aprob`          | INT (PK)               | Auto-increment primary key           |
| `id_SoliCB`         | INT (FK → solicitud_cb) | Approved cashback claim             |
| `id_transaccion`    | INT (FK → transaccion) | Source transaction                   |
| `cantidad`          | DECIMAL(12,2)          | Final approved cashback amount       |
| `fecha_aprobacion`  | TIMESTAMP              | Approval timestamp                   |
