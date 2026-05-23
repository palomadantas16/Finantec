document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../html/paginaLogin.html';
        return;
    }

    // =================================================================================
    // 1. ESTADO GLOBAL E DADOS DOS JOGOS
    // =================================================================================
    let state = {
        level: 1,
        coins: 100,
        username: 'Jogador',
        avatar_url: null
    };
    let quizLevels = {};
    let forcaWords = [];
    let maxQuizLevel = 0;

    // =================================================================================
    // 2. SELETORES DE ELEMENTOS DA UI
    // =================================================================================
    const elements = {
        coinsPill: document.getElementById('coins-pill')?.querySelector('span'),
        levelPill: document.getElementById('level-pill'),
        homeCoins: document.getElementById('home-coins'),
        homeLevel: document.getElementById('home-level'),
        modalProfile: document.getElementById('modal-profile'),
        modalUsername: document.getElementById('modal-username'),
        modalLevel: document.getElementById('modal-level'),
        modalCoins: document.getElementById('modal-coins')?.querySelector('span'),
        openProfileBtn: document.getElementById('open-profile'),
        backToStartBtn: document.getElementById('back-to-start-btn'),
        logoutButton: document.getElementById('logout-button'),
        navBtns: document.querySelectorAll('.nav-btn'),
        sections: document.querySelectorAll('.section')
    };

    // =================================================================================
    // 3. LÓGICA DE API E SINCRONIZAÇÃO COM O BACKEND
    // =================================================================================
    const apiRequest = async (url, options = {}) => {
        const baseUrl = 'http://localhost:5000';
        const defaultOptions = {
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        };
        const res = await fetch(baseUrl + url, { ...defaultOptions, ...options });
        if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
                localStorage.removeItem('token');
                window.location.href = '../html/paginaLogin.html';
            }
            const err = await res.json();
            throw new Error(err.message || 'Erro na requisição');
        }
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return res.json();
        }
        return null;
    };

    async function saveState() {
        renderState();
        try {
            await apiRequest('/api/game/progress', {
                method: 'PUT',
                body: JSON.stringify({ level: state.level, coins: state.coins })
            });
        } catch (error) {
            console.error("Erro ao salvar progresso:", error);
        }
    }

    function renderState() {
        const coins = Number.isInteger(state.coins) ? state.coins : 100;
        const level = Number.isInteger(state.level) ? state.level : 1;

        if (elements.coinsPill) elements.coinsPill.textContent = coins;
        if (elements.levelPill) elements.levelPill.textContent = `Nível ${level}`;
        if (elements.homeCoins) elements.homeCoins.textContent = coins;
        if (elements.homeLevel) elements.homeLevel.textContent = level;
        
        if (elements.modalUsername) elements.modalUsername.textContent = `Olá, ${state.username}`;
        if (elements.modalLevel) elements.modalLevel.textContent = `Nível ${level}`;
        if (elements.modalCoins) elements.modalCoins.textContent = coins;

        if (elements.openProfileBtn) {
            if (state.avatar_url) {
                const baseUrl = 'http://localhost:5000';
                elements.openProfileBtn.innerHTML = `<img src="${baseUrl}/${state.avatar_url}" alt="Avatar" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
            } else {
                elements.openProfileBtn.textContent = state.username.charAt(0).toUpperCase();
            }
        }
    }

    async function carregarDadosIniciais() {
        try {
            const [progress, gameContent, userData] = await Promise.all([
                apiRequest('/api/game/progress'),
                apiRequest('/api/game/content'),
                apiRequest('/api/auth/me')
            ]);
            
            state.coins = progress.coins ?? 100;
            state.level = progress.level ?? 1;
            state.username = userData.nome;
            state.avatar_url = userData.avatar_url;

            quizLevels = gameContent.quiz;
            maxQuizLevel = Object.keys(quizLevels).map(Number).reduce((a, b) => Math.max(a, b), 0);
            forcaWords = gameContent.forca.map(item => ({ word: item.word.toUpperCase(), hint: item.hint }));

            renderState();

            setupQuiz();
            setupForca();
            setupSnake();

        } catch (error) {
            console.error("Erro fatal ao carregar dados do jogo:", error);
            renderState();
            document.body.innerHTML += `<div style="position:fixed; top:10px; left:10px; background:red; color:white; padding:10px; z-index:1000;">Erro ao carregar dados. Tente recarregar.</div>`;
        }
    }

    // =================================================================================
    // 4. LÓGICA DE NAVEGAÇÃO E UI GERAL
    // =================================================================================
    function showSection(id) {
        elements.sections.forEach(s => s.classList.remove('active'));
        document.getElementById(id)?.classList.add('active');
        elements.navBtns.forEach(b => b.classList.remove('active'));
        document.querySelector(`.nav-btn[data-target="${id}"]`)?.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    elements.navBtns.forEach(btn => btn.addEventListener('click', () => showSection(btn.dataset.target)));
    document.querySelectorAll('[data-nav]').forEach(el => el.addEventListener('click', () => showSection(el.dataset.nav)));
    function toggleModal(modal, show) { if (!modal) return; modal.classList.toggle('show', show); }
    elements.openProfileBtn?.addEventListener('click', () => toggleModal(elements.modalProfile, true));
    document.querySelectorAll('.modal .close').forEach(b => b.addEventListener('click', (e) => toggleModal(e.target.closest('.modal'), false)));
    elements.backToStartBtn?.addEventListener('click', () => { window.location.href = '../html/sistemaInicial.html'; });
    elements.logoutButton?.addEventListener('click', () => { if (confirm('Tem certeza que deseja sair?')) { localStorage.removeItem('token'); window.location.href = '../html/home.html'; } });
    function showOverlay(id) { document.getElementById(id)?.classList.add('show'); }
    function hideOverlay(id) { document.getElementById(id)?.classList.remove('show'); }
    document.getElementById('win-continue-btn')?.addEventListener('click', () => hideOverlay('win-overlay'));
    document.getElementById('fail-retry-btn')?.addEventListener('click', () => { hideOverlay('fail-overlay'); });

    // =================================================================================
    // 5. LÓGICA DO JOGO: QUIZ
    // =================================================================================
    function setupQuiz() {
        const quizContent = document.getElementById('quiz-content');
        const qIndexEl = document.getElementById('q-index');
        const qTotalEl = document.getElementById('q-total');
        const progressFill = document.getElementById('progress-fill');
        const levelLabel = document.getElementById('level-label');
        const hintBtn = document.getElementById('quiz-hint');
        const completionScreen = document.getElementById('quiz-completion');
        const questionArea = document.getElementById('quiz-question-area');
        
        let quizIndex = 0;
        let correctAnswers = 0;
        let currentQuestions = [];
        let hintUsed = false;

        function startQuizAtLevel(level) {
            if (!quizLevels || Object.keys(quizLevels).length === 0) {
                questionArea.style.display = 'block';
                completionScreen.style.display = 'none';
                quizContent.innerHTML = '<h3>Carregando perguntas...</h3>';
                return;
            }
            
            if (level > maxQuizLevel || !quizLevels[level]) {
                showCompletionScreen();
                return;
            }

            completionScreen.style.display = 'none';
            questionArea.style.display = 'block';
            document.getElementById('progress-bar-container').style.display = 'block';
            
            currentQuestions = quizLevels[level];
            quizIndex = 0;
            correctAnswers = 0;
            renderQuestion();
        }

        function renderQuestion() {
            if (!currentQuestions || !currentQuestions[quizIndex]) return;
            hintUsed = false;
            const q = currentQuestions[quizIndex];
            qIndexEl.textContent = quizIndex + 1;
            qTotalEl.textContent = currentQuestions.length;
            progressFill.style.width = `${((quizIndex + 1) / currentQuestions.length) * 100}%`;
            levelLabel.textContent = `Quiz - Nível ${state.level}`;
            quizContent.innerHTML = `<h3>${q.q}</h3><div class="options">${q.options.map((opt, i) => `<div class="opt" data-index="${i}">${opt}</div>`).join('')}</div>`;
            quizContent.querySelectorAll('.opt').forEach(optEl => optEl.addEventListener('click', () => handleQuizAnswer(optEl)));
        }

        function handleQuizAnswer(optEl) {
            const selected = parseInt(optEl.dataset.index);
            const q = currentQuestions[quizIndex];
            quizContent.querySelectorAll('.opt').forEach(o => o.style.pointerEvents = 'none');
            if (selected === q.correct) {
                optEl.classList.add('correct');
                correctAnswers++;
            } else {
                optEl.classList.add('wrong');
                quizContent.querySelector(`.opt[data-index="${q.correct}"]`)?.classList.add('correct');
            }
            setTimeout(nextQuestion, 1500);
        }
        
        function nextQuestion() {
            quizIndex++;
            (quizIndex < currentQuestions.length) ? renderQuestion() : endQuiz();
        }

        function endQuiz() {
            if (correctAnswers >= (currentQuestions.length * 0.8)) {
                const previousLevelPoints = quizLevels[state.level]?.[0]?.points || 20;
                state.coins += previousLevelPoints;
                if(state.level <= maxQuizLevel) {
                    state.level++;
                }
                saveState();
                showOverlay("win-overlay");
                setTimeout(() => {
                    hideOverlay("win-overlay");
                    startQuizAtLevel(state.level);
                }, 2000);
            } else {
                showOverlay("fail-overlay");
            }
        }
        
        function showCompletionScreen() {
            completionScreen.style.display = 'block';
            questionArea.style.display = 'none';
            document.getElementById('progress-bar-container').style.display = 'none';
            levelLabel.textContent = 'Quiz Completo!';
        }
        
        document.getElementById('restart-quiz')?.addEventListener('click', () => {
            state.level = 1;
            saveState();
            startQuizAtLevel(1);
        });
        
        document.getElementById('fail-retry-btn')?.addEventListener('click', () => {
             startQuizAtLevel(state.level);
        });
        
        hintBtn?.addEventListener('click', () => {
            if (hintUsed) return;
            if (state.coins < 50) { alert("Moedas insuficientes!"); return; }
            state.coins -= 50;
            saveState();
            const q = currentQuestions[quizIndex];
            const wrongOptions = q.options.map((_, i) => i).filter(i => i !== q.correct);
            const toRemove = wrongOptions.sort(() => 0.5 - Math.random()).slice(0, 2);
            toRemove.forEach(idx => {
                const opt = quizContent.querySelector(`.opt[data-index="${idx}"]`);
                if(opt) opt.style.display = 'none';
            });
            hintUsed = true;
        });

        // Botões de navegação Anterior/Próximo
        document.getElementById('quiz-prev')?.addEventListener('click', () => {
            if (quizIndex > 0) {
                quizIndex--;
                renderQuestion();
            }
        });

        document.getElementById('quiz-next')?.addEventListener('click', () => {
            if (quizIndex < currentQuestions.length - 1) {
                quizIndex++;
                renderQuestion();
            }
        });

        startQuizAtLevel(state.level);
    }

    // =================================================================================
    // 6. LÓGICA DO JOGO: FORCA
    // =================================================================================
    function setupForca() {
        const challengeWordEl = document.getElementById('challenge-word');
        const challengeTriesEl = document.getElementById('challenge-tries');
        const challengeKeyboard = document.getElementById('challenge-keyboard');
        const challengeHint = document.getElementById('challenge-hint');
        const challengeRestart = document.getElementById('challenge-restart');
        const forcaSection = document.getElementById('desafio');
        let secret = '';
        let revealed = [];
        let tries = 6;
        let gameEnded = false;
        let hintUsedForca = false;
        
        function startChallenge() {
            if (forcaWords.length === 0) return;
            gameEnded = false;
            hintUsedForca = false;
            const challenge = forcaWords[Math.floor(Math.random() * forcaWords.length)];
            secret = challenge.word;
            revealed = Array(secret.length).fill('_');
            tries = 6;
            renderChallenge();
            buildKeyboard();
            challengeHint.disabled = false;
            challengeHint.textContent = '💡 Dica (50)';
        }

        function renderChallenge() {
            challengeWordEl.textContent = revealed.join(' ');
            challengeTriesEl.textContent = 'Tentativas restantes: ' + tries;
        }

        function buildKeyboard() {
            challengeKeyboard.innerHTML = '';
            'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(l => {
                const b = document.createElement('button');
                b.textContent = l;
                b.addEventListener('click', () => handleGuess(l, b));
                challengeKeyboard.appendChild(b);
            });
        }

        function handleGuess(letter, btn) {
            if (gameEnded || !btn || btn.disabled) return;
            btn.disabled = true;
            let found = secret.includes(letter);
            if (found) {
                for (let i = 0; i < secret.length; i++) {
                    if (secret[i] === letter) revealed[i] = letter;
                }
            } else {
                tries--;
            }
            renderChallenge();
            if (!revealed.includes('_')) {
                gameEnded = true;
                state.coins += 50;
                saveState();
                setTimeout(() => {
                    alert('Parabéns! Palavra: ' + secret + '\n+50 moedas!');
                    startChallenge();
                }, 300);
            } else if (tries <= 0) {
                gameEnded = true;
                setTimeout(() => {
                    alert('Fim de jogo! A palavra era: ' + secret);
                    startChallenge();
                }, 300);
            }
        }
        
        // Event listener da DICA DO JOGO DA FORCA
        challengeHint?.addEventListener('click', () => {
            if (gameEnded) return;
            if (hintUsedForca) {
                alert("Você já usou a dica nesta palavra!");
                return;
            }
            if (state.coins < 50) {
                alert("Moedas insuficientes! Você precisa de 50 moedas para usar a dica.");
                return;
            }
            
            // Encontra todas as letras ainda não reveladas
            const hiddenIndexes = [];
            for (let i = 0; i < revealed.length; i++) {
                if (revealed[i] === '_') {
                    hiddenIndexes.push(i);
                }
            }
            
            // Se ainda tem letras escondidas, revela uma aleatória
            if (hiddenIndexes.length > 0) {
                const randomIndex = hiddenIndexes[Math.floor(Math.random() * hiddenIndexes.length)];
                revealed[randomIndex] = secret[randomIndex];
                
                state.coins -= 50;
                saveState();
                renderChallenge();
                
                // Desabilita as letras já reveladas no teclado
                const revealedLetter = secret[randomIndex];
                const keyButton = Array.from(challengeKeyboard.children).find(btn => btn.textContent === revealedLetter);
                if (keyButton) {
                    keyButton.disabled = true;
                }
                
                // Verifica se ganhou após a dica
                if (!revealed.includes('_')) {
                    gameEnded = true;
                    state.coins += 50;
                    saveState();
                    setTimeout(() => {
                        alert('Parabéns! Palavra: ' + secret + '\n+50 moedas!');
                        startChallenge();
                    }, 300);
                }
            }
            
            hintUsedForca = true;
            challengeHint.disabled = true;
            challengeHint.textContent = '💡 Dica usada';
        });
        
        challengeRestart?.addEventListener('click', startChallenge);
        
        document.addEventListener('keydown', (e) => {
            if (!forcaSection.classList.contains('active')) return;
            const letter = e.key.toUpperCase();
            if (letter.length === 1 && letter >= 'A' && letter <= 'Z') {
                const keyButton = Array.from(challengeKeyboard.children).find(btn => btn.textContent === letter);
                if (keyButton && !keyButton.disabled) {
                    handleGuess(letter, keyButton);
                }
            }
        });

        startChallenge();
    }
    
    // =================================================================================
    // 7. LÓGICA DO JOGO: SNAKE MONEY
    // =================================================================================
    function setupSnake() {
        const canvas = document.getElementById("game");
        if (!canvas) return;
        
        const ctx = canvas.getContext("2d");
        const tileCount = 15;
        const tileSize = canvas.width / tileCount; 
        
        let snake, direction, food, score, coins, highScore = 0;
        let gameInterval, speed = 150, paused = false;
        
        const startPopup = document.getElementById("startPopup");
        const gameOverPopup = document.getElementById("gameOverPopup");
        const pauseIndicator = document.getElementById("pauseIndicator");

        function gameOver() {
            clearInterval(gameInterval);
            state.coins += coins;
            saveState();
            document.getElementById("finalScore").textContent = score;
            document.getElementById("finalCoins").textContent = coins;
            if (score > highScore) {
                highScore = score;
                document.getElementById("recordMessage").textContent = "NOVO RECORDE! 🎉";
            } else {
                document.getElementById("recordMessage").textContent = `Seu recorde é ${highScore} pontos.`;
            }
            gameOverPopup.style.display = "block";
            updateScoreboard();
        }
        
        function updateScoreboard() {
            document.getElementById("score").textContent = score;
            document.getElementById("coins").textContent = state.coins;
            document.getElementById("highScore").textContent = highScore;
        }

        function drawSnake() {
            snake.forEach((segment, i) => {
                const gradient = ctx.createRadialGradient(
                    segment.x * tileSize + tileSize / 2, 
                    segment.y * tileSize + tileSize / 2, 
                    0,
                    segment.x * tileSize + tileSize / 2, 
                    segment.y * tileSize + tileSize / 2, 
                    tileSize / 2
                );
                
                if (i === 0) {
                    gradient.addColorStop(0, "#4caf50");
                    gradient.addColorStop(1, "#388e3c");
                } else {
                    gradient.addColorStop(0, "#66bb6a");
                    gradient.addColorStop(1, "#43a047");
                }
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(
                    segment.x * tileSize + tileSize / 2, 
                    segment.y * tileSize + tileSize / 2, 
                    tileSize / 2 - 2, 
                    0, 
                    Math.PI * 2
                );
                ctx.fill();

                if (i === 0) {
                    ctx.strokeStyle = "#fff";
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    const eyeRadius = tileSize / 10;
                    const pupilRadius = tileSize / 20;
                    const leftEyeX = segment.x * tileSize + tileSize / 3;
                    const rightEyeX = segment.x * tileSize + 2 * tileSize / 3;
                    const eyeY = segment.y * tileSize + tileSize / 3;

                    ctx.fillStyle = "white";
                    ctx.beginPath();
                    ctx.arc(leftEyeX, eyeY, eyeRadius, 0, Math.PI * 2);
                    ctx.arc(rightEyeX, eyeY, eyeRadius, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = "#2a3a2a";
                    ctx.beginPath();
                    let dx = direction ? direction.x : 0;
                    let dy = direction ? direction.y : 0;
                    ctx.arc(leftEyeX + (dx * 1), eyeY + (dy * 1), pupilRadius, 0, Math.PI * 2);
                    ctx.arc(rightEyeX + (dx * 1), eyeY + (dy * 1), pupilRadius, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
        }

        function drawFood() {
            const centerX = food.x * tileSize + tileSize / 2;
            const centerY = food.y * tileSize + tileSize / 2;
            const radius = tileSize / 2 - 4;

            const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
            gradient.addColorStop(0, "#FFD700");
            gradient.addColorStop(0.7, "#FFA500");
            gradient.addColorStop(1, "#FFD700");

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = "#DAA520";
            ctx.font = `bold ${tileSize/2}px "Press Start 2P"`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("$", centerX, centerY + 2);
        }
        
        function keyDown(e) {
            if(gameInterval) {
                if ((e.key === "ArrowUp" || e.key.toLowerCase() === "w") && direction.y === 0) { direction = {x:0, y:-1}; } 
                else if ((e.key === "ArrowDown" || e.key.toLowerCase() === "s") && direction.y === 0) { direction = {x:0, y:1}; } 
                else if ((e.key === "ArrowLeft" || e.key.toLowerCase() === "a") && direction.x === 0) { direction = {x:-1, y:0}; } 
                else if ((e.key === "ArrowRight" || e.key.toLowerCase() === "d") && direction.x === 0) { direction = {x:1, y:0}; } 
                else if (e.key === " ") { e.preventDefault(); paused = !paused; pauseIndicator.style.display = paused ? "block" : "none"; }
            }
        }
        function startGame() { startPopup.style.display = "none"; speed = parseInt(document.getElementById("speedSelect").value); resetGame(); gameInterval = setInterval(gameLoop, speed); }
        function restartGame() { gameOverPopup.style.display = "none"; speed = parseInt(document.getElementById("speedSelectGameOver").value); resetGame(); gameInterval = setInterval(gameLoop, speed); }
        function backToMenu() { gameOverPopup.style.display = "none"; startPopup.style.display = "block"; clearInterval(gameInterval); gameInterval = null; }
        function resetGame() { snake = [{x:7, y:7}]; direction = {x:0, y:0}; score = 0; coins = 0; paused = false; pauseIndicator.style.display = "none"; placeFood(); updateScoreboard(); drawGame(); }
        function placeFood() { let valid; do { food = { x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount) }; valid = !snake.some(s => s.x === food.x && s.y === food.y); } while(!valid); }
        function gameLoop() { if (paused) return; moveSnake(); if (checkCollision()) return gameOver(); drawGame(); }
        function moveSnake() { if (direction.x === 0 && direction.y === 0) return; const head = {x: snake[0].x + direction.x, y: snake[0].y + direction.y}; snake.unshift(head); if (eatFood()) { score += 10; coins++; updateScoreboard(); placeFood(); } else { snake.pop(); } }
        function eatFood() { return snake[0].x === food.x && snake[0].y === food.y; }
        function checkCollision() { const head = snake[0]; if (head.x < 0 || head.y < 0 || head.x >= tileCount || head.y >= tileCount) return true; for (let i = 1; i < snake.length; i++) if (snake[i].x === head.x && snake[i].y === head.y) return true; return false; }
        function drawGame() { drawBoard(); drawSnake(); drawFood(); }
        function drawBoard(){ for (let y=0; y<tileCount; y++) for (let x=0; x<tileCount; x++) { ctx.fillStyle = (x+y)%2===0 ? "#2a3a2a" : "#1f2f1f"; ctx.fillRect(x*tileSize, y*tileSize, tileSize, tileSize); } }

        document.addEventListener("keydown", keyDown);
        document.getElementById('start-snake-btn').addEventListener('click', startGame);
        document.getElementById('restart-snake-btn').addEventListener('click', restartGame);
        document.getElementById('menu-snake-btn').addEventListener('click', backToMenu);
        startPopup.style.display = "block";
    }
    
    // =================================================================================
    // 8. INICIALIZAÇÃO
    // =================================================================================
    carregarDadosIniciais();
});