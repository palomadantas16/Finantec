document.addEventListener('DOMContentLoaded', function() {
    
    // Função para controlar a visibilidade e o texto do botão de login/perfil
    function atualizarBotaoLogin() {
        const loginButtonLink = document.querySelector('.loginB a');
        if (!loginButtonLink) return; // Se o botão não existir na página, não faz nada

        const token = localStorage.getItem('token'); // Vamos usar o token como indicador de login

        if (token) {
            // --- USUÁRIO ESTÁ LOGADO ---
            loginButtonLink.textContent = 'Meu Perfil';
            loginButtonLink.href = '../html/sistemaInicial.html';
            
            // Oculta qualquer outro botão de cadastro que possa existir
            const outroBotaoCadastro = document.querySelector('.seu-outro-botao-de-cadastro'); // Use a classe correta aqui
            if (outroBotaoCadastro) {
                outroBotaoCadastro.style.display = 'none';
            }

        } else {
            // --- USUÁRIO NÃO ESTÁ LOGADO ---
            loginButtonLink.textContent = 'Login';
            loginButtonLink.href = '../html/loginCadastroNOVO.html';
        }
    }

    // Função para carregar conteúdos dinâmicos do banco (se houver)
    async function carregarConteudosDaPagina() {
        const pagina = document.body.dataset.pagina;
        if (!pagina) return;

        try {
            const response = await fetch(`http://localhost:5000/api/conteudos/${pagina}`);
            if (!response.ok) {
                throw new Error('Falha ao carregar conteúdo da página.');
            }
            const conteudos = await response.json();
            
            conteudos.forEach(item => {
                const elementoTitulo = document.getElementById(`${item.secao}-titulo`);
                const elementoTexto = document.getElementById(`${item.secao}-texto`);

                if (elementoTitulo) {
                    elementoTitulo.innerHTML = item.titulo;
                }
                if (elementoTexto) {
                    elementoTexto.innerHTML = item.texto;
                }
            });
        } catch (error) {
            console.error('Erro:', error);
        }
    }

    // --- EXECUÇÃO DAS FUNÇÕES ---
    atualizarBotaoLogin();
    carregarConteudosDaPagina();

});