import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  listarConteudos,
  obterConteudoPublico,
  salvarConteudo,
} from '../controllers/conteudoController.js';

const router = express.Router();

// Rota pública para buscar conteúdo de uma página específica
router.get('/public/:pagina', obterConteudoPublico);

// Rotas de Admin
router.get('/', protect, admin, listarConteudos); // Lista tudo para o painel
router.post('/', protect, admin, salvarConteudo); // Salva (cria ou atualiza)

export default router;