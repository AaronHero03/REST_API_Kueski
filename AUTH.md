# Sistema de Autenticación con JWT

## ¿Qué es un token JWT?

Un **JWT (JSON Web Token)** es una cadena de texto que sirve como una "credencial temporal". Cuando inicias sesión correctamente, el servidor te entrega un token. A partir de ese momento, en cada petición que hagas, debes enviarlo para demostrar que eres tú.

Un JWT tiene tres partes separadas por puntos:

```
eyJhbGciOiJIUzI1NiJ9 . eyJpZCI6MSwiZW1haWwiOiJ . xK3p9Z...
HEADER, PAYLOAD, FIRMA
```

- **Header** — indica el algoritmo de cifrado usado.
- **Payload** — contiene los datos del usuario (id, email, etc.). No es secreto, cualquiera puede leerlo.
- **Firma** — garantiza que el token no fue alterado. Solo el servidor puede generarla porque usa una clave secreta (`JWT_SECRET`).

> El servidor **nunca guarda el token**. Solo verifica que la firma sea válida cuando llega una petición.

---

## Flujo completo de autenticación

```
Cliente                              Servidor
  │                                     │
  │──── POST /auth/login ─────────────▶ │  1. Recibe email y password
  │     { email, password }             │  2. Busca al usuario en la BD
  │                                     │  3. Compara la contraseña
  │◀─── { token, user } ─────────────── │  4. Crea y devuelve el JWT
  │                                     │
  │──── GET /users/me/dashboard ──────▶ │  5. Recibe el token en el header
  │     Authorization: Bearer <token>   │  6. Verifica la firma del JWT
  │                                     │  7. Extrae el id_cliente del payload
  │◀─── { balance, cashback } ───────── │  8. Devuelve los datos del usuario
```

---

## Cómo está aplicado en el código

### 1. Login — `controllers/auth.controller.js`

```js
const login = async (req, res) => {
    const { email, password } = req.body;

    // Busca al usuario en la base de datos
    const [rows] = await db.execute(
        "SELECT id_cliente, nombre, email, password FROM CLIENTE WHERE email = ?",
        [email.toLowerCase()]
    );

    const cliente = rows[0];

    // Si no existe o la contraseña no coincide, rechaza
    if (!cliente || cliente.password !== password) {
        return res.status(401).json({ message: "Credenciales incorrectas." });
    }

    // Crea el token con los datos del usuario y lo firma con JWT_SECRET
    const token = jwt.sign(
        { id_cliente: cliente.id_cliente, email: cliente.email },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }   // el token expira en 2 horas
    );

    res.status(200).json({ token, user: { ... } });
};
```

**¿Qué pasa aquí?**

- Se reciben el email y la contraseña del body.
- Se consulta la base de datos para encontrar al usuario.
- Si las credenciales son válidas, se firma un JWT con `id_cliente` y `email` adentro.
- El token expira en **2 horas**, después de ese tiempo hay que volver a hacer login.

---

### 2. Middleware de protección — `middleware/auth.middleware.js`

```js
export const authMiddleware = (req, res, next) => {
	// Lee el header: "Authorization: Bearer <token>"
	const authHeader = req.headers["authorization"];
	const token = authHeader && authHeader.split(" ")[1];

	if (!token) {
		return res.status(401).json({ message: "Token requerido." });
	}

	// Verifica la firma del token usando JWT_SECRET
	const payload = jwt.verify(token, process.env.JWT_SECRET);

	// Guarda los datos del usuario en req.user para usarlos después
	req.user = payload;
	next(); // continúa al controlador
};
```

**¿Qué pasa aquí?**

- Se lee el header `Authorization` de la petición.
- Si no hay token, la petición se rechaza con un `401`.
- Si hay token, `jwt.verify` comprueba que la firma sea válida y que no haya expirado.
- Los datos del usuario quedan disponibles en `req.user` para los controladores.

---

### 3. Rutas protegidas — `app.js`

```js
app.use("/auth", authRoutes); // pública, no requiere token
app.use("/users", authMiddleware, usersRouter); // protegida
app.use("/commerce", authMiddleware, commerceRoutes); // protegida
```

Solo `/auth/login` es pública. Todo lo demás pasa primero por `authMiddleware`.

---

### 4. Uso del usuario en los controladores — `controllers/user.controller.js`

```js
const getUserDashboard = async (req, res) => {
    // El middleware ya dejó los datos del usuario en req.user
    const { id_cliente } = req.user;

    // Se usa ese id para consultar solo los datos de ese usuario
    const [[cuenta]] = await db.execute(
        "SELECT saldo FROM CUENTA WHERE id_cliente = ?",
        [id_cliente]
    );
    ...
};
```

El controlador **no recibe el id del cliente desde el cliente**. Lo extrae del token verificado, así es imposible pedir datos de otro usuario.

---

## Resumen rápido

| Paso          | Archivo              | Qué hace                                             |
| ------------- | -------------------- | ---------------------------------------------------- |
| Login         | `auth.controller.js` | Valida credenciales, crea y devuelve el JWT          |
| Protección    | `auth.middleware.js` | Verifica el token en cada petición protegida         |
| Rutas         | `app.js`             | Define cuáles rutas son públicas y cuáles protegidas |
| Controladores | `user.controller.js` | Usa `req.user` para saber quién hace la petición     |

---

## ¿Cómo usar el token en una petición?

Después de hacer login, guarda el token y envíalo en el header de cada petición:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

Si el token es inválido o expiró, el servidor responderá con:

```json
{ "status": "error", "message": "Token inválido o expirado." }
```
