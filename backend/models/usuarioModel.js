import pool from '../config/db.js';

export const criarUsuario = async (nome, email, senhaHash) => {
  const [result] = await pool.query(
    "INSERT INTO usuario (nome, email, senha) VALUES (?, ?, ?)",
    [nome, email, senhaHash]
  );
  return result.insertId;
};

export const buscarPorEmail = async (email) => {
  const [rows] = await pool.query("SELECT * FROM usuario WHERE email = ?", [email]);
  return rows[0];
};

export const buscarPorId = async (id) => {
  const [rows] = await pool.query(
    "SELECT id_usuario, nome, email, tipo_usuario, avatar_url, renda_mensal, despesa_mensal FROM usuario WHERE id_usuario = ?", 
    [id]
  );
  return rows[0];
};

export const atualizarTipoUsuario = async (id, tipo) => {
  await pool.query("UPDATE usuario SET tipo_usuario = ? WHERE id_usuario = ?", [tipo, id]);
};

export const listarUsuarios = async () => {
  const [rows] = await pool.query("SELECT id_usuario, nome, email, tipo_usuario FROM usuario");
  return rows;
};

export const atualizarStatusUsuario = async (id, status) => {
  await pool.query("UPDATE usuario SET status = ? WHERE id_usuario = ?", [status, id]);
};

export const atualizarProgressoJogo = async (id, level, coins) => {
  await pool.query(
    "UPDATE usuario SET game_level = ?, game_coins = ? WHERE id_usuario = ?",
    [level, coins, id]
  );
};