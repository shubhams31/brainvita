import '@testing-library/jest-dom';

// Mock the DOM elements that our game needs
document.body.innerHTML = `
    <div class="container">
        <h1>Brainvita</h1>
        <div class="game-controls">
            <button id="resetBtn">Reset Game</button>
            <button id="playbackBtn">Play Moves</button>
        </div>
        <div id="board" class="board"></div>
        <div id="message" class="message"></div>
    </div>
`; 