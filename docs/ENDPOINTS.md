# API Endpoints Reference

**Base URL (production):** `https://rest-api-kueski.onrender.com`
**Base URL (development):** `http://localhost:3000`

Protected endpoints require the following header:

```http
Authorization: Bearer <token>
```

---

## Auth

### POST /auth/login

Validates user credentials and returns a JWT. This is the only endpoint that does not require a token.

**Request body:**

```json
{
  "email": "carlos.mendoza@gmail.com",
  "password": "Kueski2024!"
}
```

**200 OK:**

```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "user": {
      "id_cliente": 1,
      "nombre": "Carlos Mendoza Ríos",
      "email": "carlos.mendoza@gmail.com"
    }
  }
}
```

| Status | Condition |
| --- | --- |
| 200 | Credentials valid — returns token and user object |
| 400 | Missing email or password |
| 401 | Email not found or password does not match |
| 500 | Database error |

---

### GET /auth/verify

Checks whether a token is still valid. The extension calls this on startup to avoid making a full data request when the session may have expired.

**Protected.**

**200 OK:**

```json
{ "status": "success", "is_valid": true }
```

| Status | Condition |
| --- | --- |
| 200 | Token is valid |
| 401 | Token missing, invalid, or expired |

---

## Users

### GET /users/me/dashboard

Returns the authenticated user's available balance and approved cashback. Both database queries run in parallel.

**Protected.**

**200 OK:**

```json
{
  "status": "success",
  "data": {
    "balance": {
      "available": 15000.00,
      "currency": "MXN"
    },
    "cashback": {
      "available": 180.00
    }
  }
}
```

| Status | Condition |
| --- | --- |
| 200 | Account found |
| 401 | Invalid or missing token |
| 404 | No active account found for this user |
| 500 | Database error |

---

### GET /users/loans

Returns a summary and list of the authenticated user's active loans, ordered by nearest due date.

**Protected.**

**200 OK:**

```json
{
  "status": "success",
  "data": {
    "summary": {
      "total_active": 1,
      "total_pending": 5000.00,
      "next_due_date": "2026-04-10T00:00:00.000Z"
    },
    "active_loans": [
      {
        "id_prestamo": 1,
        "cantidad": 5000.00,
        "tasa": 0.08,
        "cuotas": 3,
        "fecha_aprobacion": "2026-01-10T06:00:00.000Z",
        "fecha_fin": "2026-04-10T00:00:00.000Z"
      }
    ]
  }
}
```

| Status | Condition |
| --- | --- |
| 200 | One or more active loans found |
| 401 | Invalid or missing token |
| 404 | No active loans for this user |
| 500 | Database error |

---

## Commerce

### GET /commerce/benefits?domain=

Checks whether a domain is a registered partner store and returns its cashback rate.

**Public — no token required.**

**Query parameter:** `domain` — the store hostname without `www.` (e.g. `amazon.com.mx`)

**200 OK — partner store:**

```json
{
  "status": "success",
  "data": {
    "is_partner": true,
    "id_partner": 2,
    "cashback_percentage": 2.50
  }
}
```

**200 OK — not a partner:**

```json
{
  "status": "success",
  "data": { "is_partner": false }
}
```

| Status | Condition |
| --- | --- |
| 200 | Always 200 — `is_partner` flag indicates the result |
| 400 | Missing `domain` query parameter |
| 500 | Database error |

---

## Transactions

### POST /transactions/simulate

Calculates installment payment plans for a given amount at a partner store. This is a **read-only** calculation — no database records are created.

**Protected.**

**Request body:**

```json
{
  "monto": 5000,
  "id_partner": 2
}
```

**200 OK:**

```json
{
  "status": "success",
  "data": {
    "is_approved": true,
    "cashback_to_earn": 125.00,
    "balance_disponible": 15000.00,
    "cashback_disponible": 180.00,
    "payment_plans": [
      { "cuotas": 3,  "monto_cuota": 1705.77, "total": 5117.31 },
      { "cuotas": 6,  "monto_cuota": 858.89,  "total": 5153.34 },
      { "cuotas": 12, "monto_cuota": 433.50,  "total": 5202.00 }
    ]
  }
}
```

**`is_approved`** is `true` when `monto <= balance + cashback`. Payment plans use the French amortization formula at **8% annual interest** (≈ 0.667% monthly).

| Status | Condition |
| --- | --- |
| 200 | Calculation successful |
| 400 | Missing `monto` or `id_partner` |
| 401 | Invalid or missing token |
| 404 | No active account found for this user |
| 500 | Database error |

---

### POST /transactions

Registers a purchase intent. Creates a `transaccion` record with status `pendiente` and a linked `solicitud_cb`.

**Protected.**

**Request body:**

```json
{
  "monto": 5000,
  "id_partner": 2,
  "url": "amazon.com.mx/cart"
}
```

**201 Created:**

```json
{
  "status": "success",
  "data": {
    "id_transaccion": 42,
    "cashback_a_ganar": 125.00
  }
}
```

| Status | Condition |
| --- | --- |
| 201 | Transaction and cashback request created |
| 400 | Missing `monto`, `id_partner`, or `url` |
| 401 | Invalid or missing token |
| 404 | Partner ID does not exist |
| 500 | Database error |

---

### POST /transactions/:id/confirm

Confirms that a payment was completed. Atomically performs all of the following in a single SQL transaction:

1. Marks the `transaccion` as `aprobado`
2. Marks the `solicitud_cb` as `aprobada`
3. Creates an `aprobacion_cb` audit record
4. Credits the cashback amount to the user's `cashback` balance (upsert)

If any step fails, all changes are rolled back — the user's cashback is never partially updated.

**Protected. No request body — transaction ID is a path parameter.**

**Example:** `POST /transactions/42/confirm`

**200 OK:**

```json
{
  "status": "success",
  "data": {
    "cashback_ganado": 125.00,
    "nuevo_saldo_cashback": 305.00
  }
}
```

| Status | Condition |
| --- | --- |
| 200 | Payment confirmed, cashback credited |
| 401 | Invalid or missing token |
| 404 | Transaction not found or belongs to a different user |
| 409 | Transaction was already confirmed (estado ≠ `pendiente`) |
| 500 | Database error — SQL transaction was rolled back |
