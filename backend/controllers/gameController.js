import { buscarQuizCompleto, buscarPalavrasForca } from '../models/gameModel.js';
import { buscarPorId, atualizarProgressoJogo } from '../models/usuarioModel.js';

// --- APIs para o Jogo (indexJJ.html) ---

export const getGameContent = async (req, res) => {
  try {
    const quiz = await buscarQuizCompleto();
    const forca = await buscarPalavrasForca();
    res.json({ quiz, forca });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar conteúdo dos jogos.' });
  }
};

export const getProgressoUsuario = async (req, res) => {
  try {
    const usuario = await buscarPorId(req.user.id_usuario);
    res.json({
      level: usuario.game_level,
      coins: usuario.game_coins
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar progresso do usuário.' });
  }
};

export const updateProgressoUsuario = async (req, res) => {
  try {
    const { level, coins } = req.body;
    await atualizarProgressoJogo(req.user.id_usuario, level, coins);
    res.json({ message: 'Progresso salvo com sucesso!' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao salvar progresso.' });
  }
};

// --- APIs para o Admin (a serem criadas no futuro) ---
// export const adminGetQuiz ...
// export const adminUpdateQuiz ...