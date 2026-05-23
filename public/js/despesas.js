document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'paginaLogin.html';
        return;
    }

    const fetchOptions = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };

    // Elementos do DOM
    const expenseList = document.getElementById("expenseList");
    const overlay = document.getElementById("overlay");
    const openOverlayBtn = document.getElementById("openOverlay");
    const closeOverlayBtn = document.getElementById("closeOverlay");
    const salvarDespesaBtn = document.getElementById("salvarDespesa");
    const categoriaSelect = document.getElementById("categoria");

    // Função para carregar as categorias de despesa no modal
    async function carregarCategorias() {
        try {
            const res = await fetch('/api/despesas/categorias', { headers: fetchOptions.headers });
            const categorias = await res.json();
            
            categoriaSelect.innerHTML = ''; // Limpa as opções existentes
            categorias.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id_categoria;
                option.textContent = cat.nome;
                categoriaSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Erro ao carregar categorias:', error);
        }
    }
    
    // Função para carregar e exibir as despesas na lista
    async function carregarDespesas() {
        try {
            const res = await fetch('/api/despesas', { headers: fetchOptions.headers });
            const despesas = await res.json();
            
            expenseList.innerHTML = ''; // Limpa a lista
            if (despesas.length === 0) {
                expenseList.innerHTML = '<p>Nenhuma despesa adicionada ainda.</p>';
                return;
            }

            despesas.forEach(despesa => {
                const item = document.createElement("div");
                item.classList.add("expense-item");
                item.innerHTML = `
                  <div class="expense-info" style="display: flex; align-items: center; gap: 15px;">
                    <i class="fas fa-receipt" style="color: #c0392b;"></i>
                    <div>
                      <strong>R$ ${parseFloat(despesa.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                      <span style="display: block; font-size: 12px; color: #666;">
                        ${new Date(despesa.data_despesa).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} - ${despesa.categoria_nome || 'Sem Categoria'}
                      </span>
                    </div>
                  </div>
                  <button class="btn-delete" data-id="${despesa.id_despesa}" style="background: #ff4d4d; color: white; border: none; width: 35px; height: 35px; border-radius: 50%; cursor: pointer;">
                    <i class="fas fa-trash"></i>
                  </button>
                `;
                expenseList.appendChild(item);
            });
        } catch (error) {
            console.error('Erro ao carregar despesas:', error);
        }
    }

    // Evento para salvar uma nova despesa
    salvarDespesaBtn.addEventListener("click", async () => {
        const valor = document.getElementById("valor").value;
        const data = document.getElementById("data").value;
        const id_categoria = categoriaSelect.value;
        // A descrição pode vir de um campo de texto, se você adicionar um ao modal
        const descricao = "Despesa"; 

        if (!valor || !data || !id_categoria) {
            alert("Por favor, preencha todos os campos.");
            return;
        }

        try {
            await fetch('/api/despesas', {
                method: 'POST',
                headers: fetchOptions.headers,
                body: JSON.stringify({ 
                    valor: parseFloat(valor), 
                    data_despesa: data, 
                    id_categoria: parseInt(id_categoria),
                    descricao
                })
            });
            overlay.style.display = "none";
            document.getElementById("valor").value = "";
            document.getElementById("data").value = "";
            carregarDespesas(); // Atualiza a lista
        } catch (error) {
            alert('Erro ao salvar despesa.');
        }
    });

    // Evento para deletar uma despesa
    expenseList.addEventListener('click', async (e) => {
        const deleteButton = e.target.closest('.btn-delete');
        if (deleteButton) {
            const id = deleteButton.dataset.id;
            if (confirm('Tem certeza que deseja excluir esta despesa?')) {
                try {
                    await fetch(`/api/despesas/${id}`, { method: 'DELETE', headers: fetchOptions.headers });
                    carregarDespesas(); // Atualiza a lista
                } catch (error) {
                    alert('Erro ao excluir despesa.');
                }
            }
        }
    });

    // Eventos para abrir e fechar o modal
    openOverlayBtn.addEventListener("click", () => {
        overlay.style.display = "flex";
    });
    closeOverlayBtn.addEventListener("click", () => {
        overlay.style.display = "none";
    });

    // Carregamento inicial
    carregarCategorias();
    carregarDespesas();
});