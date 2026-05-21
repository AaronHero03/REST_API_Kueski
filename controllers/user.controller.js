// src/controllers/users.controller.js

const USERS_DB = {
	user_0001: {
		balance: 12500.5,
		cashback_accumulated: 450.25,
		currency: "MXN",
	},
};

const LOANS_DB = {
	user_0001: {
		summary: {
			total_active: 2,
			total_pending: 3250.0,
			next_due_date: "2026-06-01",
		},
		active_loans: [
			{
				id_prestamo: "loan_001",
				cantidad: 5000.0,
				tasa: 0.08,
				cuotas: 6,
				cuotas_pagadas: 2,
				fecha_aprobacion: "2026-01-15",
				fecha_fin: "2026-07-15",
				monto_cuota: 883.33,
				proximo_pago: "2026-06-01",
			},
			{
				id_prestamo: "loan_002",
				cantidad: 2500.0,
				tasa: 0.06,
				cuotas: 3,
				cuotas_pagadas: 1,
				fecha_aprobacion: "2026-03-10",
				fecha_fin: "2026-06-10",
				monto_cuota: 883.33,
				proximo_pago: "2026-06-10",
			},
		],
	},
};

const getUserDashboard = (req, res) => {
	const { id_cliente } = req.user;
	const usuario = USERS_DB[id_cliente];

	if (!usuario) {
		return res
			.status(404)
			.json({
				status: "error",
				message: "No se encontró el perfil del usuario.",
			});
	}

	res.status(200).json({
		status: "success",
		data: {
			balance: { available: usuario.balance, currency: usuario.currency },
			cashback: { available: usuario.cashback_accumulated },
		},
	});
};

const getUserLoans = (req, res) => {
	const { id_cliente } = req.user;
	const data = LOANS_DB[id_cliente];

	if (!data) {
		return res
			.status(404)
			.json({
				status: "error",
				message: "No se encontraron créditos para este usuario.",
			});
	}

	res.status(200).json({
		status: "success",
		data: {
			summary: data.summary,
			active_loans: data.active_loans,
		},
	});
};

export { getUserDashboard, getUserLoans };
