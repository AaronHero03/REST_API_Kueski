import db from "../config/database.js";

const trackIntent = async (req, res) => {
	try {
		const id_cliente = req.user_id_cliente;
		const { monto, id_partner, url } = req.body;

		if (!monto || !id_partner || !url) {
			return res.status(400).json({
				status: "error",
				message: "Los campos monto, id_partner y url son requeridos.",
			});
		}

		const [partners] = await db.execute(
			"SELECT cashback_rate FROM tiendas_partner WHERE id_partner = ?",
			[id_partner],
		);

		if (partners.lenght == 0) {
			return res.status(404).json({
				status: "error",
				message: "La tienda partner no fue encontrada",
			});
		}

		const cashback_rate = partners[0].cashback_rate;
		const cantidad_CB = parseFloat(monto * (cashback_rate / 100)).toFixed(2);

		const [txResult] = await db.execute(
			"INSERT INTO transaccion (id_cliente, id_partner, monto, fecha, estado) VALUES (?, ?, ?, NOW(), 'pendiente')",
			[id_cliente, id_partner, monto],
		);
		const id_transaccion = txResult.insertId;

		// 6. Insertar la solicitud de cashback vinculada
		await db.execute(
			"INSERT INTO solicitud_cb (id_transaccion, url, cantidad_CB, estado, created_at) VALUES (?, ?, ?, 'pendiente', NOW())",
			[id_transaccion, url, cantidad_CB],
		);

		return res.status(201).json({
			status: "success",
			data: {
				id_transaccion,
				cashback_a_ganar: cantidad_CB,
			},
		});
	} catch (error) {
		console.error("Error en trackIntent: ", error);
		return res.status(500).json({
			status: "error",
			message: "error interno del servidor",
		});
	}
};

const confirmTransaction = async (req, res) => {
	const id_cliente = req.user_id_cliente;
	const id_transaccion = req.params.id;

	let connection;

	try {
		const [txRows] = await db.execute(
			"SELECT estado FROM transaccion WHERE id_transaccion = ? AND id_cliente = ?",
			[id_transaccion, id_cliente],
		);

		if (txRows.length === 0) {
			return res.status(404).json({
				status: "error",
				message: "Transacción no encontrada.",
			});
		}

		const transaccion = txRows[0];

		if (transaccion.estado !== "pendiente") {
			return res.status(409).json({
				status: "error",
				message: "La transacción ya fue procesada.",
			});
		}

		const [soliRows] = await db.execute(
			"SELECT id_SoliCB, cantidad_CB FROM solicitud_cb WHERE id_transaccion = ?",
			[id_transaccion],
		);

		if (soliRows.length === 0) {
			return res.status(404).json({
				status: "error",
				message: "Solicitud de cashback asociada no encontrada.",
			});
		}

		const { id_SoliCB, cantidad_CB } = soliRows[0];

		// Esto se realiza mediante una conexion SQL atomica, es decir, si en algun momento del proceso se cancela, los cambios se revierten para evitar dejar el proceso a medias
		// Actualizacion de la transaccion en la DB

		connection = await db.getConnection();

		await connection.beginTransaction();

		await connection.execute(
			"UPDATE transaccion SET estado = 'aprobado' WHERE id_transaccion = ?",
			[id_transaccion],
		);

		await connection.execute(
			"UPDATE solicitud_cb SET estado = 'aprobado' WHERE id_SoliCB = ?",
			[id_SoliCB],
		);

		await connection.execute(
			"INSERT INTO aprobacion_cb (id_SoliCB, id_transaccion, cantidad, fecha_aprobacion) VALUES (?, ?, ?, NOW())",
			[id_SoliCB, id_transaccion, cantidad_CB],
		);

		await connection.execute(
			`INSERT INTO cashback (id_cliente, monto_pendiente, monto_aprobado, updated_at) 
       VALUES (?, 0, ?, NOW()) 
       ON DUPLICATE KEY UPDATE 
          monto_aprobado = monto_aprobado + VALUES(monto_aprobado), 
          updated_at = NOW()`,
			[id_cliente, cantidad_CB],
		);

		await connection.commit();

		const [balanceRows] = await db.execute(
			"SELECT monto_aprobado FROM cashback WHERE id_cliente = ?",
			[id_cliente],
		);

		const nuevo_saldo_cashback = balanceRows[0]?.monto_aprobado || 0.0;

		return res.status(200).json({
			status: "success",
			data: {
				cashback_ganado: parseFloat(cantidad_CB),
				nuevo_saldo_cashback: parseFloat(nuevo_saldo_cashback),
			},
		});
	} catch (error) {
		if (connection) {
			await connection.rollback();
		}
		console.error(
			"Error en confirmPayment (Transacción SQL revertida):",
			error,
		);
		return res.status(500).json({
			status: "error",
			message: "Error interno del servidor al procesar el pago.",
		});
	} finally {
		if (connection) {
			connection.release();
		}
	}
};

export { trackIntent, confirmTransaction };
