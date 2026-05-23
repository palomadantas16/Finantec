import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { 
    salvarCalculo, 
    getHistorico, 
    deletarHistoricoItem 
} from '../controllers/calculadoraController.js';

const router = express.Router();

// Rota para buscar o histórico (GET) e salvar um novo cálculo (POST)
router.route('/historico')
    .get(protect, getHistorico)
    .post(protect, salvarCalculo);

// Rota para deletar um item específico do histórico
router.delete('/historico/:id', protect, deletarHistoricoItem);

export default router;