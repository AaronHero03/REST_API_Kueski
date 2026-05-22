import db from "../config/database.js";

const getUserDashboard = async (req, res) => {
	try {
		const { id_cliente } = req.user;

		const [[cuenta], [cashback]] = await Promise.all([
			db.execute(
				"SELECT saldo FROM cuenta WHERE id_cliente = ? AND estado = 'ACTIVA'",
				[id_cliente]
			),
			db.execute(
				"SELECT monto_aprobado FROM cashback WHERE id_cliente = ?",
				[id_cliente]
			),
		]);

		if (!cuenta[0]) {
			return res.status(404).json({ status: "error", message: "No se encontró el perfil del usuario." });
		}

		res.status(200).json({
			status: "success",
			data: {
				balance: { available: cuenta[0].saldo, currency: "MXN" },
				cashback: { available: cashback[0]?.monto_aprobado ?? 0 },
			},
		});
	} catch (error) {
		console.error("Error en getUserDashboard:", error);
		res.status(500).json({ status: "error", message: "Error interno del servidor" });
	}
};

const getUserLoans = async (req, res) => {
	try {
		const { id_cliente } = req.user;

		const [loans] = await db.execute(
			`SELECT
				p.id_prestamo,
				sp.cantidad,
				p.tasa,
				p.cuotas,
				p.created_at AS fecha_aprobacion,
				sp.fecha_fin
			FROM prestamo p
			JOIN solicitud_prestamo sp ON p.id_solicitud = sp.id_soliPres
			WHERE sp.id_cliente = ? AND p.estado = 'ACTIVO'
			ORDER BY sp.fecha_fin ASC`,
			[id_cliente]
		);

		if (!loans.length) {
			return res.status(404).json({ status: "error", message: "No se encontraron créditos para este usuario." });
		}

		const summary = {
			total_active: loans.length,
			total_pending: loans.reduce((sum, l) => sum + Number(l.cantidad), 0),
			next_due_date: loans[0].fecha_fin,
		};

		res.status(200).json({
			status: "success",
			data: { summary, active_loans: loans },
		});
	} catch (error) {
		console.error("Error en getUserLoans:", error);
		res.status(500).json({ status: "error", message: "Error interno del servidor" });
	}
};

export { getUserDashboard, getUserLoans };
