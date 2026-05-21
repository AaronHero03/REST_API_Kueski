// src/controllers/commerce.controller.js

// Traemos nuestra base de datos simulada (solo para este módulo)
const STORES_DB = {
	"amazon.com.mx": {
		id: "store_001",
		name: "Amazon México",
		cashback: 2,
		affiliated: true,
	},
	"mercadolibre.com.mx": {
		id: "stores_002",
		name: "Mercado Libre",
		affiliated: false,
	},
	"expedia.mx": {
		id: "stores_003",
		name: "Expedia",
		cashback: 1,
		affiliated: true,
	},
};

// Exportamos la función que hace el trabajo
const checkBenefits = (req, res) => {
	try {
		const domain = req.query.domain;

		if (!domain) {
			return res.status(400).json({
				status: "error",
				message: "El parámetro domain es obligatorio.",
			});
		}

		const store = STORES_DB[domain.toLowerCase()];

		if (store && store.affiliated) {
			return res.status(200).json({
				status: "success",
				data: { is_partner: true, cashback_percentage: store.cashback },
			});
		}

		return res.status(200).json({
			status: "success",
			data: { is_partner: false },
		});
	} catch (error) {
		// Aquí empezamos a meter manejo de errores (Try/Catch)
		console.error("Error en checkBenefits:", error);
		res
			.status(500)
			.json({ status: "error", message: "Error interno del servidor" });
	}
};

const simulateTransaction = (req, res) => {
	try {
		const { monto, id_partner } = req.body;

		if (!monto || !id_partner) {
			return res.status(400).json({
				status: "error",
				message: "Los parámetros monto e id_partner son obligatorios.",
			});
		}

		const user_balance = 12500.5;
		const user_cashback = 450.25;

		const store = Object.values(STORES_DB).find((s) => s.id === id_partner);
		const cashback_rate = store && store.affiliated ? (store.cashback || 0) / 100 : 0;
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

		const is_approved = monto <= user_balance + user_cashback;

		res.status(200).json({
			status: "success",
			data: {
				is_approved,
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
