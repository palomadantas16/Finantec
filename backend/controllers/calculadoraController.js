import { 
    adicionarCalculo, 
    buscarHistoricoPorUsuario, 
    excluirCalculo 
} from '../models/calculoModel.js';

// Função para SALVAR um novo cálculo no histórico
export const salvarCalculo = async (req, res) => {
  try {
    const calculoData = {
      id_usuario: req.user.id_usuario,
      ...req.body 
    };
    await adicionarCalculo(calculoData);
    res.status(201).json({ message: 'Cálculo salvo com sucesso!' });
  } catch (error) {
    console.error('Erro ao salvar cálculo:', error);
    res.status(500).json({ message: 'Erro no servidor ao salvar cálculo.' });
  }
};

// Função para BUSCAR o histórico do usuário logado
export const getHistorico = async (req, res) => {
  try {
    const historico = await buscarHistoricoPorUsuario(req.user.id_usuario);
    res.status(200).json(historico);
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ message: 'Erro no servidor ao buscar histórico.' });
  }
};

// Função para DELETAR um item do histórico
export const deletarHistoricoItem = async (req, res) => {
  try {
    const id_calculo = req.params.id;
    const id_usuario = req.user.id_usuario;
    const affectedRows = await excluirCalculo(id_calculo, id_usuario);

    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Item do histórico não encontrado ou não pertence a este usuário.' });
    }
    res.status(200).json({ message: 'Item do histórico excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir item do histórico:', error);
    res.status(500).json({ message: 'Erro no servidor ao tentar excluir o histórico.' });
  }
};