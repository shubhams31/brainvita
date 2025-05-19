#!/usr/bin/env python3

from typing import List, Tuple, Set
from dataclasses import dataclass
from copy import deepcopy
import json
from collections import defaultdict
import time
import sys

@dataclass
class Move:
    from_pos: Tuple[int, int]
    to_pos: Tuple[int, int]
    removed_pos: Tuple[int, int]

    def __str__(self):
        return f"Move marble from {self.from_pos} to {self.to_pos} (removes {self.removed_pos})"

    def to_js_format(self):
        return {
            "from": [self.from_pos[0], self.from_pos[1]],
            "to": [self.to_pos[0], self.to_pos[1]],
            "removes": [self.removed_pos[0], self.removed_pos[1]]
        }

class BrainvitaSolver:
    def __init__(self):
        # Initialize the board (7x7)
        # -1: invalid, 0: empty, 1: marble
        self.initial_board = [
            [-1, -1, 1, 1, 1, -1, -1],
            [-1, -1, 1, 1, 1, -1, -1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 0, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [-1, -1, 1, 1, 1, -1, -1],
            [-1, -1, 1, 1, 1, -1, -1]
        ]
        self.solutions = []
        self.visited_states = set()
        self.start_time = None
        self.time_limit = 300  # 5 minute time limit
        self.states_explored = 0
        self.last_progress_time = 0
        self.unique_final_positions = set()

    def print_progress(self):
        current_time = time.time()
        if current_time - self.last_progress_time >= 2:  # Update every 2 seconds
            elapsed = current_time - self.start_time
            print(f"\rTime: {elapsed:.1f}s, Explored {self.states_explored} states, found {len(self.solutions)} solutions...", 
                  end="", file=sys.stderr)
            self.last_progress_time = current_time

    def get_valid_moves(self, board: List[List[int]]) -> List[Move]:
        moves = []
        directions = [(0, 2), (0, -2), (2, 0), (-2, 0)]  # Right, Left, Down, Up

        for row in range(7):
            for col in range(7):
                if board[row][col] == 1:  # If there's a marble here
                    for dx, dy in directions:
                        new_row, new_col = row + dx, col + dy
                        mid_row, mid_col = row + dx//2, col + dy//2

                        # Check if the move is valid
                        if (0 <= new_row < 7 and 0 <= new_col < 7 and
                            0 <= mid_row < 7 and 0 <= mid_col < 7 and
                            board[new_row][new_col] == 0 and
                            board[mid_row][mid_col] == 1 and
                            board[new_row][new_col] != -1):
                            moves.append(Move(
                                from_pos=(row, col),
                                to_pos=(new_row, new_col),
                                removed_pos=(mid_row, mid_col)
                            ))
        return moves

    def make_move(self, board: List[List[int]], move: Move) -> List[List[int]]:
        new_board = deepcopy(board)
        fr, fc = move.from_pos
        tr, tc = move.to_pos
        mr, mc = move.removed_pos
        
        new_board[fr][fc] = 0  # Remove marble from source
        new_board[mr][mc] = 0  # Remove jumped-over marble
        new_board[tr][tc] = 1  # Place marble at destination
        
        return new_board

    def rotate_board(self, board: List[List[int]], times: int = 1) -> List[List[int]]:
        result = deepcopy(board)
        for _ in range(times % 4):
            result = [[result[6-j][i] for j in range(7)] for i in range(7)]
        return result

    def reflect_board(self, board: List[List[int]], horizontal: bool = True) -> List[List[int]]:
        if horizontal:
            return [row[::-1] for row in board]
        return board[::-1]

    def get_all_symmetries(self, board: List[List[int]]) -> Set[str]:
        symmetries = set()
        
        # Add all rotations
        for i in range(4):
            rotated = self.rotate_board(board, i)
            symmetries.add(self.board_to_string(rotated))
            
            # Add reflections of each rotation
            reflected_h = self.reflect_board(rotated, True)
            reflected_v = self.reflect_board(rotated, False)
            symmetries.add(self.board_to_string(reflected_h))
            symmetries.add(self.board_to_string(reflected_v))
        
        return symmetries

    def board_to_string(self, board: List[List[int]]) -> str:
        return ''.join(str(cell) for row in board for cell in row if cell != -1)

    def count_marbles(self, board: List[List[int]]) -> int:
        return sum(sum(1 for cell in row if cell == 1) for row in board)

    def get_final_position(self, board: List[List[int]]) -> Tuple[int, int]:
        for i in range(7):
            for j in range(7):
                if board[i][j] == 1:
                    return (i, j)
        return (-1, -1)  # Should never happen in a valid solution

    def solve(self, board: List[List[int]], moves: List[Move] = None, depth: int = 0):
        if moves is None:
            moves = []

        # Check time limit
        if time.time() - self.start_time > self.time_limit:
            return

        # Update progress
        self.states_explored += 1
        self.print_progress()

        # Get all symmetrical states
        current_symmetries = self.get_all_symmetries(board)
        
        # Check if we've seen any symmetrical state
        if any(sym in self.visited_states for sym in current_symmetries):
            return
        
        # Add all symmetrical states to visited
        self.visited_states.update(current_symmetries)

        # Check if we've reached a winning state (one marble left)
        marble_count = self.count_marbles(board)
        if marble_count == 1:
            final_pos = self.get_final_position(board)
            if final_pos not in self.unique_final_positions:
                self.unique_final_positions.add(final_pos)
                self.solutions.append(moves.copy())
                print(f"\nFound a solution! Number of moves: {len(moves)}, Final position: {final_pos}")
                print("Continuing search...", file=sys.stderr)
            return

        # Get all valid moves from current position
        valid_moves = self.get_valid_moves(board)
        
        # Try each move
        for move in valid_moves:
            new_board = self.make_move(board, move)
            moves.append(move)
            self.solve(new_board, moves, depth + 1)
            moves.pop()  # Backtrack

    def find_all_solutions(self):
        self.solutions = []
        self.visited_states = set()
        self.states_explored = 0
        self.unique_final_positions = set()
        self.start_time = time.time()
        self.last_progress_time = self.start_time
        
        print("Starting search (5 minute time limit)...", file=sys.stderr)
        self.solve(self.initial_board)
        
        elapsed_time = time.time() - self.start_time
        print(f"\n\nSearch completed in {elapsed_time:.2f} seconds", file=sys.stderr)
        print(f"States explored: {self.states_explored}", file=sys.stderr)
        print(f"Unique final positions found: {len(self.unique_final_positions)}", file=sys.stderr)
        return self.solutions

    def save_solutions_to_js(self, filename: str = "solutions.js"):
        # Convert solutions to JavaScript format
        js_solutions = []
        for i, solution in enumerate(self.solutions, 1):
            js_solution = {
                "name": f"Solution {i}",
                "moves": [move.to_js_format() for move in solution]
            }
            js_solutions.append(js_solution)
        
        # Write to file
        with open(filename, 'w') as f:
            f.write("export const solutions = ")
            json.dump(js_solutions, f, indent=4)
            f.write(";\n")
        print(f"\nSaved {len(self.solutions)} solutions to {filename}")

def main():
    solver = BrainvitaSolver()
    solutions = solver.find_all_solutions()
    
    # Group solutions by length
    solutions_by_length = defaultdict(list)
    for solution in solutions:
        solutions_by_length[len(solution)].append(solution)
    
    # Print summary
    print(f"\nFound {len(solutions)} solutions!")
    print("\nSolutions grouped by number of moves:")
    
    for moves_count in sorted(solutions_by_length.keys()):
        solutions_with_this_length = solutions_by_length[moves_count]
        print(f"\n{len(solutions_with_this_length)} solutions with {moves_count} moves")
    
    # Save solutions to JavaScript file
    solver.save_solutions_to_js("../solutions.js")

if __name__ == "__main__":
    main() 