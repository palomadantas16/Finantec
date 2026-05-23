document.addEventListener('DOMContentLoaded', () => {
    // --- Lógica da Animação do Painel ---
    const signUpButton = document.getElementById('signUp');
    const signInButton = document.getElementById('signIn');
    const container = document.getElementById('container');

    // --- CÓDIGO NOVO PARA VERIFICAR A URL ---
    // Verifica se a URL contém #cadastro quando a página carrega
    if (window.location.hash === '#cadastro') {
        container.classList.add('active');
    }
    // --- FIM DO CÓDIGO NOVO ---

    signUpButton.addEventListener('click', () => container.classList.add("active"));
    signInButton.addEventListener('click', () => container.classList.remove("active"));
    
    // --- Lógica da Chuva de Moedas ---
    const overlay = document.getElementById('overlay');
    function createCoin() {
      const coin = document.createElement("div");
      coin.classList.add("coin");
      coin.style.backgroundImage = "url('../img/moeda-brilhando-gigante.gif')";
      coin.style.left = Math.random() * overlay.offsetWidth + "px";
      coin.style.animationDuration = (Math.random() * 3 + 2) + "s";
      overlay.appendChild(coin);
      setTimeout(() => { coin.remove() }, 5000);
    }
    setInterval(createCoin, 150);


    // --- Lógica do Formulário de Cadastro ---
    const cadastroForm = document.getElementById('cadastroForm');
    cadastroForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = cadastroForm.querySelector('input[placeholder="Nome"]').value;
        const email = cadastroForm.querySelector('input[placeholder="Email"]').value;
        const senha = cadastroForm.querySelector('input[placeholder="Senha"]').value;

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, email, senha })
            });
            const data = await res.json();
            if (res.ok) {
                alert('Cadastro realizado com sucesso! Agora você pode fazer o login.');
                container.classList.remove("active"); // Volta para a tela de login
                cadastroForm.reset();
            } else {
                alert(data.message || 'Erro ao cadastrar');
            }
        } catch (error) {
            alert('Erro de conexão ao tentar cadastrar.');
        }
    });

    // --- Lógica do Formulário de Login ---
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginForm.querySelector('input[placeholder="Email"]').value;
        const senha = loginForm.querySelector('input[placeholder="Senha"]').value;
        
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });

            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('token', data.token);

                const perfilRes = await fetch('/api/auth/me', {
                    headers: { Authorization: `Bearer ${data.token}` }
                });
                const perfil = await perfilRes.json();

                if (!perfil.temFinanceiro) {
                    document.getElementById('onboardingOverlay').style.display = 'flex';
                } else {
                    const payload = JSON.parse(atob(data.token.split('.')[1]));
                    if (payload.tipo_usuario === 'administrador') {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'sistemaInicial.html';
                    }
                }
            } else {
                alert(data.message || 'Erro ao fazer login. Verifique suas credenciais.');
            }
        } catch (error) {
            alert('Erro de conexão ao tentar fazer login.');
        }
    });

    // --- Lógica do Formulário de Onboarding (o pop-up inicial) ---
    const onboardingForm = document.getElementById('onboardingForm');
    onboardingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const renda = document.getElementById('rendaInicial').value;
        const despesa = document.getElementById('despesaInicial').value;
        const objetivo = document.getElementById('objetivoInicial').value;
        const token = localStorage.getItem('token');

        try {
            const salvarRes = await fetch('/api/usuarios/financeiro', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ renda, despesa, objetivo })
            });

            if (salvarRes.ok) {
                window.location.href = 'sistemaInicial.html';
            } else {
                const errorData = await salvarRes.json();
                alert(`Erro ao salvar dados: ${errorData.message}`);
            }
        } catch(error) {
            alert('Erro de conexão ao salvar dados financeiros.');
        }
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const btnEsqueci = document.getElementById("btnEsqueciSenha");
    const modal = document.getElementById("modalRecuperacao");
    const btnFechar = document.getElementById("btnFecharRecuperacao");
    const formRecuperacao = document.getElementById("formRecuperacao");
    const msgRecuperacao = document.getElementById("msgRecuperacao");

    // Abrir Modal
    btnEsqueci.addEventListener("click", (e) => {
        e.preventDefault();
        modal.style.display = "flex";
        msgRecuperacao.innerText = ""; // Limpa mensagens antigas
    });

    // Fechar Modal
    btnFechar.addEventListener("click", () => {
        modal.style.display = "none";
    });

    // Fechar clicando fora
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });

    // Enviar solicitação para o Backend
    formRecuperacao.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("emailRecuperacao").value;
        const btnSubmit = formRecuperacao.querySelector("button[type='submit']");
        
        btnSubmit.innerText = "Enviando...";
        btnSubmit.disabled = true;

        try {
            const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                msgRecuperacao.style.color = "green";
                msgRecuperacao.innerText = "E-mail enviado! Verifique sua caixa de entrada.";
                formRecuperacao.reset();
            } else {
                msgRecuperacao.style.color = "red";
                msgRecuperacao.innerText = data.message || "Erro ao enviar.";
            }
        } catch (error) {
            msgRecuperacao.style.color = "red";
            msgRecuperacao.innerText = "Erro de conexão com o servidor.";
        } finally {
            btnSubmit.innerText = "Enviar Link";
            btnSubmit.disabled = false;
        }
    });
});