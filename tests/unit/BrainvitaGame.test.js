import { BrainvitaGame } from '../../script.js';

describe('BrainvitaGame', () => {
    let game;

    beforeEach(() => {
        game = new BrainvitaGame();
    });

    describe('Initial Board Setup', () => {
        test('should create a 7x7 board', () => {
            expect(game.board.length).toBe(7);
            game.board.forEach(row => {
                expect(row.length).toBe(7);
            });
        });

        test('should have center cell empty', () => {
            expect(game.board[3][3]).toBe('empty');
        });

        test('should have correct invalid cells', () => {
            // Check corners
            expect(game.board[0][0]).toBe('invalid');
            expect(game.board[0][1]).toBe('invalid');
            expect(game.board[1][0]).toBe('invalid');
            expect(game.board[0][6]).toBe('invalid');
            expect(game.board[6][0]).toBe('invalid');
            expect(game.board[6][6]).toBe('invalid');
        });
    });

    describe('Move Validation', () => {
        test('should validate horizontal moves', () => {
            // Valid horizontal move
            expect(game.isValidMove(3, 1, 3, 3)).toBe(true);
            
            // Invalid horizontal move - no marble to jump over
            expect(game.isValidMove(3, 0, 3, 2)).toBe(false);
        });

        test('should validate vertical moves', () => {
            // Valid vertical move
            expect(game.isValidMove(1, 3, 3, 3)).toBe(true);
            
            // Invalid vertical move - no marble to jump over
            expect(game.isValidMove(0, 3, 2, 3)).toBe(false);
        });

        test('should not allow diagonal moves', () => {
            expect(game.isValidMove(2, 2, 4, 4)).toBe(false);
        });

        test('should not allow moves to occupied spaces', () => {
            expect(game.isValidMove(3, 1, 3, 2)).toBe(false);
        });

        test('should validate moves within board boundaries', () => {
            // Test moves that would go out of bounds
            expect(game.isValidMove(3, 6, 3, 8)).toBe(false); // Right edge
            expect(game.isValidMove(6, 3, 8, 3)).toBe(false); // Bottom edge
            expect(game.isValidMove(0, 3, -2, 3)).toBe(false); // Top edge
            expect(game.isValidMove(3, 0, 3, -2)).toBe(false); // Left edge
        });

        test('should validate middle position for jumps', () => {
            // Set up a position where middle position is empty
            game.board[3][2] = 'empty'; // Make middle position empty
            expect(game.isValidMove(3, 1, 3, 3)).toBe(false);
            
            // Set up a position where middle position has a marble
            game.board[3][2] = 'marble'; // Put marble back
            expect(game.isValidMove(3, 1, 3, 3)).toBe(true);
        });
    });

    describe('Game State', () => {
        test('should track move history', () => {
            game.makeMove(3, 1, 3, 3);
            expect(game.moveHistory.length).toBe(1);
            expect(game.moveHistory[0]).toEqual({
                from: { row: 3, col: 1 },
                to: { row: 3, col: 3 }
            });
        });

        test('should not add moves to history during playback', () => {
            // Make an initial move
            game.makeMove(3, 1, 3, 3);
            expect(game.moveHistory.length).toBe(1);

            // Set playback mode and make another move
            game.isPlayback = true;
            game.makeMove(3, 4, 3, 2);
            expect(game.moveHistory.length).toBe(1); // Should still be 1
            game.isPlayback = false;
        });

        test('should prevent moves after game is over', () => {
            // Set up a game over state
            game.board = Array(7).fill().map(() => Array(7).fill('empty'));
            game.board[3][3] = 'marble';
            game.board[3][5] = 'marble';
            
            // Try to make a move
            const initialBoard = JSON.stringify(game.board);
            game.handleCellClick(3, 3); // Select marble
            game.handleCellClick(3, 5); // Try to move
            
            expect(JSON.stringify(game.board)).toBe(initialBoard);
        });

        test('should handle invalid cell selection', () => {
            // Try to select an empty cell
            game.handleCellClick(3, 3); // Center is empty
            expect(game.selectedCell).toBe(null);

            // Try to select an invalid cell
            game.handleCellClick(0, 0); // Corner is invalid
            expect(game.selectedCell).toBe(null);
        });

        test('should detect win condition', () => {
            // Set up a winning board state (only one marble)
            game.board = Array(7).fill().map(() => Array(7).fill('empty'));
            game.board[3][3] = 'marble';
            expect(game.hasWon()).toBe(true);
        });

        test('should detect game over condition', () => {
            // Set up a board state with no valid moves
            game.board = Array(7).fill().map(() => Array(7).fill('empty'));
            game.board[3][3] = 'marble';
            game.board[3][5] = 'marble';
            expect(game.isGameOver()).toBe(true);
        });

        test('should clear highlights when no valid moves available', () => {
            // Set up a position where selected marble has no valid moves
            game.board = Array(7).fill().map(() => Array(7).fill('empty'));
            game.board[3][3] = 'marble';
            game.board[3][5] = 'marble';
            
            // Select the marble
            game.handleCellClick(3, 3);
            
            // Check that highlights were cleared
            expect(game.selectedCell).toBe(null);
            expect(game.validMoves.length).toBe(0);
            
            const cell = document.querySelector('[data-row="3"][data-col="3"]');
            expect(cell.classList.contains('selected')).toBe(false);
        });
    });

    describe('Reset Functionality', () => {
        test('should reset to initial state', () => {
            // Make some moves
            game.makeMove(3, 1, 3, 3);
            game.makeMove(3, 4, 3, 2);
            
            // Reset game
            game.resetGame();
            
            // Check if board is in initial state
            expect(game.board[3][3]).toBe('empty');
            expect(game.moveHistory.length).toBe(0);
            expect(game.selectedCell).toBe(null);
        });
    });

    describe('Error Handling and Edge Cases', () => {
        test('should handle out-of-bounds cell clicks', () => {
            // Try clicking outside board boundaries
            game.handleCellClick(-1, 3);
            expect(game.selectedCell).toBe(null);

            game.handleCellClick(7, 3);
            expect(game.selectedCell).toBe(null);

            game.handleCellClick(3, -1);
            expect(game.selectedCell).toBe(null);

            game.handleCellClick(3, 7);
            expect(game.selectedCell).toBe(null);
        });

        test('should handle invalid cell clicks', () => {
            // Try clicking on invalid cells (corners)
            game.handleCellClick(0, 0);
            expect(game.selectedCell).toBe(null);

            game.handleCellClick(0, 6);
            expect(game.selectedCell).toBe(null);

            game.handleCellClick(6, 0);
            expect(game.selectedCell).toBe(null);

            game.handleCellClick(6, 6);
            expect(game.selectedCell).toBe(null);
        });

        test('should handle moves during game over state', () => {
            // Set up a game over state
            game.board = Array(7).fill().map(() => Array(7).fill('empty'));
            game.board[3][3] = 'marble';
            game.board[3][5] = 'marble';
            
            // Try to make a move after game is over
            const initialBoard = JSON.stringify(game.board);
            game.makeMove(3, 3, 3, 5);
            expect(JSON.stringify(game.board)).toBe(initialBoard);
        });

        test('should handle empty move history during playback', async () => {
            // Clear move history
            game.moveHistory = [];
            
            // Try to play back empty move history
            await game.playbackMoves();
            
            // Board should remain in initial state
            expect(game.board[3][3]).toBe('empty');
            expect(game.isPlayback).toBe(false);
        });
    });
}); 