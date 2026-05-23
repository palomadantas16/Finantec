document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../html/paginaLogin.html';
        return;
    }

    // --- SELETORES DE ELEMENTOS ---
    const adminNameEl = document.getElementById('adminName');
    const logoutBtn = document.getElementById('logoutBtn');
    const notificationEl = document.getElementById('notification');
    
    // Abas e Seções
    const sections = document.querySelectorAll('main > section');
    const navButtons = {
        usuarios: document.getElementById('btn-usuarios'),
        conteudos: document.getElementById('btn-conteudos'),
        jogos: document.getElementById('btn-jogos'),
        preview: document.getElementById('btn-preview'),
    };

    // Usuários
    const usuariosTableBody = document.getElementById('usuariosTable');

    // Conteúdos
    const formConteudo = document.getElementById('formConteudoAdmin');
    const conteudoSelect = document.getElementById('conteudoSelect');
    const conteudoId = document.getElementById('conteudoId');
    const conteudoTitulo = document.getElementById('conteudoTitulo');
    
    // Jogos
    const quizTableBody = document.getElementById('quiz-table-body');
    const addQuizBtn = document.getElementById('add-quiz-btn');
    const quizModal = document.getElementById('quiz-modal');
    const quizForm = document.getElementById('quiz-form');
    const forcaTableBody = document.getElementById('forca-table-body');
    const addForcaBtn = document.getElementById('add-forca-btn');
    const forcaModal = document.getElementById('forca-modal');
    const forcaForm = document.getElementById('forca-form');
    
    let adminLogadoId = null;
    let quizCache = [];
    let conteudosCache = [];
    let editorInstance;

    ClassicEditor.create(document.querySelector('#conteudoTexto')).then(editor => { editorInstance = editor; }).catch(console.error);

    // --- FUNÇÕES GERAIS ---
    function showNotification(message, type = 'success') {
        notificationEl.textContent = message;
        notificationEl.className = `notification notification-${type} show`;
        setTimeout(() => notificationEl.classList.remove('show'), 4000);
    }

    function showSection(sectionId) {
        sections.forEach(section => {
            section.style.display = section.id === sectionId ? 'block' : 'none';
        });
    }

    const apiRequest = async (url, options = {}) => {
        const defaultOptions = { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } };
        const response = await fetch(`http://localhost:5000${url}`, { ...defaultOptions, ...options });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Ocorreu um erro.');
        return data;
    };

    // --- LÓGICA DE USUÁRIOS ---
    async function carregarUsuarios() {
        try {
            const users = await apiRequest('/api/usuarios');
            usuariosTableBody.innerHTML = '';

            users.forEach(user => {
                let acaoHtml = '';
                if (user.id_usuario === adminLogadoId) {
                    acaoHtml = '<span>(Usuário atual)</span>';
                } else {
                    if (user.tipo_usuario === 'administrador') {
                        acaoHtml = `<button class="btn-student" data-id="${user.id_usuario}" data-tipo="estudante">Tornar Estudante</button>`;
                    } else {
                        acaoHtml = `<button class="btn-admin" data-id="${user.id_usuario}" data-tipo="administrador">Tornar Admin</button>`;
                    }
                }
                const row = `<tr>
                    <td>${user.id_usuario}</td>
                    <td>${user.nome}</td>
                    <td>${user.email}</td>
                    <td>${user.tipo_usuario || 'Não definido'}</td> 
                    <td>${acaoHtml}</td>
                </tr>`;
                usuariosTableBody.innerHTML += row;
            });
        } catch (err) {
            showNotification('Erro ao carregar a lista de usuários: ' + err.message, 'error');
        }
    }
    
    async function mudarTipoUsuario(idUsuario, novoTipo) {
        try {
            const response = await apiRequest(`/api/usuarios/${idUsuario}/tipo`, {
                method: 'PUT',
                body: JSON.stringify({ tipo: novoTipo })
            });
            showNotification(response.message || 'Tipo de usuário alterado!', 'success');
            carregarUsuarios(); // Recarrega a lista
        } catch (err) {
            showNotification('Erro ao alterar tipo de usuário: ' + err.message, 'error');
        }
    }

    // --- LÓGICA DE CONTEÚDOS ---
    async function carregarConteudos() {
    try {
        conteudosCache = await apiRequest('/api/conteudos');
        conteudoSelect.innerHTML = '<option value="">-- Selecione uma seção --</option>';
        
        // Filtra a lista para remover qualquer item da página 'home'
        const conteudosFiltrados = conteudosCache.filter(c => c.pagina !== 'home');

        conteudosFiltrados.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id_conteudo;
            opt.textContent = `${c.pagina} - ${c.secao}`;
            opt.dataset.pagina = c.pagina;
            opt.dataset.secao = c.secao;
            conteudoSelect.appendChild(opt);
        });
    } catch (err) {
        showNotification('Erro ao carregar lista de seções: ' + err.message, 'error');
    }
}

    function selecionarConteudo(id) {
        const conteudo = conteudosCache.find(c => String(c.id_conteudo) === String(id));
        if (conteudo) {
            conteudoId.value = conteudo.id_conteudo;
            conteudoTitulo.value = conteudo.titulo;
            if (editorInstance) editorInstance.setData(conteudo.texto || '');
        } else {
            conteudoId.value = '';
            conteudoTitulo.value = '';
            if (editorInstance) editorInstance.setData('');
        }
    }

    // --- LÓGICA DE JOGOS ---
    async function loadQuizData() {
        try {
            quizCache = await apiRequest('/api/admin/quiz');
            quizTableBody.innerHTML = '';
            quizCache.forEach(p => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${p.nivel}</td><td>${p.pergunta}</td><td class="admin-actions"><button class="edit-btn" data-id="${p.id_pergunta}"><i class="fas fa-edit"></i> Editar</button><button class="delete-btn" data-id="${p.id_pergunta}"><i class="fas fa-trash"></i> Excluir</button></td>`;
                quizTableBody.appendChild(tr);
            });
        } catch (error) { showNotification('Erro ao carregar quiz: ' + error.message, 'error'); }
    }

    async function loadForcaData() {
        try {
            const palavras = await apiRequest('/api/admin/forca');
            forcaTableBody.innerHTML = '';
            palavras.forEach(p => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${p.palavra}</td><td>${p.dica}</td><td class="admin-actions"><button class="edit-btn" data-id="${p.id_palavra}"><i class="fas fa-edit"></i> Editar</button><button class="delete-btn" data-id="${p.id_palavra}"><i class="fas fa-trash"></i> Excluir</button></td>`;
                forcaTableBody.appendChild(tr);
            });
        } catch (error) { showNotification('Erro ao carregar palavras: ' + error.message, 'error'); }
    }

    // --- EVENT LISTENERS ---
    // Navegação
    navButtons.usuarios.addEventListener('click', () => showSection('usuariosSection'));
    navButtons.conteudos.addEventListener('click', () => showSection('conteudosSection'));
    navButtons.jogos.addEventListener('click', () => showSection('jogosSection'));
    navButtons.preview.addEventListener('click', () => showSection('previewSection'));
    logoutBtn.addEventListener('click', () => { localStorage.removeItem('token'); window.location.href = '../html/home.html'; });
    
    // Conteúdos
    conteudoSelect?.addEventListener('change', () => selecionarConteudo(conteudoSelect.value));
    formConteudo?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const selectedOption = conteudoSelect.options[conteudoSelect.selectedIndex];
            const payload = {
                id_conteudo: conteudoId.value, pagina: selectedOption.dataset.pagina, secao: selectedOption.dataset.secao,
                titulo: conteudoTitulo.value, texto: editorInstance.getData()
            };
            const response = await apiRequest('/api/conteudos', { method: 'POST', body: JSON.stringify(payload) });
            showNotification(response.message, 'success');
        } catch (err) { showNotification('Erro ao salvar conteúdo: ' + err.message, 'error'); }
    });
    
    // Tabela de Usuários
    usuariosTableBody.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if(button) {
            const id = button.dataset.id;
            const tipo = button.dataset.tipo;
            mudarTipoUsuario(id, tipo);
        }
    });

    // Modais e Forms de Jogos
    addQuizBtn.addEventListener('click', () => { quizForm.reset(); quizModal.style.display = 'flex'; document.getElementById('quiz-id').value = ''; document.getElementById('quiz-modal-title').innerText = 'Adicionar Pergunta'; });
    addForcaBtn.addEventListener('click', () => { forcaForm.reset(); forcaModal.style.display = 'flex'; document.getElementById('forca-id').value = ''; document.getElementById('forca-modal-title').innerText = 'Adicionar Palavra'; });
    document.querySelectorAll('.overlay .closeBtn').forEach(btn => btn.addEventListener('click', () => btn.closest('.overlay').style.display = 'none'));
    
    quizForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('quiz-id').value;
        const correct = parseInt(quizForm.querySelector('input[name="correct-option"]:checked').value);
        const data = {
            pergunta: document.getElementById('quiz-pergunta').value, nivel: parseInt(document.getElementById('quiz-nivel').value), pontos: parseInt(document.getElementById('quiz-pontos').value),
            opcoes: Array.from({length: 4}, (_, i) => ({ texto: document.getElementById(`quiz-opt${i+1}`).value, correta: correct === i ? 1 : 0 }))
        };
        try {
            await apiRequest(id ? `/api/admin/quiz/${id}` : '/api/admin/quiz', { method: id ? 'PUT' : 'POST', body: JSON.stringify(data) });
            quizModal.style.display = 'none'; showNotification('Pergunta salva!', 'success'); loadQuizData();
        } catch (error) { showNotification('Erro: ' + error.message, 'error'); }
    });
      
    forcaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('forca-id').value;
        const data = { palavra: document.getElementById('forca-palavra').value, dica: document.getElementById('forca-dica').value };
        try {
            await apiRequest(id ? `/api/admin/forca/${id}` : '/api/admin/forca', { method: id ? 'PUT' : 'POST', body: JSON.stringify(data) });
            forcaModal.style.display = 'none'; showNotification('Palavra salva!', 'success'); loadForcaData();
        } catch (error) { showNotification('Erro: ' + error.message, 'error'); }
    });
      
    quizTableBody.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;
        const id = button.dataset.id;
        if (button.classList.contains('delete-btn')) {
            if (confirm('Tem certeza?')) apiRequest(`/api/admin/quiz/${id}`, { method: 'DELETE' }).then(() => { showNotification('Pergunta excluída!', 'success'); loadQuizData(); }).catch(err => showNotification(err.message, 'error'));
        } else if (button.classList.contains('edit-btn')) {
            const p = quizCache.find(item => item.id_pergunta == id);
            if (p) {
                document.getElementById('quiz-id').value = p.id_pergunta;
                document.getElementById('quiz-pergunta').value = p.pergunta;
                document.getElementById('quiz-nivel').value = p.nivel;
                document.getElementById('quiz-pontos').value = p.pontos;
                p.opcoes.forEach((opt, i) => {
                    document.getElementById(`quiz-opt${i + 1}`).value = opt.texto_opcao;
                    if (opt.correta) quizForm.querySelector(`input[name="correct-option"][value="${i}"]`).checked = true;
                });
                document.getElementById('quiz-modal-title').innerText = 'Editar Pergunta';
                quizModal.style.display = 'flex';
            }
        }
    });

    forcaTableBody.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;
        const id = button.dataset.id;
        if (button.classList.contains('delete-btn')) {
            if (confirm('Tem certeza?')) apiRequest(`/api/admin/forca/${id}`, { method: 'DELETE' }).then(() => { showNotification('Palavra excluída!', 'success'); loadForcaData(); }).catch(err => showNotification(err.message, 'error'));
        } else if (button.classList.contains('edit-btn')) {
            const tr = button.closest('tr');
            document.getElementById('forca-id').value = id;
            document.getElementById('forca-palavra').value = tr.cells[0].textContent;
            document.getElementById('forca-dica').value = tr.cells[1].textContent;
            document.getElementById('forca-modal-title').innerText = 'Editar Palavra';
            forcaModal.style.display = 'flex';
        }
    });

    // --- INICIALIZAÇÃO ---
    async function init() {
        try {
            const admin = await apiRequest('/api/auth/me');
            adminNameEl.textContent = admin.nome;
            adminLogadoId = admin.id_usuario;
            
            showSection('usuariosSection');
            
            await carregarUsuarios(); 
            await carregarConteudos();
            await loadQuizData();
            await loadForcaData();

        } catch(err) {
            showNotification('Sessão inválida. Faça login.', 'error');
        }
    }

    init();
});