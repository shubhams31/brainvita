# Brainvita Solver

This program finds all possible solutions to the Brainvita (Peg Solitaire) puzzle. It uses a depth-first search with backtracking algorithm to discover all paths from the initial state to a winning state.

## How It Works

The solver:
1. Starts with the standard Brainvita board (32 marbles with center empty)
2. Uses depth-first search to explore all possible moves
3. Tracks visited states to avoid cycles
4. Records all paths that lead to a winning state (only one marble remaining)
5. Groups solutions by number of moves required

## Board Representation

The board is represented as a 7x7 grid where:
- `-1`: Invalid position (corners)
- `0`: Empty position
- `1`: Position with marble

Initial board layout:
```
    o o o
    o o o
o o o o o o o
o o o _ o o o
o o o o o o o
    o o o
    o o o
```

## Usage

1. Make sure you have Python 3.7+ installed
2. Run the solver:
   ```bash
   python3 solver.py
   ```

The program will output:
- Total number of solutions found
- Solutions grouped by number of moves required
- Example solution for each move count

## Output Format

For each solution, moves are described as:
```
Move 1: Move marble from (3,1) to (3,3) (removes (3,2))
```
This means:
- Move the marble at position (3,1)
- To position (3,3)
- Removing the marble at (3,2)

## Performance

The solver uses several optimizations:
- State tracking to avoid revisiting positions
- Efficient board representation
- Move validation to only consider legal moves

Note: Finding all solutions can take some time due to the large search space. 