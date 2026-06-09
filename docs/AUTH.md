# Authentication

## How It Works

KueskiPay uses **JSON Web Tokens (JWT)** for stateless authentication. After a successful login, the server issues a signed token. The client stores it and sends it with every subsequent request to prove its identity.

The server **never stores the token** — it only verifies the signature when a request arrives.

### JWT Structure

A JWT is a string made of three base64-encoded parts separated by dots:

```text
eyJhbGciOiJIUzI1NiJ9 . eyJpZCI6MSwiZW1haWwiOiJ9 . xK3p9Z...
      HEADER                     PAYLOAD               SIGNATURE
```

| Part | Contents | Secret? |
| --- | --- | --- |
| Header | Algorithm used (HS256) | No |
| Payload | `id_cliente`, `email`, expiry time | No — encoded, not encrypted |
| Signature | Proof the token wasn't tampered with | Yes — requires `JWT_SECRET` |

Tokens expire after **2 hours**. After that, the user must log in again.

---

## Authentication Flow

```text
Client                                Server
  │                                      │
  │─── POST /auth/login ───────────────▶ │  1. Receives email + password
  │    { email, password }               │  2. Looks up user in DB
  │                                      │  3. Compares password
  │◀── { token, user } ──────────────── │  4. Signs and returns JWT (2h expiry)
  │                                      │
  │─── GET /users/me/dashboard ────────▶ │  5. Reads Authorization header
  │    Authorization: Bearer <token>     │  6. Verifies JWT signature
  │                                      │  7. Extracts id_cliente from payload
  │◀── { balance, cashback } ─────────── │  8. Returns data for that user only
```

---

## Implementation

### 1. Login — `controllers/auth.controller.js`

```js
const [rows] = await db.execute(
  "SELECT id_cliente, nombre, email, password FROM cliente WHERE email = ?",
  [email.trim().toLowerCase()]
);

const cliente = rows[0];
if (!cliente || cliente.password !== password) {
  return res.status(401).json({ status: "error", message: "Credenciales incorrectas." });
}

const token = jwt.sign(
  { id_cliente: cliente.id_cliente, email: cliente.email },
  process.env.JWT_SECRET,
  { expiresIn: "2h" }
);
```

The user's `id_cliente` and `email` are embedded in the token payload. Any protected endpoint can read them back from `req.user` after the middleware verifies the token.

---

### 2. Middleware — `middleware/auth.middleware.js`

Runs before every protected route. Reads the `Authorization` header, verifies the token against `JWT_SECRET`, and attaches the decoded payload to `req.user`.

```js
export const authMiddleware = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ ... });

  const payload = jwt.verify(token, process.env.JWT_SECRET);
  req.user = payload; // { id_cliente, email, iat, exp }
  next();
};
```

If the token is missing, malformed, or expired, the request is rejected with `401` before it reaches the controller.

---

### 3. Route Protection — `app.js`

```js
app.use("/auth",         authRoutes);                          // public
app.use("/users",        authMiddleware, usersRouter);          // protected
app.use("/commerce",     commerceRoutes);                      // public
app.use("/transactions", authMiddleware, transactionsRoutes);  // protected
```

Only `/auth/login` and `/auth/verify` are accessible without a token. Everything else requires a valid JWT.

---

### 4. Using `req.user` in Controllers

Controllers never read the user's ID from the request body — always from `req.user`. This prevents any user from requesting another user's data.

```js
const getUserDashboard = async (req, res) => {
  const { id_cliente } = req.user; // set by authMiddleware
  const [rows] = await db.execute(
    "SELECT saldo FROM cuenta WHERE id_cliente = ?",
    [id_cliente] // always scoped to the authenticated user
  );
};
```

---

## Sending the Token

After login, store the token and include it in every protected request:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

### Common Error Responses

| Scenario | HTTP Status | Message |
| --- | --- | --- |
| No token sent | 401 | `"Token requerido."` |
| Invalid or expired token | 401 | `"Token inválido o expirado."` |

---

## Token Verification Endpoint

`GET /auth/verify` validates a token without returning any user data. The extension calls this on startup to check whether the stored session is still valid.

```json
{ "status": "success", "is_valid": true }
```

If the token is invalid or expired, it returns `401`.
