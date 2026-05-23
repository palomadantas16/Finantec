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

    const apiRequest = async (url, options = {}) => {
        const response = await fetch(url, { ...fetchOptions, ...options });
        if (!response.ok) throw new Error('Falha na requisição');
        return response.json();
    };

    const monthYearEl = document.getElementById('month-year');
    const daysEl = document.getElementById('days');
    const prevBtn = document.getElementById('prev');
    const nextBtn = document.getElementById('next');
    
    let currentDate = new Date();
    currentDate.setDate(1); // Garante que estamos sempre no primeiro dia do mês

    async function renderCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth(); // 0 = Janeiro, 11 = Dezembro
        
        monthYearEl.textContent = `${currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}`;
        
        const eventos = await apiRequest(`/api/eventos/calendario?ano=${year}&mes=${month + 1}`);
        const eventosPorDia = eventos.reduce((acc, evento) => {
            const dia = new Date(evento.data).getUTCDate();
            if (!acc[dia]) acc[dia] = [];
            acc[dia].push(evento);
            return acc;
        }, {});

        daysEl.innerHTML = '';
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDayOfMonth; i++) {
            daysEl.innerHTML += '<div class="day other-month"></div>';
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dayEl = document.createElement('div');
            dayEl.classList.add('day');
            
            const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            
            dayEl.innerHTML = `
                <span>${i}</span>
                <div class="event-dots" id="dots-${i}"></div>
                <div class="day-buttons">
                    <button class="btn-plus" data-date="${fullDate}">+</button>
                    <button class="btn-minus" data-date="${fullDate}">-</button>
                </div>
            `;
            daysEl.appendChild(dayEl);

            if (eventosPorDia[i]) {
                const dotsContainer = dayEl.querySelector(`#dots-${i}`);
                eventosPorDia[i].forEach(evento => {
                    const dot = document.createElement('div');
                    dot.classList.add('event-dot', evento.tipo);
                    dotsContainer.appendChild(dot);
                });
            }
        }
    }

    prevBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    // Lógica dos Modais
    const overlayRenda = document.getElementById('overlayRenda');
    const overlayDespesa = document.getElementById('overlayDespesa');

    daysEl.addEventListener('click', e => {
        if (e.target.classList.contains('btn-plus')) {
            document.getElementById('rendaData').value = e.target.dataset.date;
            overlayRenda.style.display = 'flex';
        }
        if (e.target.classList.contains('btn-minus')) {
            document.getElementById('despesaData').value = e.target.dataset.date;
            carregarCategoriasDespesa();
            overlayDespesa.style.display = 'flex';
        }
    });

    document.getElementById('salvarRendaBtn').addEventListener('click', async () => {
        const data = {
            valor: document.getElementById('rendaValor').value,
            descricao: document.getElementById('rendaDescricao').value,
            data_recebimento: document.getElementById('rendaData').value
        };
        await apiRequest('/api/rendas', { method: 'POST', body: JSON.stringify(data) });
        overlayRenda.style.display = 'none';
        renderCalendar();
    });

    document.getElementById('salvarDespesaBtn').addEventListener('click', async () => {
        const data = {
            valor: document.getElementById('despesaValor').value,
            descricao: document.getElementById('despesaDescricao').value,
            data_despesa: document.getElementById('despesaData').value,
            id_categoria: document.getElementById('despesaCategoriaSelect').value
        };
        await apiRequest('/api/despesas', { method: 'POST', body: JSON.stringify(data) });
        overlayDespesa.style.display = 'none';
        renderCalendar();
    });
    
    async function carregarCategoriasDespesa() {
        const categorias = await apiRequest('/api/despesas/categorias');
        const select = document.getElementById('despesaCategoriaSelect');
        select.innerHTML = '';
        categorias.forEach(cat => {
            select.innerHTML += `<option value="${cat.id_categoria}">${cat.nome}</option>`;
        });
    }

    renderCalendar();
});