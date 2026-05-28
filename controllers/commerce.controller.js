import db from "../config/database.js";

const checkBenefits = async (req, res) => {
	try {
		const domain = req.query.domain;

		if (!domain) {
			return res.status(400).json({
				status: "error",
				message: "El parámetro domain es obligatorio.",
			});
		}

		const [rows] = await db.execute(
			"SELECT id_partner, cashback_rate FROM tiendas_partner WHERE dominio = ?",
			[domain.toLowerCase()]
		);

		if (!rows.length) {
			return res.status(200).json({ status: "success", data: { is_partner: false } });
		}

		res.status(200).json({
			status: "success",
			data: {
				is_partner: true,
				id_partner: rows[0].id_partner,
				cashback_percentage: rows[0].cashback_rate,
			},
		});
	} catch (error) {
		console.error("Error en checkBenefits:", error);
		res.status(500).json({ status: "error", message: "Error interno del servidor" });
	}
};

const simulateTransaction = async (req, res) => {
	try {
		const { monto, id_partner } = req.body;
		const { id_cliente } = req.user;

		if (!monto || !id_partner) {
			return res.status(400).json({
				status: "error",
				message: "Los parámetros monto e id_partner son obligatorios.",
			});
		}

		const [[cuentaRows], [cashbackRows], [partnerRows]] = await Promise.all([
			db.execute(
				"SELECT saldo FROM cuenta WHERE id_cliente = ? AND estado = 'ACTIVA'",
				[id_cliente]
			),
			db.execute(
				"SELECT monto_aprobado FROM cashback WHERE id_cliente = ?",
				[id_cliente]
			),
			db.execute(
				"SELECT cashback_rate FROM tiendas_partner WHERE id_partner = ?",
				[id_partner]
			),
		]);

		if (!cuentaRows[0]) {
			return res.status(404).json({ status: "error", message: "No se encontró la cuenta del usuario." });
		}

		const user_balance = Number(cuentaRows[0].saldo);
		const user_cashback = Number(cashbackRows[0]?.monto_aprobado ?? 0);
		const cashback_rate = partnerRows[0] ? Number(partnerRows[0].cashback_rate) / 100 : 0;
		const cashback_to_earn = parseFloat((monto * cashback_rate).toFixed(2));

		const plazos = [3, 6, 12];
		const tasa_mensual = 0.08 / 12;
		const payment_plans = plazos.map((cuotas) => {
			const cuota = parseFloat(
				((monto * tasa_mensual * Math.pow(1 + tasa_mensual, cuotas)) /
					(Math.pow(1 + tasa_mensual, cuotas) - 1)).toFixed(2)
			);
			return { cuotas, monto_cuota: cuota, total: parseFloat((cuota * cuotas).toFixed(2)) };
		});

		res.status(200).json({
			status: "success",
			data: {
				is_approved: monto <= user_balance + user_cashback,
				payment_plans,
				cashback_to_earn,
				balance_disponible: user_balance,
				cashback_disponible: user_cashback,
			},
		});
	} catch (error) {
		console.error("Error en simulateTransaction:", error);
		res.status(500).json({ status: "error", message: "Error interno del servidor" });
	}
};

export { checkBenefits, simulateTransaction };
