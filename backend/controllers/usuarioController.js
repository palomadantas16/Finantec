import pool from '../config/db.js';
import { 
    listarUsuarios as listUsers, 
    atualizarTipoUsuario, 
    buscarPorId 
} from '../models/usuarioModel.js';

// Função para buscar os dados para os cards e saldo do painel principal
export const getFinanceiroDashboard = async (req, res) => {
  try {
    const id_usuario = req.user.id_usuario;

    const [
      [usuarioRows],
      [rendaVariavelRows],
      [despesaVariavelRows]
    ] = await Promise.all([
      pool.query("SELECT renda_mensal, despesa_mensal FROM usuario WHERE id_usuario = ?", [id_usuario]),
      pool.query("SELECT COALESCE(SUM(valor), 0) AS total FROM renda WHERE id_usuario = ?", [id_usuario]),
      pool.query("SELECT COALESCE(SUM(valor), 0) AS total FROM despesa WHERE id_usuario = ?", [id_usuario])
    ]);

    const rendaFixa = usuarioRows[0]?.renda_mensal || 0;
    const despesaFixa = usuarioRows[0]?.despesa_mensal || 0;
    const totalRendasVariaveis = parseFloat(rendaVariavelRows[0].total);
    const totalDespesasVariaveis = parseFloat(despesaVariavelRows[0].total);

    const saldoFinal = (rendaFixa - despesaFixa) + totalRendasVariaveis - totalDespesasVariaveis;

    res.json({
      saldo: saldoFinal,
      renda: rendaFixa,
      despesa: despesaFixa,
    });

  } catch (error) {
    console.error('Erro ao carregar dados financeiros:', error);
    res.status(500).json({ message: 'Erro ao carregar dados financeiros' });
  }
};

// Função para salvar os dados financeiros iniciais (após cadastro)
export const setFinanceiroInicial = async (req, res) => {
  const { renda, despesa, objetivo } = req.body;
  const id_usuario = req.user.id_usuario;

  if (renda === undefined || despesa === undefined || objetivo === undefined) {
    return res.status(400).json({ message: "Todos os campos são obrigatórios." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      "UPDATE usuario SET renda_mensal = ?, despesa_mensal = ? WHERE id_usuario = ?",
      [renda, despesa, id_usuario]
    );

    if (objetivo > 0) {
      const [metaResult] = await connection.query(
        "INSERT INTO meta (id_usuario, descricao, valor_objetivo, prazo) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 YEAR))",
        [id_usuario, 'Meta de Economia', objetivo]
      );
      await connection.query(
          'INSERT INTO progresso (id_meta, valor_atual) VALUES (?, 0)',
          [metaResult.insertId]
      );
    }
    
    await connection.commit();
    res.status(201).json({ message: "Informações financeiras salvas com sucesso!" });

  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: "Erro ao salvar informações financeiras." });
  } finally {
    connection.release();
  }
};

// Função para buscar os dados do perfil para a tela de edição
export const getPerfil = async (req, res) => {
    try {
        const usuario = await buscarPorId(req.user.id_usuario);
        if (!usuario) {
            return res.status(404).json({ message: "Usuário não encontrado." });
        }
        res.json(usuario);
    } catch (error) {
        console.error("Erro ao buscar perfil:", error);
        res.status(500).json({ message: "Erro no servidor ao buscar dados do perfil." });
    }
};

