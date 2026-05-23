document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'paginaLogin.html';
        return;
    }

    const fetchOptions = (method = 'GET', body = null) => {
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
        return options;
    };

    const historicoLista = document.querySelector('.historico-lista');
    const overlay = document.getElementById('overlayAcoesHistorico');
    const detalhesEl = document.getElementById('historicoDetalhes');
    let historicoCache = [];

    async function carregarHistorico() {
        if (!historicoLista) return;
        try {
            const historico = await fetch('/api/calculadora/historico', fetchOptions()).then(res => res.json());
            historicoCache = historico;
            renderizarHistorico();
        } catch (error) {
            historicoLista.innerHTML = '<p>Erro ao carregar o histórico.</p>';
            console.error('Erro:', error);
        }
    }

    function renderizarHistorico() {
        if (historicoCache.length === 0) {
            historicoLista.innerHTML = '<li><p>Você ainda não tem nenhum cálculo salvo no histórico.</p></li>';
            return;
        }

        historicoLista.innerHTML = '';
        historicoCache.forEach(item => {
            const dataFormatada = new Date(item.data_calculo).toLocaleDateString('pt-BR');
            const li = document.createElement('li');
            li.dataset.id = item.id_calculo;
            li.innerHTML = `
                <div class="campo"><span>Data:</span> <span>${dataFormatada}</span></div>
                <div class="campo"><span>Tipo:</span> <span>${item.tipo_calculo}</span></div>
                <div class="campo"><span>Resultado:</span> <span>R$ ${parseFloat(item.resultado).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span></div>
            `;
            historicoLista.appendChild(li);
        });
    }

    function setupEventListeners() {
        if (!historicoLista || !overlay) return;

        historicoLista.addEventListener('click', (e) => {
            const itemLi = e.target.closest('li');
            if (!itemLi || !itemLi.dataset.id) return;
            
            const id = itemLi.dataset.id;
            const itemSelecionado = historicoCache.find(item => item.id_calculo == id);
            
            if (itemSelecionado) {
                detalhesEl.innerHTML = `<p><strong>Cálculo:</strong> ${itemSelecionado.tipo_calculo}</p><p><strong>Resultado:</strong> R$ ${parseFloat(itemSelecionado.resultado).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>`;
                overlay.dataset.idCalculo = id;
                overlay.dataset.resultado = itemSelecionado.resultado;
                overlay.dataset.descricao = `Resultado de ${itemSelecionado.tipo_calculo}`;
                overlay.style.display = 'flex';
            }
        });

        document.getElementById('btnAddRenda')?.addEventListener('click', async () => {
            const valor = overlay.dataset.resultado;
            const descricao = overlay.dataset.descricao;
            await fetch('/api/rendas', fetchOptions('POST', { valor, descricao, data_recebimento: new Date() }));
            alert('Valor adicionado às suas rendas com sucesso!');
            overlay.style.display = 'none';
        });
        
        document.getElementById('btnAddDespesa')?.addEventListener('click', async () => {
            const valor = overlay.dataset.resultado;
            const descricao = overlay.dataset.descricao;
            await fetch('/api/despesas', fetchOptions('POST', { valor, descricao, data_despesa: new Date(), id_categoria: 7 }));
            alert('Valor adicionado às suas despesas com sucesso!');
            overlay.style.display = 'none';
        });

        document.getElementById('btnExcluirHist')?.addEventListener('click', async () => {
            const id = overlay.dataset.idCalculo;
            if (confirm('Tem certeza que deseja excluir este item do histórico?')) {
                await fetch(`/api/calculadora/historico/${id}`, fetchOptions('DELETE'));
                alert('Histórico excluído!');
                overlay.style.display = 'none';
                carregarHistorico();
            }
        });

        document.getElementById('fecharAcoesBtn')?.addEventListener('click', () => {
            overlay.style.display = 'none';
        });
    }

    carregarHistorico();
    setupEventListeners();
});