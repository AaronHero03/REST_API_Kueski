// src/controllers/auth.controller.js

const CLIENTES_DB = {
	"valeria@kueski.com": {
		id_cliente: "user_0001",
		nombre: "Valeria Mercado",
		password: "kueski123",
		token_session: "mock-jwt-token-abc123",
	},
	"carlos@kueski.com": {
		id_cliente: "user_0002",
		nombre: "Carlos Hernández",
		password: "kueski456",
		token_session: "mock-jwt-token-xyz789",
	},
};

const VALID_TOKENS = new Set([
	"mock-jwt-token-abc123",
	"mock-jwt-token-xyz789",
]);

const login = (req, res) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({
				status: "error",
				message: "El correo o la contraseña son requeridos.",
			});
		}

		const cliente = CLIENTES_DB[email.toLowerCase()];

		if (!cliente || cliente.password !== password) {
			return res.status(401).json({
				status: "error",
				message: "Credenciales incorrectas. Verifica tu correo y contraseña.",
			});
		}

		res.status(200).json({
			status: "success",
			data: {
				token: cliente.token_session,
				user: {
					id_cliente: cliente.id_cliente,
					nombre: cliente.nombre,
					email,
				},
			},
		});
	} catch (error) {
		console.error("Error en login:", error);
		res.status(500).json({ status: "error", message: "Error interno del servidor" });
	}
};

const verifyToken = (req, res) => {
	try {
		const authHeader = req.headers["authorization"];
		const token = authHeader && authHeader.split(" ")[1];

		if (!token || !VALID_TOKENS.has(token)) {
			return res.status(401).json({
				status: "error",
				message: "La sesión ha expirado.",
			});
		}

		res.status(200).json({ status: "success", is_valid: true });
	} catch (error) {
		console.error("Error en verifyToken:", error);
		res.status(500).json({ status: "error", message: "Error interno del servidor" });
	}
};

export { login, verifyToken };
