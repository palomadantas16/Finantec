import express from 'express';
import { registrar, login, getPerfil, esqueciSenha, redefinirSenha } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registrar);
router.post('/login', login);
router.get('/me', protect, getPerfil);

router.post('/forgot-password', esqueciSenha);
router.post('/reset-password', redefinirSenha);

export default router;
