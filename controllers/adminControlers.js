// controllers/solicitudesController.js
import pool from "../db.js";
 
// Obtener todas las solicitudes
// export const getSolicitudes = async (req, res) => {
//   try {
//     const baseQuery = `
//       SELECT 
//         t.id,
//         t.nombre,
//         t.mail,
//         t.cuit,
//         t.datos,
//         t.fecha,
//         t.observaciones,
//         e.nombre AS estado_nombre,
//         tp.tramite AS tipo_tramite_nombre
//       FROM tramites t
//       LEFT JOIN estados e ON t.estado_actual_id = e.id
//       LEFT JOIN tipos_tramite tp ON t.tipo_tramite = tp.id
//       ORDER BY t.id DESC
//     `;

//     const result = await pool.query(baseQuery);

//     // 🔹 Parsear el campo 'datos' (siempre viene como string JSON)
//     const solicitudes = result.rows.map((row) => {
//       let datosExtra = {};
//       try {
//         if (row.datos) {
//           datosExtra = JSON.parse(row.datos);
//         }
//       } catch (error) {
//         console.error(`Error parseando JSON en solicitud ${row.id}:`, error);
//       }

//       // 🔹 Combinar los datos base con los del JSON
//       return {
//         ...row,
//         ...datosExtra, // 🔸 esto "extiende" los campos dentro de 'datos'
//       };
//     });

//     console.log("Solicitudes parseadas:", solicitudes);

//     res.json(solicitudes);
//   } catch (error) {
//     console.error("Error obteniendo solicitudes:", error.message);
//     console.error("Stack:", error.stack);
//     res.status(500).json({ error: error.message });
//   }
// };

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
          datosExtra = JSON.parse(row.datos);
        }
      } catch (error) {
        console.error(`Error parseando JSON en solicitud ${row.id}:`, error);
      }
      return { ...row, ...datosExtra };
    });

    res.json(solicitudes);
  } catch (error) {
    console.error("Error obteniendo solicitudes:", error.message);
    res.status(500).json({ error: error.message });
  }
};






// Actualizar estado de una solicitud
export const updateEstado = async (req, res) => {
  const { id } = req.params;
  const { estado, observaciones } = req.body; // acá viene el id del estado

  try {
    await pool.query("UPDATE tramites SET estado_actual_id = $1, observaciones = $2 WHERE id = $3", [
      estado,
      observaciones,
      id,
    ]);
    res.json({ success: true });
  } catch (error) {
    console.error("Error actualizando estado/observaciones:", error);
    res.status(500).json({ error: "Error al actualizar estado" });
  }
};

export const getEstados = async (req, res) => {
  try {
    const result = await pool.query("SELECT id, nombre FROM estados ORDER BY id");
    res.json(result.rows);
  } catch (error) {
    console.error("Error obteniendo estados:", error);
    res.status(500).json({ error: "Error al obtener estados" });
  }
};

export const getTiposTramite = async (req, res) => {
  try {
    const result = await pool.query("SELECT id, tramite FROM tipos_tramite ORDER BY id ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error obteniendo tipos de trámite", error);
    res.status(500).json({ error: "Error al obtener tipos de trámite" });
  }
};

