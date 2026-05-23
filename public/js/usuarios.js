document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '../html/paginaLogin.html';
    return;
  }

  // Seletores de elementos da página
  const adminNameEl = document.getElementById('adminName');
  const logoutBtn = document.getElementById('logoutBtn');
  const usuariosTableBody = document.getElementById('usuariosTable');

  // Função genérica para requisições na API
  async function apiRequest(url, options = {}) {
    const defaultOptions = {
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${token}` 
      }
    };
    const response = await fetch(url, { ...defaultOptions, ...options });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Erro na requisição à API');
    }
    if (response.status === 204 || response.headers.get('content-length') === '0') {
        return null;
    }
    return response.json();
  }
  
  // Carrega o nome do admin no cabeçalho
  async function carregarAdmin() {
    try {
      const admin = await apiRequest('/api/auth/me');
      if (adminNameEl) {
        adminNameEl.textContent = admin.nome;
      }
    } catch (err) {
      console.error('Falha ao carregar dados do admin:', err.message);
      if (adminNameEl) {
        adminNameEl.textContent = 'Admin';
      }
    }
  }

  // Carrega a lista de usuários e monta a tabela
  async function carregarUsuarios() {
    try {
      // CORREÇÃO AQUI: A rota correta é /api/usuarios, e não /api/users
      const usuarios = await apiRequest('/api/usuarios'); 
      usuariosTableBody.innerHTML = ''; // Limpa a tabela antes de preencher

      usuarios.forEach(u => {
        const row = document.createElement('tr');
        const is_admin = u.tipo_usuario === 'administrador';

        row.innerHTML = `
          <td>${u.id_usuario}</td>
          <td>${u.nome}</td>
          <td>${u.email}</td>
          <td>
            <span class="user-role role-${u.tipo_usuario}">
              ${u.tipo_usuario}
            </span>
          </td>
          <td>
            <button 
              class="action-button ${is_admin ? 'btn-demote' : 'btn-promote'}" 
              data-id="${u.id_usuario}" 
              data-tipo="${u.tipo_usuario}">
              Tornar ${is_admin ? 'Estudante' : 'Admin'}
            </button>
          </td>
        `;
        usuariosTableBody.appendChild(row);
      });

    } catch (err) {
      console.error('Erro ao carregar usuários:', err.message);
      usuariosTableBody.innerHTML = '<tr><td colspan="5">Falha ao carregar a lista de usuários.</td></tr>';
    }
  }

  // Função para atualizar o tipo de usuário
  async function atualizarTipoUsuario(id, novoTipo) {
    try {
        // CORREÇÃO AQUI: A rota correta é /api/usuarios, e não /api/users
        await apiRequest(`/api/usuarios/${id}/tipo`, {
            method: 'PUT',
            body: JSON.stringify({ tipo_usuario: novoTipo })
        });
        carregarUsuarios(); 
    } catch (error) {
        console.error('Erro ao atualizar tipo de usuário:', error);
        alert('Não foi possível atualizar o tipo de usuário.');
    }
  }

  // Adiciona um único listener na tabela para gerenciar os cliques nos botões
  usuariosTableBody.addEventListener('click', (e) => {
    if (e.target.classList.contains('action-button')) {
      const id = e.target.dataset.id;
      const acao = e.target.dataset.action === 'administrador' ? 'administrador' : 'estudante'; // Lógica ajustada para pegar a ação correta
      const tipoAtual = e.target.dataset.tipo;
      const novoTipo = tipoAtual === 'administrador' ? 'estudante' : 'administrador';

      if (confirm(`Tem certeza que deseja tornar este usuário um ${novoTipo}?`)) {
        atualizarTipoUsuario(id, novoTipo);
      }
    }
  });

  // Evento do botão de logout
  logoutBtn?.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '../html/home.html';
  });

  // Funções iniciais
  carregarAdmin();
  carregarUsuarios();
});