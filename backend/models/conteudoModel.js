import pool from '../config/db.js';

export const listarConteudos = async () => {
  const [rows] = await pool.query('SELECT * FROM conteudo');
  return rows;
};

export const atualizarConteudo = async (id, titulo, texto) => {
  await pool.query(
    'UPDATE conteudo SET titulo = ?, texto = ?, data_postagem = NOW() WHERE id_conteudo = ?',
    [titulo, texto, id]
  );
};
