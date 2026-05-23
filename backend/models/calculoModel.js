import pool from '../config/db.js';

// Busca o histórico de cálculos de um usuário específico
export const buscarHistoricoPorUsuario = async (id_usuario) => {
  const [rows] = await pool.query(
    "SELECT * FROM calculo WHERE id_usuario = ? ORDER BY data_calculo DESC",
    [id_usuario]
  );
  return rows;
};

// Adiciona um novo cálculo ao histórico de um usuário
export const adicionarCalculo = async (calculoData) => {
  const { id_usuario, tipo_calculo, valor_principal, taxa_juros, tempo, resultado } = calculoData;
  const [result] = await pool.query(
    "INSERT INTO calculo (id_usuario, tipo_calculo, valor_principal, taxa_juros, tempo, resultado) VALUES (?, ?, ?, ?, ?, ?)",
    [id_usuario, tipo_calculo, valor_principal, taxa_juros, tempo, resultado]
  );
  return result.insertId;
};

// Exclui um cálculo do histórico de um usuário
export const excluirCalculo = async (id_calculo, id_usuario) => {
  const [result] = await pool.query(
    "DELETE FROM calculo WHERE id_calculo = ? AND id_usuario = ?", 
    [id_calculo, id_usuario]
  );
  return result.affectedRows; // Retorna 1 se deletou, 0 se não
};