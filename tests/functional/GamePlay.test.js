import { BrainvitaGame } from '../../script.js';

describe('Brainvita Game Play', () => {
    let game;

    beforeEach(() => {
        // Reset the DOM
        document.body.innerHTML = `
            <div class="container">
                <div id="board" class="board"></div>
                <div id="message" class="message"></div>
                <div class="controls">
                    <button id="resetBtn">Reset Game</button>
                    <button id="solutionsBtn">Show Solutions</button>
                </div>
                <div id="solutionsOverlay" class="overlay">
                    <div class="overlay-content">
                        <select id="solutionSelect"></select>
                        <div class="playback-controls">
                            <button id="playBtn">Play</button>
                            <button id="pauseBtn">Pause</button>
                            <button id="stepBtn">Step</button>
                            <button id="resetSolutionBtn">Reset</button>
                        </div>
                        <input type="range" id="speedRange" min="1" max="5" value="3">
                        <button id="closeSolutionsBtn">&times;</button>
                    </div>
                </div>
            </div>
        `;
        game = new BrainvitaGame();
    });

    describe('Player Interactions', () => {
        test('should select marble on click', () => {
            // Find a valid marble cell
            const marbleCell = document.querySelector('[data-row="3"][data-col="1"]');
            marbleCell.click();

            // Check if the cell is selected
            expect(marbleCell.classList.contains('selected')).toBe(true);
            expect(game.selectedCell).toEqual({ row: 3, col: 1 });
        });

        test('should show valid moves when marble is selected', () => {
            // Select a marble that has valid moves
            const marbleCell = document.querySelector('[data-row="3"][data-col="1"]');
            marbleCell.click();

            // Check if valid moves are highlighted
            const validMoveCell = document.querySelector('[data-row="3"][data-col="3"]');
            expect(validMoveCell.classList.contains('valid-move')).toBe(true);
        });

        test('should make valid move when target cell is clicked', () => {
            // Select source marble
            const sourceCell = document.querySelector('[data-row="3"][data-col="1"]');
            sourceCell.click();

            // Select target cell
            const targetCell = document.querySelector('[data-row="3"][data-col="3"]');
            targetCell.click();

            // Verify the move was made
            expect(game.board[3][1]).toBe('empty');
            expect(game.board[3][2]).toBe('empty');
            expect(game.board[3][3]).toBe('marble');
        });

        test('should clear selection when invalid move is attempted', () => {
            // Select source marble
            const sourceCell = document.querySelector('[data-row="3"][data-col="1"]');
            sourceCell.click();

            // Click an invalid target
            const invalidCell = document.querySelector('[data-row="3"][data-col="4"]');
            invalidCell.click();

            // Verify selection was cleared
            expect(game.selectedCell).toBe(null);
            expect(sourceCell.classList.contains('selected')).toBe(false);
        });
    });

    describe('Game Controls', () => {
        test('should reset game state when reset button is clicked', () => {
            // Make a move first
            game.makeMove(3, 1, 3, 3);

            // Click reset button
            document.getElementById('resetBtn').click();

            // Verify game is reset
            expect(game.board[3][1]).toBe('marble');
            expect(game.board[3][2]).toBe('marble');
            expect(game.board[3][3]).toBe('empty');
            expect(game.moveHistory.length).toBe(0);
        });

        test('should play back moves when playback button is clicked', async () => {
            // Make some moves
            game.makeMove(3, 1, 3, 3);
            game.makeMove(3, 4, 3, 2);

            // Show solutions overlay
            document.getElementById('solutionsBtn').click();

            // Select first solution
            const solutionSelect = document.getElementById('solutionSelect');
            solutionSelect.value = '0';
            solutionSelect.dispatchEvent(new Event('change'));

            // Start playback
            document.getElementById('playBtn').click();

            // Wait for animations
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Verify final state
            expect(game.isPlayback).toBe(true);
        });
    });

    describe('Game End Scenarios', () => {
        test('should show victory message when game is won', () => {
            // Set up a winning position
            game.board = Array(7).fill().map(() => Array(7).fill('empty'));
            game.board[3][3] = 'marble';
            game.checkGameOver();

            const message = document.getElementById('message').textContent;
            expect(message).toBe('Congratulations! You won!');
        });

        test('should show game over message when no moves possible', () => {
            // Set up a position with no valid moves
            game.board = Array(7).fill().map(() => Array(7).fill('empty'));
            game.board[3][3] = 'marble';
            game.board[3][5] = 'marble';
            game.checkGameOver();

            const message = document.getElementById('message').textContent;
            expect(message).toBe('Game Over! No more moves possible.');
        });

        test('should not allow moves after game is over', () => {
            // Set up a game over state
            game.board = Array(7).fill().map(() => Array(7).fill('empty'));
            game.board[3][3] = 'marble';
            game.board[3][5] = 'marble';
            game.checkGameOver();

            // Try to make a move
            const initialBoard = JSON.stringify(game.board);
            game.makeMove(3, 3, 3, 5);

            // Board should remain unchanged
            expect(JSON.stringify(game.board)).toBe(initialBoard);
        });
    });
}); 