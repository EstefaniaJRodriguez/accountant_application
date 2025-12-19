import pool from "../db.js";
import { MercadoPagoConfig, Preference } from "mercadopago";

// Cliente Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

console.log("MP_ACCESS_TOKEN existe?:", !!process.env.MP_ACCESS_TOKEN);

export const createPreference = async (req, res) => {
  try {
    const formData = req.body;

    // 1️⃣ Insertar trámite
    const query = `
      INSERT INTO tramites (
        nombre, mail, cuit, clave_fiscal, tipo_tramite, estado_actual_id, datos, estado_pago
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,'N')
      RETURNING id
    `;

    const values = [
      formData.nombre,
      formData.mail,
      formData.cuit,
      formData.claveFiscal,
      1,
      3,
      JSON.stringify(formData),
    ];

    const result = await pool.query(query, values);
    const tramiteId = result.rows[0]?.id;

    console.log("Tramite ID:", tramiteId);

    if (!tramiteId) {
      return res.status(500).json({ error: "No se pudo obtener el ID del trámite" });
    }

    // 2️⃣ URLs
    const successUrl = `https://www.genimpositivo.com/pago-exitoso/${tramiteId}`;
    const failureUrl = `https://www.genimpositivo.com/pago-fallido/${tramiteId}`;
    const pendingUrl = `https://www.genimpositivo.com/pago-pendiente/${tramiteId}`;

    // 3️⃣ Total
    const total =
      Number(formData.precioGestionExtra) + Number(formData.precioTramite);

    if (isNaN(total)) {
      return res.status(400).json({ error: "Monto inválido" });
    }

    // 4️⃣ Preferencia
    const preference = {
      items: [
        {
          title: "Alta de Monotributo",
          quantity: 1,
          currency_id: "ARS",
          unit_price: total,
        },
      ],
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl,
      },
      auto_return: "approved",
    };

    console.log("Preference final:", preference);

    // 5️⃣ Crear preferencia
    const preferenceInstance = new Preference(client);
    const mpResponse = await preferenceInstance.create({ body: preference });

    console.log("Respuesta MP:", mpResponse);

    // ✅ ACÁ ESTABA EL ERROR
    res.json({ preferenceId: mpResponse.id });

  } catch (error) {
    console.error("Error en createPreference:", error);
    res.status(500).json({ error: error.message });
  }
};
