import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { 
    getGameContent, 
    getProgressoUsuario, 
    updateProgressoUsuario 
} from '../controllers/gameController.js';

const router = express.Router();

// Rotas para o jogo (usuário logado)
router.get('/content', protect, getGameContent);
router.get('/progress', protect, getProgressoUsuario);
router.put('/progress', protect, updateProgressoUsuario);

// Rotas para o admin (a serem criadas no futuro)
// router.get('/admin/quiz', protect, admin, ...);

export default router;