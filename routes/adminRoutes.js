import express from "express";
import { getSolicitudes, updateEstado, getEstados, getTiposTramite } from "../controllers/adminControlers.js";

const router = express.Router();

// ahora solo rutas relativas
router.get("/", getSolicitudes);
router.put("/:id", updateEstado);
router.get("/estados", getEstados);
router.get("/tipos-tramite", getTiposTramite);

export default router;
