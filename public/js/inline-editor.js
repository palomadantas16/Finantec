// js/inline-editor.js (Versão Final Corrigida)
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const editableContainer = document.querySelector('[data-editable-container]');
    if (!editableContainer) return;

    const pageName = editableContainer.dataset.pageName;
    
    function enableEditing() {
        const elementsToEdit = editableContainer.querySelectorAll('h1, h2, h3, h4, p, strong, a.btn, a.cta');
        elementsToEdit.forEach(el => {
            el.contentEditable = true;
            el.classList.add('editable-text');
        });
        showEditingControls();
    }

    function showEditingControls() {
        if (document.getElementById('editor-controls')) return;
        const controls = document.createElement('div');
        controls.id = 'editor-controls';
        controls.innerHTML = `<button id="save-btn">Salvar Alterações</button><button id="cancel-btn">Cancelar</button>`;
        document.body.appendChild(controls);
        document.getElementById('save-btn').addEventListener('click', saveContent);
        document.getElementById('cancel-btn').addEventListener('click', () => window.location.reload());
    }

    async function saveContent() {
        const contentId = editableContainer.dataset.contentId;
        if (!contentId) {
            alert('Erro: ID do conteúdo não encontrado.');
            return;
        }

        let payload;

        // --- LÓGICA ESPECIAL PARA A HOME PAGE ---
        if (pageName === 'home') {
            const titulo = document.getElementById('titulo-pagina').innerHTML;
            const texto = document.getElementById('texto-pagina').innerHTML;
            payload = { id_conteudo: contentId, pagina: pageName, titulo: titulo, texto: texto };
        } else {
        // --- LÓGICA PARA TODAS AS OUTRAS PÁGINAS ---
            editableContainer.querySelectorAll('.editable-text').forEach(el => {
                el.contentEditable = false;
                el.classList.remove('editable-text');
            });
            const updatedHTML = editableContainer.innerHTML;
            payload = { id_conteudo: contentId, pagina: pageName, titulo: document.title, texto: updatedHTML };
        }

        try {
            const res = await fetch('/api/conteudos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            if (!res.ok) { const err = await res.json(); throw new Error(err.message); }
            alert('Página salva com sucesso!');
            window.location.reload();
        } catch (error) {
            alert('Falha ao salvar: ' + error.message);
            enableEditing();
        }
    }
    
    enableEditing();
});