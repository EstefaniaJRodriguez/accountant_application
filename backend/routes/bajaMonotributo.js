import express from 'express';
import { createPreference } from '../controllers/bajaControlers.js';
const router = express.Router();

// POST para crear la preferencia de Mercado Pago
router.post('/create_preference', createPreference);

export default router;
