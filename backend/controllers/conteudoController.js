import pool from '../config/db.js';

// Lista todos os conteúdos para o painel de admin
export const listarConteudos = async (req, res) => {
  try {
    // A query correta, buscando TODOS os campos necessários, incluindo o texto.
    const [rows] = await pool.query('SELECT id_conteudo, pagina, secao, titulo, texto FROM conteudo ORDER BY pagina, id_conteudo');
    res.json(rows);
  } catch (error) {
    console.error("Erro ao listar conteúdos:", error);
    res.status(500).json({ message: "Erro ao buscar conteúdos." });
  }
};

// Busca TODOS os blocos de conteúdo público de uma página específica
export const obterConteudoPublico = async (req, res) => {
  try {
    const { pagina } = req.params;
    const [rows] = await pool.query(
      'SELECT secao, titulo, texto FROM conteudo WHERE pagina = ?',
      [pagina]
    );
    if (rows.length > 0) {
      // Transforma o array em um objeto para fácil acesso no frontend
      const pageContent = rows.reduce((acc, block) => {
        acc[block.secao] = {
          titulo: block.titulo,
          texto: block.texto
        };
        return acc;
      }, {});
      res.json(pageContent);
    } else {
      res.status(404).json({ message: 'Conteúdo não disponível.' });
    }
  } catch (error) {
    console.error("Erro ao obter conteúdo público:", error);
    res.status(500).json({ message: "Erro ao buscar conteúdo." });
  }
};

// Salva (ATUALIZA) um conteúdo
export const salvarConteudo = async (req, res) => {
  // Recebe 'secao' do body
  const { id_conteudo, pagina, secao, titulo, texto } = req.body;
  
  if (!pagina || !secao || !titulo || !id_conteudo) {
    return res.status(400).json({ message: "Dados incompletos para salvar." });
  }

  try {
    // A query de UPDATE correta, usando a coluna 'secao'
    await pool.query(
      'UPDATE conteudo SET pagina = ?, secao = ?, titulo = ?, texto = ? WHERE id_conteudo = ?',
      [pagina, secao, titulo, texto, id_conteudo]
    );
    res.json({ message: 'Conteúdo atualizado com sucesso!' });
  } catch (error) {
    console.error("Erro ao salvar conteúdo:", error);
    res.status(500).json({ message: "Erro interno do servidor ao salvar." });
  }
};