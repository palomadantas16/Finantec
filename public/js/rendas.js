// js/rendas.js

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'paginaLogin.html';
        return;
    }

    const fetchOptions = {
        headers: { 'Authorization': `Bearer ${token}` }
    };

    const incomeList = document.getElementById("incomeList");
    const overlay = document.getElementById("overlay");
    const btnAdd = document.getElementById("btnAdd");
    const salvarRendaBtn = document.getElementById("salvarRenda");
    const rendaFixaInput = document.querySelector(".fixed-income input");

    async function carregarRendas() {
        try {
            const res = await fetch('/api/rendas', fetchOptions);
            const rendas = await res.json();
            
            incomeList.innerHTML = ''; // Limpa a lista antes de adicionar
            if (rendas.length === 0) {
                incomeList.innerHTML = '<p>Nenhuma renda variável adicionada ainda.</p>';
                return;
            }

            rendas.forEach(renda => {
                const item = document.createElement("div");
                item.classList.add("income-item");
                item.innerHTML = `
                  <div class="income-info">
                    <strong>R$ ${parseFloat(renda.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                    <span>${new Date(renda.data_recebimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</span>
                    ${renda.descricao ? `<span>${renda.descricao}</span>` : ""}
                  </div>
                  <button class="btn-delete" data-id="${renda.id_renda}"><i class="fas fa-trash"></i></button>
                `;
                incomeList.appendChild(item);
            });
        } catch (error) {
            console.error('Erro ao carregar rendas:', error);
        }
    }

    btnAdd.addEventListener("click", () => {
        overlay.classList.add("active");
    });
    
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
            overlay.classList.remove("active");
        }
    });

    salvarRendaBtn.addEventListener("click", async () => {
        const valor = document.getElementById("valor").value;
        const data = document.getElementById("data").value;
        const descricao = document.getElementById("descricao").value;

        if (!valor || !data) {
            alert("Por favor, preencha o valor e a data.");
            return;
        }

        try {
            await fetch('/api/rendas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...fetchOptions.headers },
                body: JSON.stringify({ valor, data_recebimento: data, descricao })
            });
            overlay.classList.remove("active");
            document.getElementById("valor").value = "";
            document.getElementById("data").value = "";
            document.getElementById("descricao").value = "";
            carregarRendas(); // Atualiza a lista
        } catch (error) {
            alert('Erro ao salvar renda.');
        }
    });

    incomeList.addEventListener('click', async (e) => {
        if (e.target.closest('.btn-delete')) {
            const button = e.target.closest('.btn-delete');
            const id = button.dataset.id;
            if (confirm('Tem certeza que deseja excluir esta renda?')) {
                try {
                    await fetch(`/api/rendas/${id}`, { method: 'DELETE', ...fetchOptions });
                    carregarRendas();
                } catch (error) {
                    alert('Erro ao excluir renda.');
                }
            }
        }
    });

    carregarRendas();
});