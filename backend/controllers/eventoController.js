import pool from '../config/db.js';

// Busca todas as rendas e despesas de um determinado mês/ano
export const getEventosDoMes = async (req, res) => {
    try {
        const { ano, mes } = req.query; // Ex: /api/eventos/calendario?ano=2025&mes=9
        const id_usuario = req.user.id_usuario;

        if (!ano || !mes) {
            return res.status(400).json({ message: "Ano e mês são obrigatórios." });
        }

        const [eventos] = await pool.query(`
            (SELECT 
                id_renda as id, 
                valor, 
                descricao, 
                data_recebimento as data, 
                'renda' as tipo 
            FROM renda 
            WHERE 
                id_usuario = ? AND 
                YEAR(data_recebimento) = ? AND 
                MONTH(data_recebimento) = ?)
            UNION ALL
            (SELECT 
                id_despesa as id, 
                valor, 
                descricao, 
                data_despesa as data, 
                'despesa' as tipo 
            FROM despesa 
            WHERE 
                id_usuario = ? AND 
                YEAR(data_despesa) = ? AND 
                MONTH(data_despesa) = ?)
            ORDER BY data;
        `, [id_usuario, ano, mes, id_usuario, ano, mes]);
        
        res.json(eventos);

    } catch (error) {
        console.error("Erro ao buscar eventos do calendário:", error);
        res.status(500).json({ message: "Erro ao buscar eventos" });
    }
};