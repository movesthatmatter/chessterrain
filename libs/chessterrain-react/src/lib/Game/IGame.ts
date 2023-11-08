import { Coord } from '../util-kit';
import { Result } from 'ts-results';
import { IBoard } from '../Board/IBoard';
import { Attack, Move } from '../commonTypes';
import { PieceRegistry } from '../Piece/types';
import { AttackNotPossibleError, MoveNotPossibleError } from './errors';
import { GameState } from './types';

export interface IGame<PR extends PieceRegistry = PieceRegistry> {
  state: GameState;

  board: IBoard<PR>;

  // Loads a new GameState and does all the needed calculations
  load(state: GameState): void;

  // When a Move is Succesfully Drawn it gets appended to the nextMoves List of the "move" phase
  drawMove(move: Move): Result<
    {
      move: Move;
      gameState: GameState;
    },
    MoveNotPossibleError
  >;

  // When an Attack is Succesfully Drawn it gets appended to the nextAttacks List of the "attack" phase
  drawAttack(
    from: Coord,
    to: Coord
  ): Result<
    {
      attack: Attack;
      gameState: GameState;
    },
    AttackNotPossibleError
  >;

  clone(): IGame;

  export(): string;
}
