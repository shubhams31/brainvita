import '@testing-library/jest-dom';

// Mock the DOM elements that our game needs
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