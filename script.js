export class BrainvitaGame {
    constructor() {
        this.board = this.createInitialBoard();
        this.selectedCell = null;
        this.moveHistory = [];
        this.validMoves = [];
        this.isPlayback = false;
        this.initializeGame();
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
        document.getElementById('playbackBtn').addEventListener('click', () => this.playbackMoves());
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
    }

    async playbackMoves() {
        if (this.moveHistory.length === 0) {
            return;
        }

        this.isPlayback = true;
        const originalBoard = this.board.map(row => [...row]);
        const originalMoveHistory = [...this.moveHistory];
        
        this.resetGame();
        
        try {
            for (const move of originalMoveHistory) {
                // Safely get DOM elements
                const sourceCell = document.querySelector(`[data-row="${move.from.row}"][data-col="${move.from.col}"]`);
                const targetCell = document.querySelector(`[data-row="${move.to.row}"][data-col="${move.to.col}"]`);
                const board = document.querySelector('.board');
                
                // Only perform DOM operations if elements exist
                if (sourceCell && targetCell && board) {
                    sourceCell.classList.add('playback-source');
                    targetCell.classList.add('playback-target');
                    
                    // Create and position the animated marble
                    const marble = document.createElement('div');
                    marble.className = 'marble-animation';
                    board.appendChild(marble);
                    
                    // Get positions for animation
                    const sourceBounds = sourceCell.getBoundingClientRect();
                    const targetBounds = targetCell.getBoundingClientRect();
                    const boardBounds = board.getBoundingClientRect();
                    
                    // Set initial position
                    marble.style.left = `${sourceBounds.left - boardBounds.left}px`;
                    marble.style.top = `${sourceBounds.top - boardBounds.top}px`;
                    
                    // Trigger animation
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    marble.style.left = `${targetBounds.left - boardBounds.left}px`;
                    marble.style.top = `${targetBounds.top - boardBounds.top}px`;
                    
                    // Wait for animation to complete
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // Remove the animated marble
                    marble.remove();
                }
                
                // Make the actual move (this updates the game state)
                this.makeMove(move.from.row, move.from.col, move.to.row, move.to.col);
                
                // Only perform DOM operations if elements exist
                if (sourceCell && targetCell) {
                    // Add pulse animation to removed marble
                    const middleRow = (move.from.row + move.to.row) / 2;
                    const middleCol = (move.from.col + move.to.col) / 2;
                    const middleCell = document.querySelector(`[data-row="${middleRow}"][data-col="${middleCol}"]`);
                    
                    if (middleCell) {
                        middleCell.classList.add('pulse');
                        sourceCell.classList.remove('playback-source');
                        targetCell.classList.remove('playback-target');
                        
                        await new Promise(resolve => setTimeout(resolve, 500));
                        middleCell.classList.remove('pulse');
                    }
                }
            }
        } finally {
            this.isPlayback = false;
        }
    }

    checkGameOver() {
        if (this.isGameOver()) {
            const message = this.hasWon() ? 'Congratulations! You won!' : 'Game Over! No more moves possible.';
            document.getElementById('message').textContent = message;
        }
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    new BrainvitaGame();
}); 