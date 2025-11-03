import express from "express";
import pool from "../db.js";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const router = express.Router();

router.post("/", async (req, res) => {
  const { tramite_id, pago_id_mp } = req.body;

  if (!tramite_id || !pago_id_mp) {
    return res.status(400).json({ message: "Faltan datos requeridos" });
  }

  try {
    // 1️⃣ Revisar si el pago ya existe
    const pagoExistente = await pool.query(
      "SELECT * FROM pagos WHERE pago_id_mp = $1",
      [pago_id_mp]
    );

    if (pagoExistente.rowCount > 0) {
      return res
        .status(200)
        .json({ message: "Pago ya registrado", pago: pagoExistente.rows[0] });
    }

    // 2️⃣ Consultar la API de Mercado Pago
    const mpResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${pago_id_mp}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
      }
    );

    const data = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("Error al consultar Mercado Pago:", data);
      return res
        .status(400)
        .json({ message: "Error al obtener datos de Mercado Pago" });
    }

    // 3️⃣ Extraer información relevante
    const monto = data.transaction_amount || 0;
    const estado_pago = data.status || "desconocido";
    const metodo_pago = data.payment_type_id || "no especificado";

    // 4️⃣ Insertar el pago en la base de datos
    const result = await pool.query(
      `INSERT INTO pagos (tramite_id, pago_id_mp, monto, estado_pago, metodo_pago, detalles)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [tramite_id, pago_id_mp, monto, estado_pago, metodo_pago, data]
    );

    console.log("✅ Pago registrado correctamente:", result.rows[0]);

    // 5️⃣ Determinar el estado del trámite según el pago
    let nuevoEstadoPago = "N"; // valor por defecto
    if (estado_pago === "approved") {
      nuevoEstadoPago = "Y";
    }

    // 6️⃣ Actualizar el estado del trámite
    await pool.query(
      `UPDATE tramites
       SET estado_pago = $1
       WHERE id = $2`,
      [nuevoEstadoPago, tramite_id]
    );

    console.log(
      `🟢 Trámite ${tramite_id} actualizado: estado_pago = '${nuevoEstadoPago}'`
    );

    // 7️⃣ Responder al cliente
    return res.status(201).json({
      message: `Pago guardado correctamente y trámite actualizado (${nuevoEstadoPago})`,
      pago: result.rows[0],
    });
  } catch (error) {
    console.error("Error al registrar el pago:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

export default router;
