(async () => {
  try {
    const res = await fetch('/api/conteudos/public');
    const data = await res.json();
    if (data) {
      const h = document.querySelector('.conteudoh1');
      const p = document.querySelector('.conteudop');
      if (h) h.textContent = data.titulo || '';
      if (p) p.textContent = data.texto || '';
    }
  } catch (e) {
    console.error('Falha ao carregar conteúdo público:', e);
  }
})();
