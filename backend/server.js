import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Importe as rotas
import authRoutes from './routes/authRoutes.js';
import usuarioRoutes from './routes/usuarioRoutes.js';
import conteudoRoutes from './routes/conteudoRoutes.js';
import metaRoutes from './routes/metaRoutes.js';
import rendaRoutes from './routes/rendaRoutes.js';
import despesaRoutes from './routes/despesaRoutes.js';
import eventoRoutes from './routes/eventoRoutes.js'; 
import calculadoraRoutes from './routes/calculadoraRoutes.js';
import gameRoutes from './routes/gameRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(cors());
app.use(express.json());


// =================================================================
// ▼▼▼ LINHA ADICIONADA PARA SERVIR IMAGENS DE UPLOAD ▼▼▼
// =================================================================
// Isso torna a pasta 'uploads' acessível publicamente via http://localhost:5000/uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// =================================================================


// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/conteudos', conteudoRoutes);
app.use('/api/metas', metaRoutes);
app.use('/api/rendas', rendaRoutes);
app.use('/api/despesas', despesaRoutes);
app.use('/api/eventos', eventoRoutes); 
app.use('/api/calculadora', calculadoraRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/admin', adminRoutes);
// Servir arquivos estáticos (Frontend)
// Assumindo que sua pasta 'public' contém os arquivos HTML, CSS, JS do frontend
app.use(express.static(path.join(__dirname, '../public')));

// Rota para a página inicial
app.get('/', (req, res) => {
  // Redireciona para a home, que deve estar dentro da pasta 'public'
  res.redirect('/html/home.html');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});