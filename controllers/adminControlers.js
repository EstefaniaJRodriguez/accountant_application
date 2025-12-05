// controllers/solicitudesController.js
import pool from "../db.js";

export const getSolicitudes = async (req, res) => {
  try {
    const { estado, tipo_tramite, cuit, email } = req.query;

    let baseQuery = `
      SELECT 
        t.id,
        t.nombre,
        t.mail,
        t.cuit,
        t.datos,
        t.fecha,
        t.observaciones,
        e.nombre AS estado_nombre,
        tp.tramite AS tipo_tramite_nombre
      FROM tramites t
      LEFT JOIN estados e ON t.estado_actual_id = e.id
      LEFT JOIN tipos_tramite tp ON t.tipo_tramite = tp.id
      WHERE t.estado_pago = 'Y'
    `;

    const conditions = [];
    const values = [];

    if (estado) {
      values.push(estado);
      conditions.push(`t.estado_actual_id = $${values.length}`);
    }
    if (tipo_tramite) {
      values.push(tipo_tramite);
      conditions.push(`t.tipo_tramite = $${values.length}`);
    }
    if (cuit) {
      values.push(`%${cuit}%`);
      conditions.push(`t.cuit LIKE $${values.length}`);
    }
    if (email) {
      values.push(`%${email}%`);
      conditions.push(`t.mail LIKE $${values.length}`);
    }

    if (conditions.length > 0) {
      baseQuery += " AND " + conditions.join(" AND ");
    }

    baseQuery += " ORDER BY t.id DESC";

    const result = await pool.query(baseQuery, values);

    const solicitudes = result.rows.map((row) => {
      let datosExtra = {};

      try {
        if (row.datos) {
          // 🔹 Si ya es objeto, usarlo tal cual
          if (typeof row.datos === "object") {
            datosExtra = row.datos;
          }
          // 🔹 Si es string, parsear
          else if (typeof row.datos === "string") {
            datosExtra = JSON.parse(row.datos);
          }
        }
      } catch (error) {
        console.error(`❌ Error parseando JSON en solicitud ${row.id}:`, error);
      }

      // 🔹 Combinar datos base + datos extra
      return { ...row, ...datosExtra };
    });

    res.json(solicitudes);
  } catch (error) {
    console.error("Error obteniendo solicitudes:", error.message);
    res.status(500).json({ error: error.message });
  }
};
