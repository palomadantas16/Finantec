// routes/rendaRoutes.js

import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getRendas, addRenda, deleteRenda } from '../controllers/rendaController.js';

const router = express.Router();

router.route('/')
  .get(protect, getRendas)
  .post(protect, addRenda);

router.route('/:id')
  .delete(protect, deleteRenda);

export default router;