import pool from '../db.js'; // Asegurate que db.js exporte un Pool de pg con export default
import { MercadoPagoConfig, Preference } from "mercadopago";


// ✅ Crear cliente de Mercado Pago con tu access token
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

export const createPreference = async (req, res) => {
  try {
    const formData = req.body;

    // 1️⃣ Insertar el trámite en la base
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
      1,       // tipo_tramite
      3,         // estado_actual_id
      JSON.stringify(formData)
    ];

    const result = await pool.query(query, values);

    // 2️⃣ Revisar que realmente se creó y obtener el ID
    console.log("Resultado INSERT:", result.rows);
    const tramiteId = result.rows[0]?.id;

    console.log("Tramite ID:", tramiteId);

    if (!tramiteId) {
      return res.status(500).json({ error: "No se pudo obtener el ID del trámite" });
    }

    const successUrl = "https://www.genimpositivo.com/pago-exitoso/" + tramiteId;
    const failureUrl = "https://www.genimpositivo.com/pago-fallido/" + tramiteId;
    const pendingUrl = "https://www.genimpositivo.com/pago-pendiente/" + tramiteId;

    const total =
  Number(formData.precioGestionExtra) + Number(formData.precioTramite);

    // 3️⃣ Preparar preferencia de Mercado Pago
    const preference = {
      items: [
        {
          title: "Alta de Monotributo",
          quantity: 1,
          currency_id: "ARS",
          unit_price: total
        }
      ],
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl
      },
      auto_return: "approved"
    };

    console.log("URLs de retorno:", preference.back_urls);

        console.log("Preference final:", preference);

    // 4️⃣ Crear la preferencia con la nueva SDK
    const preferenceInstance = new Preference(client);
    const mpResponse = await preferenceInstance.create({ body: preference });
    
    res.json({ preferenceId: mpResponse.body.id });
  } catch (error) {
    console.error("Error en createPreference:", error);
    res.status(500).json({ error: "Error al crear la preferencia" });
  }
};
