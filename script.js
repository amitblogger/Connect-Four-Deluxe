const GRID_WIDTH = 7;
const GRID_HEIGHT = 6;
const grid = Array(GRID_HEIGHT).fill().map(() => Array(GRID_WIDTH).fill(0));
let currentPlayer = 1;
let gameActive = false;
let player1Name = 'Player 1';
let player2Name = 'Player 2';
let player1Wins = 0;
let player2Wins = 0;
let player1Streak = 0;
let player2Streak = 0;
let gameMode = 'two-player';
let moveHistory = [];
let timerInterval;
let timeLeft = 30;

const dropSound = document.getElementById('drop-sound');
const winSound = document.getElementById('win-sound');
const drawSound = document.getElementById('draw-sound');

const startGameBtn = document.getElementById('start-game');
const setupScreen = document.getElementById('setup');
const gameContent = document.getElementById('game-content');
const player1Label = document.getElementById('player1-label');
const player2Label = document.getElementById('player2-label');
const player1ScoreEl = document.getElementById('player1-wins');
const player2ScoreEl = document.getElementById('player2-wins');
const player1StreakEl = document.getElementById('player1-streak');
const player2StreakEl = document.getElementById('player2-streak');
const player1ScoreBox = document.getElementById('player1-score');
const player2ScoreBox = document.getElementById('player2-score');
const resultText = document.getElementById('result-text');
const timerEl = document.getElementById('timer');
const undoMoveBtn = document.getElementById('undo-move');
const resetGameBtn = document.getElementById('reset-game');
const themeSwitch = document.getElementById('theme-switch');

const createGrid = () => {
    const gameGrid = document.getElementById('game-grid');
    gameGrid.innerHTML = '';
    for (let row = 0; row < GRID_HEIGHT; row++) {
        for (let col = 0; col < GRID_WIDTH; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.addEventListener('click', () => dropDisc(col));
            cell.addEventListener('mouseover', () => {
                if (gameActive) {
                    cell.style.cursor = 'pointer';
                    cell.classList.add(currentPlayer === 1 ? 'disc-player1' : 'disc-player2');
                }
            });
            cell.addEventListener('mouseout', () => {
                if (!grid[row][col]) {
                    cell.classList.remove('disc-player1', 'disc-player2');
                }
            });
            gameGrid.appendChild(cell);
        }
    }
};

const dropDisc = (col) => {
    if (!gameActive) return;
    clearInterval(timerInterval);
    for (let row = GRID_HEIGHT - 1; row >= 0; row--) {
        if (grid[row][col] === 0) {
            grid[row][col] = currentPlayer;
            const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
            cell.classList.add(currentPlayer === 1 ? 'disc-player1' : 'disc-player2');
            moveHistory.push({ row, col, player: currentPlayer });
            dropSound.play();
            if (checkWin(row, col)) {
                gameActive = false;
                endGame(`${currentPlayer === 1 ? player1Name : player2Name} wins!`);
                return;
            }
            if (checkDraw()) {
                gameActive = false;
                endGame('Draw!');
                return;
            }
            currentPlayer = currentPlayer === 1 ? 2 : 1;
            updateTurnIndicator();
            startTimer();
            if (gameMode !== 'two-player' && currentPlayer === 2) {
                setTimeout(aiMove, 1000);
            }
            return;
        }
    }
};

const checkWin = (row, col) => {
    const directions = [
        [0, 1], [1, 0], [1, 1], [1, -1]
    ];
    for (let [dr, dc] of directions) {
        let count = 1;
        let winningCells = [[row, col]];
        for (let i = 1; i < 4; i++) {
            const r = row + dr * i;
            const c = col + dc * i;
            if (r < 0 || r >= GRID_HEIGHT || c < 0 || c >= GRID_WIDTH || grid[r][c] !== currentPlayer) break;
            count++;
            winningCells.push([r, c]);
        }
        for (let i = 1; i < 4; i++) {
            const r = row - dr * i;
            const c = col - dc * i;
            if (r < 0 || r >= GRID_HEIGHT || c < 0 || c >= GRID_WIDTH || grid[r][c] !== currentPlayer) break;
            count++;
            winningCells.push([r, c]);
        }
        if (count >= 4) {
            winningCells.forEach(([r, c]) => {
                const cell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
                cell.classList.add('winning');
            });
            if (currentPlayer === 1) {
                player1Wins++;
                player1Streak++;
                player2Streak = 0;
            } else {
                player2Wins++;
                player2Streak++;
                player1Streak = 0;
            }
            player1ScoreEl.textContent = player1Wins;
            player2ScoreEl.textContent = player2Wins;
            player1StreakEl.textContent = player1Streak;
            player2StreakEl.textContent = player2Streak;
            winSound.play();
            return true;
        }
    }
    return false;
};

