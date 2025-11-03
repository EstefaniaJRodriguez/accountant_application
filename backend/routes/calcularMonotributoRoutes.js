import express from "express";
import pool from "../db.js"; // 

const router = express.Router();

// ✅ Obtener todas las categorías desde la base de datos
router.get("/categorias", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT categoria, ingresos_brutos FROM categorias_monotributo ORDER BY categoria ASC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    res.status(500).json({ error: "Error al obtener categorías" });
  }
});

/**
 * Endpoint: POST /api/monotributo/validar
 * Recibe: { categoria, ingresos, tipo }
 * Devuelve: mensaje + monto a pagar o sugerencia de categoría mayor
 */
router.post("/validar", async (req, res) => {
  try {
    const { categoria, ingresos, tipo } = req.body;

    if (!categoria || !ingresos || !tipo) {
      return res.status(400).json({ error: "Faltan datos requeridos." });
    }

    // Buscar la categoría en la base de datos
    const result = await pool.query(
      "SELECT * FROM categorias_monotributo WHERE categoria = $1",
      [categoria]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Categoría no encontrada." });
    }

    const categoriaDB = result.rows[0];

    // Validar el ingreso con el tope de la categoría
    if (Number(ingresos) <= Number(categoriaDB.ingresos_brutos)) {
      const monto =
        tipo === "servicios"
          ? categoriaDB.total_servicios
          : categoriaDB.total_venta;

      return res.json({
        ok: true,
        monto,
        tipo,
        mensaje: `El monto mensual estimado del monotributo es $${monto}.`,
      });
    } else {
      return res.json({
        ok: false,
        mensaje: `El monto ingresado ($${ingresos}) supera el tope de la categoría ${categoria} ($${categoriaDB.ingresos_brutos}). 
        Deberías seleccionar en una categoría mayor.`,
      });
    }
  } catch (error) {
    console.error("Error en /api/monotributo/validar:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

export default router;
