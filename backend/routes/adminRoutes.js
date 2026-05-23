import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
    getQuizAdmin,
    addPerguntaQuiz,
    updatePerguntaQuiz,
    deletePerguntaQuiz,
    getForcaAdmin,
    addPalavraForca,
    updatePalavraForca,
    deletePalavraForca
} from '../controllers/adminController.js';

const router = express.Router();

// Todas as rotas aqui são protegidas e só podem ser acessadas por administradores
router.use(protect, admin);

// Rotas para Gerenciamento do Quiz
router.route('/quiz')
    .get(getQuizAdmin)
    .post(addPerguntaQuiz);

router.route('/quiz/:id')
    .put(updatePerguntaQuiz)
    .delete(deletePerguntaQuiz);

// Rotas para Gerenciamento da Forca
router.route('/forca')
    .get(getForcaAdmin)
    .post(addPalavraForca);

router.route('/forca/:id')
    .put(updatePalavraForca)
    .delete(deletePalavraForca);

export default router;