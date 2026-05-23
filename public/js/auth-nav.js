// js/auth-nav.js

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const loginButton = document.getElementById('loginButton');
    const userMenu = document.getElementById('userMenu');

    if (token) {
        // Se o usuário está logado
        if (loginButton) loginButton.style.display = 'none';
        if (userMenu) userMenu.style.display = 'block';

        try {
            // Busca os dados do usuário para exibir o nome
            const response = await fetch('http://localhost:5000/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const user = await response.json();
                const userNameEl = document.getElementById('userName');
                if (userNameEl) {
                    // Exibe apenas o primeiro nome
                    userNameEl.textContent = `${user.nome.split(' ')[0]} ▼`;
                }
            } else {
                // Se o token for inválido, limpa e recarrega a página
                localStorage.removeItem('token');
                window.location.reload();
            }

        } catch (error) {
            console.error('Erro ao buscar dados do usuário:', error);
            // Em caso de erro, desloga o usuário para segurança
            localStorage.removeItem('token');
        }

        // Adiciona funcionalidade ao botão de sair
        const logoutLink = document.getElementById('logoutLink');
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('token');
                window.location.href = '../html/homePage.html'; // Redireciona para a home após o logout
            });
        }

    } else {
        // Se o usuário NÃO está logado, garante que o estado inicial seja mantido
        if (loginButton) loginButton.style.display = 'block';
        if (userMenu) userMenu.style.display = 'none';
    }
});