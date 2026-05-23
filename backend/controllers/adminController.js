import * as gameModel from '../models/gameModel.js';

// --- Funções do Quiz ---

export const getQuizAdmin = async (req, res) => {
    try {
        const data = await gameModel.listarPerguntasQuizAdmin();
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar perguntas do quiz.' });
    }
};

export const addPerguntaQuiz = async (req, res) => {
    const { pergunta, nivel, pontos, opcoes } = req.body;
    try {
        await gameModel.adicionarPerguntaQuiz(pergunta, nivel, pontos, opcoes);
        res.status(201).json({ message: 'Pergunta adicionada com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao adicionar pergunta.' });
    }
};

export const updatePerguntaQuiz = async (req, res) => {
    const { id } = req.params;
    const { pergunta, nivel, pontos, opcoes } = req.body;
    try {
        await gameModel.atualizarPerguntaQuiz(id, pergunta, nivel, pontos, opcoes);
        res.json({ message: 'Pergunta atualizada com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar pergunta.' });
    }
};

export const deletePerguntaQuiz = async (req, res) => {
    const { id } = req.params;
    try {
        await gameModel.excluirPerguntaQuiz(id);
        res.json({ message: 'Pergunta excluída com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao excluir pergunta.' });
    }
};

// --- Funções da Forca ---

export const getForcaAdmin = async (req, res) => {
    try {
        const data = await gameModel.listarPalavrasForcaAdmin();
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar palavras da forca.' });
    }
};

export const addPalavraForca = async (req, res) => {
    const { palavra, dica } = req.body;
    try {
        await gameModel.adicionarPalavraForca(palavra, dica);
        res.status(201).json({ message: 'Palavra adicionada com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao adicionar palavra.' });
    }
};

export const updatePalavraForca = async (req, res) => {
    const { id } = req.params;
    const { palavra, dica } = req.body;
    try {
        await gameModel.atualizarPalavraForca(id, palavra, dica);
        res.json({ message: 'Palavra atualizada com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar palavra.' });
    }
};

export const deletePalavraForca = async (req, res) => {
    const { id } = req.params;
    try {
        await gameModel.excluirPalavraForca(id);
        res.json({ message: 'Palavra excluída com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao excluir palavra.' });
    }
};