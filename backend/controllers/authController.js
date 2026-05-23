import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import crypto from 'crypto'; 
import nodemailer from 'nodemailer'; 
import { criarUsuario, buscarPorEmail, buscarPorId } from '../models/usuarioModel.js';
import pool from '../config/db.js';

dotenv.config();

// =========================================================================
// CONFIGURAÇÃO DE EMAIL (MAILTRAP PARA TESTES)
// =========================================================================
// Quando for para produção, mude para o Gmail ou SendGrid
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "fe6f3d7b563449", 
    pass: "****a20a"    
  }
});

// =========================================================================
// FUNÇÕES EXISTENTES (CADASTRO E LOGIN)
// =========================================================================

export const registrar = async (req, res) => {
  const { nome, email, senha } = req.body;
  try {
    const usuarioExistente = await buscarPorEmail(email);
    if (usuarioExistente) return res.status(400).json({ message: "Email já cadastrado" });

    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);
    const id = await criarUsuario(nome, email, senhaHash);

    res.status(201).json({ message: "Usuário criado", id_usuario: id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro no servidor" });
  }
};

export const login = async (req, res) => {
  const { email, senha } = req.body;
  try {
    const usuario = await buscarPorEmail(email);
    if (!usuario) return res.status(400).json({ message: "Credenciais inválidas" });

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) return res.status(400).json({ message: "Credenciais inválidas" });

    const token = jwt.sign(
      { id_usuario: usuario.id_usuario, tipo_usuario: usuario.tipo_usuario },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro no servidor" });
  }
};

export const getPerfil = async (req, res) => {
  try {
    const usuario = await buscarPorId(req.user.id_usuario);

    const [rendas] = await pool.query(
      "SELECT * FROM renda WHERE id_usuario = ?",
      [req.user.id_usuario]
    );

    usuario.temFinanceiro = rendas.length > 0;
    res.json(usuario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro no servidor" });
  }
};

// =========================================================================
// (RECUPERAÇÃO DE SENHA)
// =========================================================================

// 1. Solicitar recuperação (Envia o Email)
export const esqueciSenha = async (req, res) => {
  const { email } = req.body;

  try {
    // Verifica se o usuário existe
    const usuario = await buscarPorEmail(email);
    
    if (!usuario) {
      return res.status(400).json({ message: 'Usuário não encontrado' });
    }

    // Gera um token aleatório
    const token = crypto.randomBytes(20).toString('hex');
    
    // Define tempo de expiração (Agora + 1 hora)
    const now = new Date();
    now.setHours(now.getHours() + 1);

    // Salva o token e a validade no banco de dados
    await pool.query(
      'UPDATE usuario SET password_reset_token = ?, password_reset_expires = ? WHERE id_usuario = ?',
      [token, now, usuario.id_usuario]
    );

    // Configura o email
    // IMPORTANTE: Mude o link abaixo para a URL do seu Front-end quando estiver pronto
    const mailOptions = {
      to: email,
      from: 'no-reply@fintec.com', 
      subject: 'Recuperação de Senha - FinTec',
      text: `Você recebeu este e-mail porque solicitou a redefinição de senha para sua conta.\n\n
      Por favor, clique no link abaixo ou cole no seu navegador para completar o processo:\n\n
      http://localhost:5000/reset-password.html?token=${token}\n\n
      Se você não solicitou isso, por favor ignore este e-mail e sua senha permanecerá inalterada.`
    };

    // Envia o email
    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: 'E-mail de recuperação enviado com sucesso!' });

  } catch (err) {
    console.error("Erro no esqueciSenha:", err);
    return res.status(500).json({ message: 'Erro ao tentar enviar email de recuperação' });
  }
};

// 2. Efetivar a troca (Recebe Token + Nova Senha)
export const redefinirSenha = async (req, res) => {
  const { token, novaSenha } = req.body;

  try {
    // Busca usuário que tenha esse token E que o token ainda seja válido (data de expiração > agora)
    const [users] = await pool.query(
      'SELECT * FROM usuario WHERE password_reset_token = ? AND password_reset_expires > NOW()',
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Token inválido ou expirado' });
    }

    const usuario = users[0];

    // Criptografa a nova senha
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(novaSenha, salt);

    // Atualiza a senha no banco e limpa os campos de token para não serem usados novamente
    await pool.query(
      'UPDATE usuario SET senha = ?, password_reset_token = NULL, password_reset_expires = NULL WHERE id_usuario = ?',
      [senhaHash, usuario.id_usuario]
    );

    return res.status(200).json({ message: 'Senha alterada com sucesso! Agora você pode fazer login.' });

  } catch (err) {
    console.error("Erro no redefinirSenha:", err);
    return res.status(500).json({ message: 'Erro ao redefinir senha' });
  }
};
