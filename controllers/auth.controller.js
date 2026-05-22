import jwt from "jsonwebtoken";
import "dotenv/config";
import db from "../config/database.js";

const login = async (req, res) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({
				status: "error",
				message: "El correo o la contraseña son requeridos.",
			});
		}

		const [rows] = await db.execute(
			"SELECT id_cliente, nombre, email, password FROM cliente WHERE email = ?",
			[email.trim().toLowerCase()]
		);

		const cliente = rows[0];

		if (!cliente || cliente.password !== password) {
			return res.status(401).json({
				status: "error",
				message: "Credenciales incorrectas. Verifica tu correo y contraseña.",
			});
		}

		const token = jwt.sign(
			{ id_cliente: cliente.id_cliente, email: cliente.email },
			process.env.JWT_SECRET,
			{ expiresIn: "2h" }
		);

		res.status(200).json({
			status: "success",
			data: {
				token,
				user: {
					id_cliente: cliente.id_cliente,
					nombre: cliente.nombre,
					email: cliente.email,
				},
			},
		});
	} catch (error) {
		console.error("Error en login:", error);
		res.status(500).json({ status: "error", message: "Error interno del servidor" });
	}
};

export { login };
