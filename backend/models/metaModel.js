import pool from '../config/db.js';

export const criarMeta = async (id_usuario, descricao, valor_objetivo, prazo) => {
  const [result] = await pool.query(
    'INSERT INTO meta (id_usuario, descricao, valor_objetivo, prazo) VALUES (?, ?, ?, ?)',
    [id_usuario, descricao, valor_objetivo, prazo]
  );
  return result.insertId;
};

export const reestabelecerMeta = async (id_usuario) => {
  await pool.query(
    'UPDATE progresso SET valor_atual = 0, percentual_alcancado = 0 WHERE id_meta IN (SELECT id_meta FROM meta WHERE id_usuario = ?)',
    [id_usuario]
  );
};

export const recomecarMeta = async (id_usuario) => {
  await pool.query(
    'DELETE FROM progresso WHERE id_meta IN (SELECT id_meta FROM meta WHERE id_usuario = ?)',
    [id_usuario]
  );
};
