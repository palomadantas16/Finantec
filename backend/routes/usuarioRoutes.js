import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import { 
    getUsuarios, 
    mudarTipo, 
    getFinanceiroDashboard, 
    updatePerfil,
    getHistoricoSaldo,
    setFinanceiroInicial,
    getRendaFixa,
    deleteAvatar,
    getPerfil 
} from '../controllers/usuarioController.js';

const router = express.Router();

// Rotas de Admin
router.get('/', protect, admin, getUsuarios);
router.put('/:id/tipo', protect, admin, mudarTipo);

// Rotas do Usuário Logado
router.get('/financeiro-dashboard', protect, getFinanceiroDashboard);
router.get('/historico-saldo', protect, getHistoricoSaldo);
router.post('/financeiro', protect, setFinanceiroInicial);
router.get('/renda-fixa', protect, getRendaFixa);
router.get('/perfil', protect, getPerfil); 

// ROTA UNIFICADA E CORRIGIDA PARA ATUALIZAR O PERFIL
// Agora só existe uma rota, e ela SEMPRE usa o middleware de upload.
router.put('/perfil', protect, upload.single('avatar'), updatePerfil);

// ROTA PARA REMOVER O AVATAR (DELETE) <--- ROTA ADICIONADA
router.delete('/avatar', protect, deleteAvatar);

export default router;