import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getEventosDoMes } from '../controllers/eventoController.js';

const router = express.Router();

router.get('/calendario', protect, getEventosDoMes);

export default router;