const checkDraw = () => {
    return grid.every(row => row.every(cell => cell !== 0));
};

const endGame = (message) => {
    resultText.textContent = message;
    clearInterval(timerInterval);
    if (message === 'Draw!') {
        drawSound.play();
    }
};

const updateTurnIndicator = () => {
    player1ScoreBox.classList.toggle('active', currentPlayer === 1);
    player2ScoreBox.classList.toggle('active', currentPlayer === 2);
};

const startTimer = () => {
    timeLeft = 30;
    timerEl.textContent = timeLeft;
    timerInterval = setInterval(() => {
        timeLeft--;
        timerEl.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            if (gameMode !== 'two-player' && currentPlayer === 2) {
                aiMove();
            } else {
                const col = Math.floor(Math.random() * GRID_WIDTH);
                dropDisc(col);
            }
        }
    }, 1000);
};

const aiMove = () => {
    if (!gameActive) return;
    let col;
    if (gameMode === 'ai-easy') {
        col = Math.floor(Math.random() * GRID_WIDTH);
        while (!canDrop(col)) {
            col = Math.floor(Math.random() * GRID_WIDTH);
        }
    } else {
        // Hard mode: Try to win or block
        for (let c = 0; c < GRID_WIDTH; c++) {
            if (canDrop(c)) {
                const row = getLowestRow(c);
                grid[row][c] = 2;
                if (checkWin(row, c)) {
                    grid[row][c] = 0;
                    col = c;
                    break;
                }
                grid[row][c] = 0;
            }
        }
        if (col === undefined) {
            for (let c = 0; c < GRID_WIDTH; c++) {
                if (canDrop(c)) {
                    const row = getLowestRow(c);
                    grid[row][c] = 1;
                    if (checkWin(row, c)) {
                        grid[row][c] = 0;
                        col = c;
                        break;
                    }
                    grid[row][c] = 0;
                }
            }
        }
        if (col === undefined) {
            col = Math.floor(Math.random() * GRID_WIDTH);
            while (!canDrop(col)) {
                col = Math.floor(Math.random() * GRID_WIDTH);
            }
        }
    }
    dropDisc(col);
};

const canDrop = (col) => {
    return grid[0][col] === 0;
};

const getLowestRow = (col) => {
    for (let row = GRID_HEIGHT - 1; row >= 0; row--) {
        if (grid[row][col] === 0) return row;
    }
    return -1;
};

const undoMove = () => {
    if (!gameActive || moveHistory.length === 0) return;
    const lastMove = moveHistory.pop();
    grid[lastMove.row][lastMove.col] = 0;
    const cell = document.querySelector(`.cell[data-row="${lastMove.row}"][data-col="${lastMove.col}"]`);
    cell.classList.remove('disc-player1', 'disc-player2');
    currentPlayer = lastMove.player === 1 ? 2 : 1;
    updateTurnIndicator();
    startTimer();
};

startGameBtn.addEventListener('click', () => {
    player1Name = document.getElementById('player1-name').value.trim() || 'Player 1';
    player2Name = document.getElementById('player2-name').value.trim() || 'AI';
    gameMode = document.getElementById('game-mode').value;
    player1Label.textContent = player1Name;
    player2Label.textContent = gameMode === 'two-player' ? player2Name : 'AI';
    setupScreen.style.display = 'none';
    gameContent.style.display = 'block';
    createGrid();
    gameActive = true;
    currentPlayer = 1;
    updateTurnIndicator();
    startTimer();
});

undoMoveBtn.addEventListener('click', undoMove);

resetGameBtn.addEventListener('click', () => {
    for (let row = 0; row < GRID_HEIGHT; row++) {
        for (let col = 0; col < GRID_WIDTH; col++) {
            grid[row][col] = 0;
        }
    }
    moveHistory = [];
    createGrid();
    gameActive = true;
    currentPlayer = 1;
    updateTurnIndicator();
    resultText.textContent = '';
    startTimer();
});

themeSwitch.addEventListener('change', () => {
    document.body.classList.remove('theme-classic', 'theme-neon', 'theme-cosmic');
    document.body.classList.add(`theme-${themeSwitch.value}`);
});
