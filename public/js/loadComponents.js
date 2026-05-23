// Conteúdo de js/loadComponents.js

document.addEventListener("DOMContentLoaded", function() {
    // Carrega a barra lateral
    fetch('../html/sidebar.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('sidebar-container').innerHTML = data;
            
            // Após carregar, executa a função para marcar o link ativo
            setActiveLink();

            // Adiciona a funcionalidade de dropdown após o conteúdo ser carregado
            setupDropdown();
        })
        .catch(error => console.error('Erro ao carregar a barra lateral:', error));
});

function setActiveLink() {
    // Pega o nome do arquivo da URL atual (ex: "sistemaInicial.html")
    const currentPage = window.location.pathname.split('/').pop();

    // Seleciona todos os links da barra de navegação principal (não os do dropdown)
    const navLinks = document.querySelectorAll('.sidebar nav > a');

    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href').split('/').pop();
        
        // Compara o href do link com a página atual
        if (linkPage === currentPage) {
            link.classList.add('active');
        }
    });
}

function setupDropdown() {
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    const dropdown = document.querySelector('.dropdown');
    
    if (dropdownToggle && dropdown) {
        dropdownToggle.addEventListener('click', () => {
            dropdown.classList.toggle('open');
        });

        // Opcional: fechar o dropdown se clicar fora dele
        document.addEventListener('click', (event) => {
            if (!dropdown.contains(event.target)) {
                dropdown.classList.remove('open');
            }
        });
    }
}