import express from "express";
import pool from "../db.js"; // 

const router = express.Router();

let aportesSipaCategoriaA = null;

const result = await pool.query(
  "SELECT aportes_sipa FROM categorias_monotributo WHERE categoria = 'A'"
);
 aportesSipaCategoriaA + result;

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


 router.post("/validar", async (req, res) => {
  try {
    const { categoria, ingresos, tipo, condicion } = req.body;
    // condicion = "dependencia" | "jubilado" | "autonomo"

    if (!categoria || !ingresos || !tipo || !condicion) {
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

    // Validar ingresos dentro del tope
    if (Number(ingresos) > Number(categoriaDB.ingresos_brutos)) {
      return res.json({
        ok: false,
        mensaje: `El monto ingresado ($${ingresos}) supera el tope de la categoría ${categoria} ($${categoriaDB.ingresos_brutos}). Deberías seleccionar una categoría mayor.`,
      });
    }

    let monto = 0;

    // ---------------------------
    //     CASO 1: RELACIÓN DE DEPENDENCIA
    // ---------------------------

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

    // ---------------------------
    //     CASO 2: JUBILADO
    // ---------------------------
    if (condicion === "jubilado") {
      if (tipo === "servicio") {
        monto =
          Number(categoriaDB.imp_integrado_servicios) 
          +
          Number(aportesSipaCategoriaA);
      } else {
        monto =
          Number(categoriaDB.imp_integrado_venta) +
          Number(aportesSipaCategoriaA);
      }

      return res.json({
        ok: true,
        tipo,
        condicion,
        monto,
        aportesSipaCategoriaA,
        mensaje: `El monto estimado para la condición de jubilado es $${monto}.`,
      });
    }

    // ---------------------------
    //     CASO 3: AUTÓNOMO (NORMAL)
    // ---------------------------
    if (condicion === "autonomo") {
      console.log(tipo)
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
