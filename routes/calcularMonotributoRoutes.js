import express from "express";
import pool from "../db.js";

const router = express.Router();

// 🔹 Variable donde guardaremos el valor
let aportesSipaCategoriaA = null;

// 🔹 Función segura para obtener aportes_sipa categoría A
async function obtenerAportesSipaCategoriaA() {
  try {
    // Si ya está cargado y es un número válido → lo usamos
    if (aportesSipaCategoriaA !== null && !isNaN(aportesSipaCategoriaA)) {
      return aportesSipaCategoriaA;
    }

    // Si no, lo consultamos
    const result = await pool.query(
      "SELECT aportes_sipa FROM categorias_monotributo WHERE categoria = 'A'"
    );

    if (result.rows.length > 0) {
      const valor = Number(result.rows[0].aportes_sipa);

      if (!isNaN(valor)) {
        aportesSipaCategoriaA = valor;
        return valor;
      }
    }

    console.error("Error: aportes_sipa de categoría A no es un número válido");
    return 0; // fallback seguro

  } catch (err) {
    console.error("Error al obtener aportes_sipa categoría A:", err);
    return 0; // fallback
  }
}

// -----------------------------------------------
// RUTAS
// -----------------------------------------------

// Obtener categorías
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

// Validar categoría
router.post("/validar", async (req, res) => {
  try {
    const { categoria, ingresos, tipo, condicion } = req.body;

    if (!categoria || !ingresos || !tipo || !condicion) {
      return res.status(400).json({ error: "Faltan datos requeridos." });
    }

    const result = await pool.query(
      "SELECT * FROM categorias_monotributo WHERE categoria = $1",
      [categoria]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Categoría no encontrada." });
    }

    const categoriaDB = result.rows[0];

    if (Number(ingresos) > Number(categoriaDB.ingresos_brutos)) {
      return res.json({
        ok: false,
        mensaje: `El monto ingresado ($${ingresos}) supera el tope de la categoría ${categoria} ($${categoriaDB.ingresos_brutos}). Deberías seleccionar una categoría mayor.`,
      });
    }

    let monto = 0;

    // -------------------------------------------
    //  CASO 1: Relación de dependencia
    // -------------------------------------------
    if (condicion === "dependencia") {
      monto =
        tipo === "servicio"
          ? categoriaDB.imp_integrado_servicios
          : categoriaDB.imp_integrado_venta;

      return res.json({
        ok: true,
        tipo,
        condicion,
        monto,
        mensaje: `El aporte correspondiente para relación de dependencia es $${monto}.`,
      });
    }

    // -------------------------------------------
    //  CASO 2: Jubilado
    // -------------------------------------------
    if (condicion === "jubilado") {
      const aportesA = await obtenerAportesSipaCategoriaA();

      if (tipo === "servicio") {
        monto =
          Number(categoriaDB.imp_integrado_servicios) +
          Number(aportesA);
      } else {
        monto =
          Number(categoriaDB.imp_integrado_venta) +
          Number(aportesA);
      }

      return res.json({
        ok: true,
        tipo,
        condicion,
        monto,
        mensaje: `El monto estimado para la condición de jubilado es $${monto}.`,
      });
    }

    // -------------------------------------------
    //  CASO 3: Autónomo
    // -------------------------------------------
    if (condicion === "autonomo") {
      monto =
        tipo === "servicio"
          ? categoriaDB.total_servicios
          : categoriaDB.total_venta;

      return res.json({
        ok: true,
        tipo,
        condicion,
        monto,
        mensaje: `El monto mensual estimado del monotributo es $${monto}.`,
      });
    }

    return res.status(400).json({ error: "Condición no válida." });

  } catch (error) {
    console.error("Error en /api/monotributo/validar:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

export default router;
