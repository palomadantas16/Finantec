document.addEventListener('DOMContentLoaded', () => {
    // 1. VALIDAÇÃO DO TOKEN
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'paginaLogin.html';
        return;
    }

    // ======================================================================
    // 2. CONFIGURAÇÕES GLOBAIS E FUNÇÕES DE API
    // ======================================================================

    // Configuração para requisições JSON
    const fetchOptions = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };

    // Configuração para requisições com upload de arquivo (sem Content-Type)
    const fetchUploadOptions = {
        headers: { 'Authorization': `Bearer ${token}` }
    };

    /**
     * Função auxiliar para requisições JSON
     */
    const apiRequest = async (url, options = {}) => {
        const response = await fetch(url, { ...fetchOptions, ...options });
        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = 'paginaLogin.html';
            throw new Error('Não autorizado');
        }
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
            throw new Error(errorData.message);
        }
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return response.json();
        }
        return {};
    };

    /**
     * Função específica para fazer upload de arquivos (FormData).
     */
    const apiUploadRequest = async (url, options = {}) => {
        const response = await fetch(url, { ...fetchUploadOptions, ...options });
        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = 'paginaLogin.html';
            throw new Error('Não autorizado');
        }
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
            throw new Error(errorData.message);
        }
        return response.json();
    };


    // ======================================================================
    // 3. FUNÇÕES PRINCIPAIS DA PÁGINA
    // ======================================================================

    /**
     * Carrega os dados principais do dashboard (nome, saldo, etc.).
     */
    async function carregarDashboard() {
        try {
            const [user, financeiro] = await Promise.all([
                apiRequest('/api/auth/me'),
                apiRequest('/api/usuarios/financeiro-dashboard')
            ]);
            
            document.querySelector('.header h1').textContent = `Olá, ${user.nome}!`;
            document.querySelector('.profile-box span').textContent = user.nome;

            const avatarUrl = user.avatar_url ? `http://localhost:5000/${user.avatar_url}` : '../img/avatar.jpg';
            document.getElementById('fotoPerfilBox').src = avatarUrl;
            document.getElementById('fotoPerfil').src = avatarUrl;
            
            document.querySelector('.saldo-box').innerHTML = `Meu Saldo <br> R$${financeiro.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
            document.getElementById('rendaCard').innerHTML = `<strong>Renda (Mês)</strong><br />R$${financeiro.renda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
            document.getElementById('despesaCard').innerHTML = `<strong>Despesa (Mês)</strong><br />R$${financeiro.despesa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
        }
    }
    
    // --- LÓGICA DO CARROSSEL DE METAS ---
    const cardsContainer = document.getElementById('cardsContainer');
    const dotsContainer = document.getElementById('carouselDots');
    let metasCache = [];
    let currentIndex = 0;
    
    async function carregarMetasCarrossel() {
        try {
            metasCache = await apiRequest('/api/metas');
            currentIndex = 0;
            renderizarCarrossel();
        } catch (error) {
            console.error("Erro ao carregar metas:", error);
            if(cardsContainer) cardsContainer.innerHTML = '<p>Não foi possível carregar seus objetivos.</p>';
        }
    }

    function renderizarCarrossel() {
        if (!cardsContainer) return;
        cardsContainer.innerHTML = '';
        if (dotsContainer) dotsContainer.innerHTML = '';

        if (metasCache.length === 0) {
            cardsContainer.innerHTML = '<p style="text-align: center; width: 100%;">Nenhum objetivo encontrado.</p>';
            return;
        }

        const metaAtual = metasCache[currentIndex];
        const progressoPercent = metaAtual.valor_objetivo > 0 ? (metaAtual.valor_atual / metaAtual.valor_objetivo) * 100 : 0;
        
        const cardHTML = `
            <button class="arrow left"><i class="fas fa-chevron-left"></i></button>
            <div class="balance-card" style="background: ${metaAtual.cor || '#146627'};">
                <p><strong>${metaAtual.descricao.toUpperCase()}</strong></p>
                <h2>R$${parseFloat(metaAtual.valor_objetivo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
                <div class="progress-container">
                    <p>Progresso: R$${parseFloat(metaAtual.valor_atual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <div class="progress-bar"><div class="fill" style="width:${Math.min(100, progressoPercent)}%"></div></div>
                    <p>${progressoPercent.toFixed(0)}% de conquista</p>
                </div>
            </div>
            <div class="actions">
                <button data-action="adicionar" data-id="${metaAtual.id_meta}">Adicionar Dinheiro</button>
                <button data-action="retirar" data-id="${metaAtual.id_meta}">Retirar Dinheiro</button>
                <button data-action="editar" data-id="${metaAtual.id_meta}">Editar Meta</button>
                <div class="excluir">
                    <button data-action="excluir" data-id="${metaAtual.id_meta}">Excluir Meta</button>
                </div>
            </div>
            <button class="arrow right"><i class="fas fa-chevron-right"></i></button>
        `;
        cardsContainer.innerHTML = cardHTML;

        if (dotsContainer) {
            metasCache.forEach((_, index) => {
                const dot = document.createElement('div');
                dot.classList.add('dot');
                if (index === currentIndex) dot.classList.add('active');
                dot.dataset.index = index;
                dotsContainer.appendChild(dot);
            });
        }
    }

    function mudarCard(direcao) {
        if (metasCache.length <= 1) return;
        currentIndex = (currentIndex + direcao + metasCache.length) % metasCache.length;
        renderizarCarrossel();
    }

    // --- LÓGICA DO GRÁFICO ---
    async function renderizarGrafico() {
        const canvas = document.getElementById('portfolioChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        try {
            const historico = await apiRequest('/api/usuarios/historico-saldo');
            const labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            const saldosMensais = Array(12).fill(0);
            historico.forEach(item => { saldosMensais[item.mes - 1] = item.saldo; });
            
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Saldo Mensal (R$)', data: saldosMensais, borderColor: '#1e7f34',
                        backgroundColor: 'rgba(30, 127, 52, 0.1)', borderWidth: 3, fill: true, tension: 0.4,
                    }]
                },
                options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
            });
        } catch (error) {
            console.error('Erro ao renderizar gráfico:', error);
        }
    }

    /**
     * Configura todos os event listeners da página.
     */
    function setupEventListeners() {
        const overlayPerfil = document.getElementById('overlayPerfil');
        const overlayCriarObjetivo = document.getElementById('overlayCriarObjetivo');
        const overlayAcaoMeta = document.getElementById('overlayAcaoMeta');
        const overlayExcluirMeta = document.getElementById('overlayExcluirMeta');
        const overlayEditarMeta = document.getElementById('overlayEditarMeta');
        const uploadFotoInput = document.getElementById('uploadFoto');
        const fotoPerfilPreview = document.getElementById('fotoPerfil');
        
        uploadFotoInput?.addEventListener('change', () => {
            const file = uploadFotoInput.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    fotoPerfilPreview.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        document.getElementById('trocarFotoBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            uploadFotoInput.click();
        });
        
        document.getElementById('savePerfil')?.addEventListener('click', async () => {
            const nome = document.getElementById('nomePerfil').value;
            const renda = document.getElementById('rendaPerfil').value;
            const despesa = document.getElementById('despesaPerfil').value;
            const fotoFile = uploadFotoInput.files[0];

            if (!nome) return alert("O campo 'Nome' não pode estar vazio.");

            const formData = new FormData();
            formData.append('nome', nome);
            if (renda) formData.append('renda', renda);
            if (despesa) formData.append('despesa', despesa);
            if (fotoFile) formData.append('avatar', fotoFile);

            try {
                await apiUploadRequest('/api/usuarios/perfil', {
                    method: 'PUT',
                    body: formData
                });
                alert('Perfil atualizado com sucesso!');
                if (overlayPerfil) overlayPerfil.style.display = 'none';
                await carregarDashboard();
            } catch (error) {
                alert(`Erro ao atualizar o perfil: ${error.message}`);
            }
        });

        document.getElementById('perfilBtn')?.addEventListener('click', () => {
            const nomeAtual = document.querySelector('.profile-box span').textContent;
            document.getElementById('nomePerfil').value = nomeAtual;
            if (overlayPerfil) overlayPerfil.style.display = 'flex';
        });

        document.getElementById('btnCriarObjetivo')?.addEventListener('click', () => {
            if (overlayCriarObjetivo) overlayCriarObjetivo.style.display = 'flex';
        });

        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            if(confirm('Tem certeza que deseja sair?')) {
                localStorage.removeItem('token');
                window.location.href = '../html/home.html';
            }
        });

        document.body.addEventListener('click', async (e) => {
            if (e.target.closest('.arrow.left')) return mudarCard(-1);
            if (e.target.closest('.arrow.right')) return mudarCard(1);
            if (e.target.matches('.dot')) {
                currentIndex = parseInt(e.target.dataset.index);
                renderizarCarrossel();
                return;
            }
            const button = e.target.closest('button[data-action]');
            if (button) {
                const action = button.dataset.action;
                const id = button.dataset.id;
                if (action === 'adicionar' || action === 'retirar') {
                    document.getElementById('acaoMetaTitulo').textContent = action === 'adicionar' ? 'Adicionar Valor' : 'Retirar Dinheiro';
                    document.getElementById('acaoMetaValor').value = '';
                    overlayAcaoMeta.style.display = 'flex';
                    overlayAcaoMeta.dataset.action = action;
                    overlayAcaoMeta.dataset.id = id;
                } else if (action === 'editar') {
                    const meta = metasCache.find(m => m.id_meta == id);
                    if (meta) {
                        document.getElementById('editarMetaId').value = meta.id_meta;
                        document.getElementById('editarMetaDescricao').value = meta.descricao;
                        document.getElementById('editarMetaValor').value = meta.valor_objetivo;
                        document.getElementById('editarMetaCor').value = meta.cor || '#146627';
                        overlayEditarMeta.style.display = 'flex';
                    }
                } else if (action === 'excluir') {
                    overlayExcluirMeta.style.display = 'flex';
                    overlayExcluirMeta.dataset.id = id;
                }
            }
        });

        document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
            toggle.addEventListener('click', () => {
                toggle.parentElement.classList.toggle('open');
            });
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                document.querySelectorAll('.dropdown.open').forEach(dropdown => {
                    dropdown.classList.remove('open');
                });
            }
        });

        document.getElementById('salvarObjetivoBtn')?.addEventListener('click', async () => {
            const data = {
                descricao: document.getElementById('nomeObjetivo').value,
                valor_objetivo: document.getElementById('valorObjetivo').value,
                tempo_meses: document.getElementById('tempoObjetivo').value,
                frequencia: document.getElementById('frequenciaObjetivo').value,
                cor: document.getElementById('nomeCorObjetivo').value
            };
            if (!data.descricao || !data.valor_objetivo) return alert("Nome e Valor do objetivo são obrigatórios!");
            
            try {
                await apiRequest('/api/metas', { method: 'POST', body: JSON.stringify(data) });
                alert('🎯 Objetivo criado com sucesso!');
                overlayCriarObjetivo.style.display = 'none';
                document.getElementById('objetivoForm').reset();
                carregarMetasCarrossel();
            } catch (error) {
                alert(`Erro ao criar objetivo: ${error.message}`);
            }
        });

        document.getElementById('fecharObjetivoBtn')?.addEventListener('click', () => {
            if (overlayCriarObjetivo) overlayCriarObjetivo.style.display = 'none';
        });

        document.getElementById('salvarAcaoMetaBtn')?.addEventListener('click', async () => {
            const action = overlayAcaoMeta.dataset.action;
            const id = overlayAcaoMeta.dataset.id;
            const valor = document.getElementById('acaoMetaValor').value;
            if (!valor || isNaN(valor) || parseFloat(valor) <= 0) return alert('Por favor, insira um valor numérico válido.');
            
            const endpoint = action === 'adicionar' ? 'depositar' : 'retirar';
            try {
                await apiRequest(`/api/metas/${id}/${endpoint}`, { method: 'POST', body: JSON.stringify({ valor: parseFloat(valor) }) });
                overlayAcaoMeta.style.display = 'none';
                await carregarDashboard();      
                await carregarMetasCarrossel();
            } catch (error) {
                alert(`Erro: ${error.message}`);
            }
        });

        document.getElementById('fecharAcaoMetaBtn')?.addEventListener('click', () => {
            if (overlayAcaoMeta) overlayAcaoMeta.style.display = 'none';
        });

        document.getElementById('salvarEditarMetaBtn')?.addEventListener('click', async () => {
            const id = document.getElementById('editarMetaId').value;
            const data = {
                descricao: document.getElementById('editarMetaDescricao').value,
                valor_objetivo: document.getElementById('editarMetaValor').value,
                cor: document.getElementById('editarMetaCor').value
            };
            if (!data.descricao || !data.valor_objetivo) return alert("Nome e valor são obrigatórios!");

            try {
                await apiRequest(`/api/metas/${id}`, { method: 'PUT', body: JSON.stringify(data) });
                alert('Meta atualizada com sucesso!');
                overlayEditarMeta.style.display = 'none';
                await carregarMetasCarrossel();
            } catch (error) {
                alert(`Erro ao editar meta: ${error.message}`);
            }
        });

        document.getElementById('fecharEditarMetaBtn')?.addEventListener('click', () => {
            if (overlayEditarMeta) overlayEditarMeta.style.display = 'none';
        });

        document.getElementById('confirmarExcluirMetaBtn')?.addEventListener('click', async () => {
            const id = overlayExcluirMeta.dataset.id;
            try {
                await apiRequest(`/api/metas/${id}/excluir`, { method: 'DELETE' });
                alert('Meta excluída!');
                overlayExcluirMeta.style.display = 'none';
                await carregarMetasCarrossel();
            } catch (error) {
                alert(`Erro ao excluir meta: ${error.message}`);
            }
        });

        document.getElementById('cancelarExcluirMetaBtn')?.addEventListener('click', () => {
            if (overlayExcluirMeta) overlayExcluirMeta.style.display = 'none';
        });
        
        document.getElementById('fecharPerfil')?.addEventListener('click', () => {
            if (overlayPerfil) overlayPerfil.style.display = 'none';
        });
    }

    // ======================================================================
    // 4. INICIALIZAÇÃO DA PÁGINA
    // ======================================================================
    carregarDashboard();
    carregarMetasCarrossel();
    renderizarGrafico();
    setupEventListeners();
});