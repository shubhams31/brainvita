import { solutions } from './solutions.js';

// Helper function for analytics
function trackEvent(eventName, params) {
    if (typeof gtag !== 'undefined' && window.gameConfig && window.gameConfig.analytics) {
        gtag('event', eventName, {
            ...params,
            user_id: window.gameConfig.analytics.userEmail
        });
    }
}

export class BrainvitaGame {
    constructor() {
        this.board = this.createInitialBoard();
        this.selectedCell = null;
        this.moveHistory = [];
        this.validMoves = [];
        this.isPlayback = false;
        this.currentSolution = null;
        this.currentMoveIndex = 0;
        this.playbackInterval = null;
        this.initializeGame();
        this.initializeSolutionPlayer();
        
        // Log game start
        trackEvent('game_start', {
            'event_category': 'Game',
            'event_label': 'New game started'
        });
    }

    createInitialBoard() {
        const board = Array(7).fill().map(() => Array(7).fill(null));
        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 7; col++) {
                // Set invalid cells
                if ((row < 2 || row > 4) && (col < 2 || col > 4)) {
                    board[row][col] = 'invalid';
                } else {
                    // Set marbles
                    board[row][col] = 'marble';
                }
            }
        }
        // Set the center cell as empty
        board[3][3] = 'empty';
        return board;
    }

    initializeGame() {
        this.createBoardUI();
        this.setupEventListeners();
    }

    createBoardUI() {
        const boardElement = document.getElementById('board');
        boardElement.innerHTML = '';

        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 7; col++) {
                const cell = document.createElement('div');
                cell.className = `cell ${this.board[row][col]}`;
                cell.dataset.row = row;
                cell.dataset.col = col;
                boardElement.appendChild(cell);
            }
        }
    }

    setupEventListeners() {
        const boardElement = document.getElementById('board');
        boardElement.addEventListener('click', (e) => {
            const cell = e.target;
            if (cell.classList.contains('cell')) {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                this.handleCellClick(row, col);
            }
        });

        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('solutionsBtn').addEventListener('click', () => this.showSolutionsOverlay());
        document.getElementById('closeSolutionsBtn').addEventListener('click', () => this.hideSolutionsOverlay());
        document.getElementById('solutionSelect').addEventListener('change', (e) => this.handleSolutionSelect(e));
        document.getElementById('playBtn').addEventListener('click', () => this.playSolution());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pauseSolution());
        document.getElementById('stepBtn').addEventListener('click', () => this.stepSolution());
        document.getElementById('resetSolutionBtn').addEventListener('click', () => this.resetSolution());
        document.getElementById('speedRange').addEventListener('input', (e) => this.updatePlaybackSpeed(e));
    }

    handleCellClick(row, col) {
        // Don't allow moves if game is over
        if (this.isGameOver()) {
            return;
        }

        // Don't process clicks on invalid or out-of-bounds cells
        if (row < 0 || row >= 7 || col < 0 || col >= 7 || this.board[row][col] === 'invalid') {
            return;
        }

        if (this.selectedCell === null) {
            if (this.board[row][col] === 'marble') {
                this.selectedCell = { row, col };
                this.highlightCell(row, col);
                this.showValidMoves(row, col);
                
                // Check if the selected marble has any valid moves
                if (this.validMoves.length === 0) {
                    this.clearHighlights();
                    this.selectedCell = null;
                    this.checkGameOver();
                }
            }
        } else {
            const validMove = this.isValidMove(this.selectedCell.row, this.selectedCell.col, row, col);
            this.clearHighlights();
            
            if (validMove && !this.isGameOver()) {
                this.makeMove(this.selectedCell.row, this.selectedCell.col, row, col);
                this.checkGameOver();
            }
            
            this.selectedCell = null;
            this.validMoves = [];
        }
    }

    isValidMove(fromRow, fromCol, toRow, toCol) {
        // Check board boundaries
        if (toRow < 0 || toRow >= 7 || toCol < 0 || toCol >= 7) return false;
        if (fromRow < 0 || fromRow >= 7 || fromCol < 0 || fromCol >= 7) return false;

        if (this.board[toRow][toCol] !== 'empty') return false;
        
        const middleRow = (fromRow + toRow) / 2;
        const middleCol = (fromCol + toCol) / 2;
        
        if (!Number.isInteger(middleRow) || !Number.isInteger(middleCol)) return false;
        
        // Check middle position boundaries
        if (middleRow < 0 || middleRow >= 7 || middleCol < 0 || middleCol >= 7) return false;
        
        if (this.board[middleRow][middleCol] !== 'marble') return false;
        
        const rowDiff = Math.abs(fromRow - toRow);
        const colDiff = Math.abs(fromCol - toCol);
        
        return (rowDiff === 2 && colDiff === 0) || (rowDiff === 0 && colDiff === 2);
    }

    makeMove(fromRow, fromCol, toRow, toCol) {
        // Don't make moves if game is over
        if (this.isGameOver()) {
            return;
        }

        const middleRow = (fromRow + toRow) / 2;
        const middleCol = (fromCol + toCol) / 2;
        
        this.board[fromRow][fromCol] = 'empty';
        this.board[middleRow][middleCol] = 'empty';
        this.board[toRow][toCol] = 'marble';

        // Add move to history if not in playback mode
        if (!this.isPlayback) {
            this.moveHistory.push({
                from: { row: fromRow, col: fromCol },
                to: { row: toRow, col: toCol }
            });
            
            // Log move
            trackEvent('game_move', {
                'event_category': 'Game',
                'event_label': `Move from (${fromRow},${fromCol}) to (${toRow},${toCol})`,
                'value': this.moveHistory.length
            });
        }
        
        this.createBoardUI();
    }

    showValidMoves(row, col) {
        const directions = [
            [-2, 0], [2, 0], [0, -2], [0, 2]
        ];

        this.validMoves = [];
        
        for (const [dRow, dCol] of directions) {
            const newRow = row + dRow;
            const newCol = col + dCol;
            
            if (this.isValidMove(row, col, newRow, newCol)) {
                this.validMoves.push({ row: newRow, col: newCol });
                const cell = document.querySelector(`[data-row="${newRow}"][data-col="${newCol}"]`);
                cell.classList.add('valid-move');
            }
        }
    }

    highlightCell(row, col) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.classList.add('selected');
    }

    clearHighlights() {
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('selected', 'valid-move');
        });
    }

    isGameOver() {
        let hasValidMove = false;
        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 7; col++) {
                if (this.board[row][col] === 'marble') {
                    if (this.hasValidMovesFrom(row, col)) {
                        hasValidMove = true;
                        break;
                    }
                }
            }
            if (hasValidMove) break;
        }
        return !hasValidMove || this.hasWon();
    }

    hasValidMovesFrom(row, col) {
        const directions = [[-2, 0], [2, 0], [0, -2], [0, 2]];
        
        for (const [dRow, dCol] of directions) {
            const newRow = row + dRow;
            const newCol = col + dCol;
            
            // Check if the new position is within board boundaries
            if (newRow < 0 || newRow >= 7 || newCol < 0 || newCol >= 7) {
                continue;
            }
            
            // Check if the middle position is within board boundaries
            const middleRow = row + dRow/2;
            const middleCol = col + dCol/2;
            if (middleRow < 0 || middleRow >= 7 || middleCol < 0 || middleCol >= 7) {
                continue;
            }

            // Check if it's a valid move
            if (this.board[newRow][newCol] === 'empty' && 
                this.board[middleRow][middleCol] === 'marble' &&
                this.board[row][col] === 'marble') {
                return true;
            }
        }
        return false;
    }

    hasWon() {
        let marbleCount = 0;
        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 7; col++) {
                if (this.board[row][col] === 'marble') {
                    marbleCount++;
                }
            }
        }
        return marbleCount === 1;
    }

    resetGame() {
        this.board = this.createInitialBoard();
        this.selectedCell = null;
        this.moveHistory = [];
        this.validMoves = [];
        this.createBoardUI();
        document.getElementById('message').textContent = '';
        
        // Log game reset
        trackEvent('game_reset', {
            'event_category': 'Game',
            'event_label': 'Game reset'
        });
    }

    initializeSolutionPlayer() {
        const select = document.getElementById('solutionSelect');
        select.innerHTML = '<option value="">Select a solution...</option>';
        solutions.forEach((solution, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = solution.name;
            select.appendChild(option);
        });
    }

    showSolutionsOverlay() {
        document.getElementById('solutionsOverlay').style.display = 'block';
        trackEvent('show_solutions', {
            'event_category': 'Solutions',
            'event_label': 'Solutions overlay opened'
        });
    }

    hideSolutionsOverlay() {
        document.getElementById('solutionsOverlay').style.display = 'none';
    }

    handleSolutionSelect(event) {
        const index = event.target.value;
        if (index === '') {
            this.currentSolution = null;
            this.updatePlaybackControls(false);
        } else {
            this.currentSolution = solutions[index];
            this.resetSolution();
            this.updatePlaybackControls(true);
            trackEvent('select_solution', {
                'event_category': 'Solutions',
                'event_label': `Selected ${this.currentSolution.name}`
            });
        }
    }

    updatePlaybackControls(enabled) {
        document.getElementById('playBtn').disabled = !enabled;
        document.getElementById('pauseBtn').disabled = !enabled;
        document.getElementById('stepBtn').disabled = !enabled;
        document.getElementById('resetSolutionBtn').disabled = !enabled;
    }

    playSolution() {
        if (!this.currentSolution || this.playbackInterval) return;
        
        document.getElementById('playBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
        
        const speed = 6 - parseInt(document.getElementById('speedRange').value); // Invert scale for intuitive speed control
        this.playbackInterval = setInterval(() => {
            if (!this.stepSolution()) {
                this.pauseSolution();
            }
        }, speed * 500); // Speed ranges from 500ms to 2500ms

        trackEvent('play_solution', {
            'event_category': 'Solutions',
            'event_label': `Playing ${this.currentSolution.name}`
        });
    }

    pauseSolution() {
        if (this.playbackInterval) {
            clearInterval(this.playbackInterval);
            this.playbackInterval = null;
            document.getElementById('playBtn').disabled = false;
            document.getElementById('pauseBtn').disabled = true;

            trackEvent('pause_solution', {
                'event_category': 'Solutions',
                'event_label': `Paused at move ${this.currentMoveIndex}`
            });
        }
    }

    stepSolution() {
        if (!this.currentSolution || this.currentMoveIndex >= this.currentSolution.moves.length) {
            return false;
        }

        const move = this.currentSolution.moves[this.currentMoveIndex];
        this.isPlayback = true;
        this.makeMove(move.from[0], move.from[1], move.to[0], move.to[1]);
        this.isPlayback = false;
        this.currentMoveIndex++;

        if (this.currentMoveIndex >= this.currentSolution.moves.length) {
            trackEvent('solution_complete', {
                'event_category': 'Solutions',
                'event_label': `Completed ${this.currentSolution.name}`
            });
            return false;
        }
        return true;
    }

    resetSolution() {
        this.pauseSolution();
        this.resetGame();
        this.currentMoveIndex = 0;
        document.getElementById('playBtn').disabled = false;
        document.getElementById('stepBtn').disabled = false;
        document.getElementById('resetSolutionBtn').disabled = false;
    }

    updatePlaybackSpeed(event) {
        if (this.playbackInterval) {
            this.pauseSolution();
            this.playSolution();
        }
    }

    checkGameOver() {
        if (this.isGameOver()) {
            const hasWon = this.hasWon();
            const message = hasWon ? 'Congratulations! You won!' : 'Game Over! No more moves possible.';
            document.getElementById('message').textContent = message;
            
            // Log game end
            trackEvent('game_over', {
                'event_category': 'Game',
                'event_label': hasWon ? 'Won' : 'Lost',
                'value': this.moveHistory.length
            });
        }
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    new BrainvitaGame();
}); 