// Função para ATUALIZAR o perfil do usuário
export const updatePerfil = async (req, res) => {
    const { nome, renda, despesa } = req.body;
    const id_usuario = req.user.id_usuario;
    const avatar = req.file;

    try {
        const fieldsToUpdate = [];
        const values = [];

        if (nome) { fieldsToUpdate.push("nome = ?"); values.push(nome); }
        if (renda !== undefined && renda !== null && renda !== '') { fieldsToUpdate.push("renda_mensal = ?"); values.push(parseFloat(renda)); }
        if (despesa !== undefined && despesa !== null && despesa !== '') { fieldsToUpdate.push("despesa_mensal = ?"); values.push(parseFloat(despesa)); }
        if (avatar) { const avatarPath = `uploads/${avatar.filename}`; fieldsToUpdate.push("avatar_url = ?"); values.push(avatarPath); }
        if (fieldsToUpdate.length === 0) return res.json({ message: 'Nenhuma alteração fornecida.' });
        
        values.push(id_usuario);
        const sql = `UPDATE usuario SET ${fieldsToUpdate.join(', ')} WHERE id_usuario = ?`;
        await pool.query(sql, values);
        res.json({ message: 'Perfil atualizado com sucesso!' });
    } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        res.status(500).json({ message: "Erro no servidor ao atualizar o perfil." });
    }
};

/**
 * ##### CORREÇÃO APLICADA AQUI #####
 * Esta função agora calcula o saldo atual e projeta os próximos 11 meses.
 */
export const getHistoricoSaldo = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;

        const [
            [usuarioRows],
            [rendaVariavelRows],
            [despesaVariavelRows]
        ] = await Promise.all([
            pool.query("SELECT renda_mensal, despesa_mensal FROM usuario WHERE id_usuario = ?", [id_usuario]),
            pool.query("SELECT COALESCE(SUM(valor), 0) AS total FROM renda WHERE id_usuario = ?", [id_usuario]),
            pool.query("SELECT COALESCE(SUM(valor), 0) AS total FROM despesa WHERE id_usuario = ?", [id_usuario])
        ]);

        const rendaFixa = usuarioRows[0]?.renda_mensal || 0;
        const despesaFixa = usuarioRows[0]?.despesa_mensal || 0;
        const totalRendasVariaveis = parseFloat(rendaVariavelRows[0].total);
        const totalDespesasVariaveis = parseFloat(despesaVariavelRows[0].total);

        const saldoAtual = (rendaFixa - despesaFixa) + totalRendasVariaveis - totalDespesasVariaveis;
        
        const diferencaMensalFixa = rendaFixa - despesaFixa;
        const projecao = [];
        
        for (let i = 0; i < 12; i++) {
            const saldoProjetado = saldoAtual + (diferencaMensalFixa * i);
            projecao.push(saldoProjetado);
        }

        res.json(projecao);

    } catch (error) {
        console.error('Erro ao gerar projeção de saldo:', error);
        res.status(500).json({ message: 'Erro ao gerar dados para o gráfico' });
    }
};

// Função para remover a foto de perfil do usuário
export const deleteAvatar = async (req, res) => {
    const id_usuario = req.user.id_usuario;
    try {
        await pool.query("UPDATE usuario SET avatar_url = NULL WHERE id_usuario = ?", [id_usuario]);
        res.json({ message: 'Foto de perfil removida com sucesso!' });
    } catch (error) {
        console.error("Erro ao remover avatar:", error);
        res.status(500).json({ message: "Erro ao remover a foto de perfil." });
    }
};

// --- Funções de Admin ---
export const getUsuarios = async (req, res) => {
  const usuarios = await listUsers();
  res.json(usuarios);
};

export const mudarTipo = async (req, res) => {
  await atualizarTipoUsuario(req.params.id, req.body.tipo);
  res.json({ message: 'Tipo de usuário atualizado' });
};

// Função para buscar a renda principal (usada na pagRenda.html)
export const getRendaFixa = async (req, res) => {
  try {
    const id_usuario = req.user.id_usuario;
    const [rows] = await pool.query(`SELECT renda_mensal FROM usuario WHERE id_usuario = ?`, [id_usuario]);
    const rendaFixa = rows.length > 0 ? rows[0].renda_mensal : 0;
    res.json({ renda_fixa: rendaFixa });
  } catch (error) {
    console.error('Erro ao carregar renda fixa:', error);
    res.status(500).json({ message: 'Erro no servidor ao buscar renda fixa' });
  }
};