// controllers/despesaController.js

import pool from '../config/db.js';

// Listar todas as despesas do usuário logado
export const getDespesas = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT d.*, c.nome as categoria_nome FROM despesa d LEFT JOIN categoria_despesa c ON d.id_categoria = c.id_categoria WHERE d.id_usuario = ? ORDER BY d.data_despesa DESC",
      [req.user.id_usuario]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar despesas' });
  }
};

// Adicionar uma nova despesa
export const addDespesa = async (req, res) => {
  const { valor, descricao, data_despesa, id_categoria } = req.body;
  try {
    await pool.query(
      "INSERT INTO despesa (id_usuario, valor, descricao, data_despesa, id_categoria) VALUES (?, ?, ?, ?, ?)",
      [req.user.id_usuario, valor, descricao, data_despesa, id_categoria]
    );
    res.status(201).json({ message: 'Despesa adicionada com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao adicionar despesa' });
  }
};

// Excluir uma despesa
export const deleteDespesa = async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM despesa WHERE id_despesa = ? AND id_usuario = ?",
      [req.params.id, req.user.id_usuario]
    );
    res.json({ message: 'Despesa excluída com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao excluir despesa' });
  }
};

// Listar categorias de despesa
export const getCategorias = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM categoria_despesa WHERE id_usuario IS NULL OR id_usuario = ?", [req.user.id_usuario]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar categorias' });
  }
};