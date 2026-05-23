// routes/despesaRoutes.js

import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getDespesas, addDespesa, deleteDespesa, getCategorias } from '../controllers/despesaController.js';

const router = express.Router();

router.route('/')
  .get(protect, getDespesas)
  .post(protect, addDespesa);

router.route('/:id')
  .delete(protect, deleteDespesa);
  
router.get('/categorias', protect, getCategorias);

export default router;