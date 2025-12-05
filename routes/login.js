// routes/login.js
import express from "express";
import { login } from "../controllers/loginControlers.js";

const router = express.Router();

// Ruta POST /api/login
router.post("/", login);

export default router;
