import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
	const authHeader = req.headers["authorization"];
	const token = authHeader && authHeader.split(" ")[1];

	if (!token) {
		return res.status(401).json({ status: "error", message: "Token requerido." });
	}

	try {
		const payload = jwt.verify(token, process.env.JWT_SECRET);
		req.user = payload;
		next();
	} catch {
		return res.status(401).json({ status: "error", message: "Token inválido o expirado." });
	}
};
