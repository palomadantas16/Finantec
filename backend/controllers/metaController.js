import pool from '../config/db.js';

// Busca TODOS os objetivos (metas) do usuário com seu progresso
export const getMetas = async (req, res) => {
    try {
        const [metas] = await pool.query(`
            SELECT 
                m.id_meta, 
                m.descricao, 
                m.valor_objetivo, 
                m.cor,
                m.prazo,
                COALESCE(p.valor_atual, 0) as valor_atual
            FROM meta m
            LEFT JOIN progresso p ON m.id_meta = p.id_meta
            WHERE m.id_usuario = ?
            ORDER BY m.id_meta DESC
        `, [req.user.id_usuario]); // A correção está nesta linha

        res.json(metas);
    } catch (error) {
        console.error("Erro ao buscar metas:", error);
        res.status(500).json({ message: "Erro ao buscar metas" });
    }
};

// Cria uma nova meta e seu registro de progresso
export const criarMeta = async (req, res) => {
    // Agora recebemos os novos campos do frontend
    const { descricao, valor_objetivo, cor, prazo_meses, frequencia } = req.body;
    const id_usuario = req.user.id_usuario;

    if (!descricao || !valor_objetivo) {
        return res.status(400).json({ message: "Descrição e valor objetivo são obrigatórios." });
    }

    // Calcula a data de prazo final se o usuário informou os meses
    let prazoFinal = null;
    if (prazo_meses && !isNaN(prazo_meses)) {
        const hoje = new Date();
        hoje.setMonth(hoje.getMonth() + parseInt(prazo_meses));
        prazoFinal = hoje;
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [result] = await connection.query(
            'INSERT INTO meta (id_usuario, descricao, valor_objetivo, prazo, cor, prazo_meses, frequencia) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id_usuario, descricao, valor_objetivo, prazoFinal, cor || '#146627', prazo_meses || null, frequencia || 'mensal']
        );
        const id_meta = result.insertId;

        await connection.query(
            'INSERT INTO progresso (id_meta, valor_atual) VALUES (?, 0.00)',
            [id_meta]
        );

        await connection.commit();
        res.status(201).json({ message: 'Meta criada com sucesso!', id_meta });
    } catch (error) {
        await connection.rollback();
        console.error("Erro ao criar meta:", error);
        res.status(500).json({ message: 'Erro ao criar meta' });
    } finally {
        connection.release();
    }
};
export const editarMeta = async (req, res) => {
    const { id_meta } = req.params;
    const { descricao, valor_objetivo, cor } = req.body;
    const id_usuario = req.user.id_usuario;

    try {
        const [result] = await pool.query(
            'UPDATE meta SET descricao = ?, valor_objetivo = ?, cor = ? WHERE id_meta = ? AND id_usuario = ?',
            [descricao, valor_objetivo, cor, id_meta, id_usuario]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Meta não encontrada ou não pertence ao usuário.' });
        }

        res.json({ message: 'Meta atualizada com sucesso!' });
    } catch (error) {
        console.error("Erro ao editar meta:", error);
        res.status(500).json({ message: 'Erro ao editar meta' });
    }
};
// Adiciona valor a uma meta (depositar)
export const depositarNaMeta = async (req, res) => {
    const { id_meta } = req.params;
    const { valor } = req.body;
    const id_usuario = req.user.id_usuario;
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        await connection.query(
            'UPDATE progresso SET valor_atual = valor_atual + ? WHERE id_meta = ?',
            [valor, id_meta]
        );

        await connection.query(
            'INSERT INTO despesa (id_usuario, valor, descricao, data_despesa, id_categoria) VALUES (?, ?, ?, CURDATE(), (SELECT id_categoria FROM categoria_despesa WHERE nome = "Outros"))',
            [id_usuario, valor, `Depósito na meta ID ${id_meta}`]
        );

        await connection.commit();
        res.json({ message: "Valor adicionado à meta com sucesso!" });
    } catch (error) {
        await connection.rollback();
        console.error("Erro ao depositar na meta:", error);
        res.status(500).json({ message: 'Erro ao depositar na meta' });
    } finally {
        connection.release();
    }
};
export const atualizarMeta = async (req, res) => {
    const { id_meta } = req.params;
    const { descricao, valor_objetivo, cor } = req.body;

    try {
        await pool.query(
            'UPDATE meta SET descricao = ?, valor_objetivo = ?, cor = ? WHERE id_meta = ? AND id_usuario = ?',
            [descricao, valor_objetivo, cor, id_meta, req.user.id_usuario]
        );
        res.json({ message: "Meta atualizada com sucesso!" });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar meta' });
    }
};
// Retira valor de uma meta (sacar)
export const retirarDaMeta = async (req, res) => {
    const { id_meta } = req.params;
    const { valor } = req.body;
    const id_usuario = req.user.id_usuario;
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const [result] = await connection.query(
            'UPDATE progresso SET valor_atual = valor_atual - ? WHERE id_meta = ? AND valor_atual >= ?',
            [valor, id_meta, valor]
        );

        if (result.affectedRows === 0) {
            throw new Error('Saldo insuficiente na meta para retirada.');
        }

        await connection.query(
            'INSERT INTO renda (id_usuario, valor, descricao, data_recebimento) VALUES (?, ?, ?, CURDATE())',
            [id_usuario, valor, `Retirada da meta ID ${id_meta}`]
        );

        await connection.commit();
        res.json({ message: "Valor retirado da meta com sucesso!" });
    } catch (error) {
        await connection.rollback();
        console.error("Erro ao retirar da meta:", error);
        res.status(500).json({ message: error.message || 'Erro ao retirar da meta' });
    } finally {
        connection.release();
    }
};
// Adicione esta nova função ao final do arquivo

export const excluirMeta = async (req, res) => {
    const { id_meta } = req.params;
    const id_usuario = req.user.id_usuario;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Primeiro, deleta o registro de progresso associado
        await connection.query('DELETE FROM progresso WHERE id_meta = ?', [id_meta]);

        // Depois, deleta a meta principal
        const [result] = await connection.query(
            'DELETE FROM meta WHERE id_meta = ? AND id_usuario = ?', 
            [id_meta, id_usuario]
        );

        if (result.affectedRows === 0) {
            throw new Error('Meta não encontrada ou não pertence ao usuário.');
        }

        await connection.commit();
        res.json({ message: "Meta excluída com sucesso!" });
    } catch (error) {
        await connection.rollback();
        console.error("Erro ao excluir meta:", error);
        res.status(500).json({ message: error.message || 'Erro ao excluir meta' });
    } finally {
        connection.release();
    }
};