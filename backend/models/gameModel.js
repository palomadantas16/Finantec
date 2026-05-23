import pool from '../config/db.js';

// --- Funções de LEITURA para o Jogo ---
export const buscarQuizCompleto = async () => {
    // ... (código existente, sem alterações)
    const [perguntas] = await pool.query('SELECT * FROM quiz_perguntas ORDER BY nivel, id_pergunta');
    const [opcoes] = await pool.query('SELECT * FROM quiz_opcoes');
    const quizLevels = {};
    for (const p of perguntas) {
        if (!quizLevels[p.nivel]) {
            quizLevels[p.nivel] = [];
        }
        const perguntaOpcoes = opcoes.filter(o => o.id_pergunta === p.id_pergunta);
        quizLevels[p.nivel].push({
            q: p.pergunta,
            points: p.pontos,
            options: perguntaOpcoes.map(o => o.texto_opcao),
            correct: perguntaOpcoes.findIndex(o => o.correta === 1)
        });
    }
    return quizLevels;
};

export const buscarPalavrasForca = async () => {
    // ... (código existente, sem alterações)
    const [rows] = await pool.query('SELECT palavra, dica FROM forca_palavras');
    return rows.map(r => ({ word: r.palavra, hint: r.dica }));
};

// --- Funções de ESCRITA para o Painel de ADMIN ---

// --- QUIZ ---
export const listarPerguntasQuizAdmin = async () => {
    const [perguntas] = await pool.query('SELECT * FROM quiz_perguntas ORDER BY nivel, id_pergunta');
    const [opcoes] = await pool.query('SELECT * FROM quiz_opcoes ORDER BY id_opcao');
    
    return perguntas.map(p => ({
        ...p,
        opcoes: opcoes.filter(o => o.id_pergunta === p.id_pergunta)
    }));
};

export const adicionarPerguntaQuiz = async (pergunta, nivel, pontos, opcoes) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [result] = await connection.query(
            'INSERT INTO quiz_perguntas (pergunta, nivel, pontos) VALUES (?, ?, ?)',
            [pergunta, nivel, pontos]
        );
        const id_pergunta = result.insertId;

        for (const opt of opcoes) {
            await connection.query(
                'INSERT INTO quiz_opcoes (id_pergunta, texto_opcao, correta) VALUES (?, ?, ?)',
                [id_pergunta, opt.texto, opt.correta]
            );
        }
        await connection.commit();
        return id_pergunta;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

export const atualizarPerguntaQuiz = async (id_pergunta, pergunta, nivel, pontos, opcoes) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query(
            'UPDATE quiz_perguntas SET pergunta = ?, nivel = ?, pontos = ? WHERE id_pergunta = ?',
            [pergunta, nivel, pontos, id_pergunta]
        );
        
        await connection.query('DELETE FROM quiz_opcoes WHERE id_pergunta = ?', [id_pergunta]);

        for (const opt of opcoes) {
            await connection.query(
                'INSERT INTO quiz_opcoes (id_pergunta, texto_opcao, correta) VALUES (?, ?, ?)',
                [id_pergunta, opt.texto, opt.correta]
            );
        }
        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

export const excluirPerguntaQuiz = async (id_pergunta) => {
    // A constraint ON DELETE CASCADE no banco já remove as opções automaticamente
    await pool.query('DELETE FROM quiz_perguntas WHERE id_pergunta = ?', [id_pergunta]);
};


// --- FORCA ---
export const listarPalavrasForcaAdmin = async () => {
    const [rows] = await pool.query('SELECT * FROM forca_palavras ORDER BY palavra');
    return rows;
};

export const adicionarPalavraForca = async (palavra, dica) => {
    const [result] = await pool.query(
        'INSERT INTO forca_palavras (palavra, dica) VALUES (?, ?)',
        [palavra.toUpperCase(), dica]
    );
    return result.insertId;
};

export const atualizarPalavraForca = async (id_palavra, palavra, dica) => {
    await pool.query(
        'UPDATE forca_palavras SET palavra = ?, dica = ? WHERE id_palavra = ?',
        [palavra.toUpperCase(), dica, id_palavra]
    );
};

export const excluirPalavraForca = async (id_palavra) => {
    await pool.query('DELETE FROM forca_palavras WHERE id_palavra = ?', [id_palavra]);
};