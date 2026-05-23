import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getMetas, criarMeta, depositarNaMeta, retirarDaMeta, excluirMeta, editarMeta } from '../controllers/metaController.js';

const router = express.Router();

// Rota para buscar todas as metas e para criar uma nova
router.route('/')
    .get(protect, getMetas)
    .post(protect, criarMeta);

// Rotas para depositar e retirar dinheiro de uma meta específica
router.post('/:id_meta/depositar', protect, depositarNaMeta);
router.post('/:id_meta/retirar', protect, retirarDaMeta);
// Altere as importações para incluir a nova função

// ... (o início do arquivo continua o mesmo)

// Adicione o método .delete() à rota que já existe
router.route('/:id_meta/depositar').post(protect, depositarNaMeta);
router.route('/:id_meta/retirar').post(protect, retirarDaMeta);
router.route('/:id_meta/excluir').delete(protect, excluirMeta); // <-- ADICIONE ESTA LINHA
router.route('/:id_meta').put(protect, editarMeta);



export default router;