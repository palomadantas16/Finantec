// controllers/rendaController.js

import pool from '../config/db.js';

// Listar todas as rendas do usuário logado
export const getRendas = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM renda WHERE id_usuario = ? ORDER BY data_recebimento DESC",
      [req.user.id_usuario]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar rendas' });
  }
};

// Adicionar uma nova renda
export const addRenda = async (req, res) => {
  const { valor, descricao, data_recebimento } = req.body;
  try {
    await pool.query(
      "INSERT INTO renda (id_usuario, valor, descricao, data_recebimento) VALUES (?, ?, ?, ?)",
      [req.user.id_usuario, valor, descricao, data_recebimento]
    );
    res.status(201).json({ message: 'Renda adicionada com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao adicionar renda' });
  }
};

// Excluir uma renda
export const deleteRenda = async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM renda WHERE id_renda = ? AND id_usuario = ?",
      [req.params.id, req.user.id_usuario]
    );
    res.json({ message: 'Renda excluída com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao excluir renda' });
  }
};