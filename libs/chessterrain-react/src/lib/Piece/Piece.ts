import { Coord } from '../util-kit';
import { Result } from 'ts-results';
import { IBoard } from '../Board/IBoard';
import {
  Attack,
  AttackAbility,
  AttackOutcome,
  Move,
  MoveDirection,
  ShortMove,
} from '../commonTypes';
import { AttackNotPossibleError } from '../Game/errors';
import { IGame } from '../Game/IGame';
import { GameState } from '../Game/types';
import { CastlingRole, IdentifiablePieceState, PieceRegistry } from './types';

// TODO: Don'l default the L here - it must be given from outside
export interface Piece<L extends string = string> {
  state: IdentifiablePieceState;

  movesDirections: MoveDirection[];

  canDie: boolean; // If a canDie=false piece runs out of life, game ends!

  moveRange: number;

  attackDamage: number;

  attackRange: number;

  // TODO: This could be grouped into something more like a special!
  castlingRole: CastlingRole;

  calculateNextState<P extends Partial<IdentifiablePieceState>>(
    getNextState:
      | P
      | ((prev: IdentifiablePieceState) => Partial<IdentifiablePieceState>)
  ): IdentifiablePieceState;

  evalMove(game: IGame): Move[];

  evalMoveTo(
    game: IGame,
    to: Coord,
    withPromotion?: keyof PieceRegistry
  ): Result<Move, void>;

  evalAttack(game: IGame): Attack[];

  evalAttackTo(game: IGame, to: Coord): Result<Attack, void>;

  calculateAttackOutcome(
    attack: Attack,
    board: IBoard,
    gameState: GameState
  ): Result<AttackOutcome, AttackNotPossibleError>;

  calculateAttackBonus(
    attack: Attack,
    board: IBoard,
    gameState: GameState
  ): number;

  calculateDefenseBonus(
    attack: Attack,
    board: IBoard,
    gameState: GameState
  ): number;

  checkMoveThisTurn(gameState: GameState): Result<ShortMove, void>;

  canAttackThisTurn(game: IGame): AttackAbility;

  serialize(): IdentifiablePieceState & {
    movesDirections: MoveDirection[];
    canDie: boolean;
    moveRange: number;
    attackDamage: number;
    attackRange: number;
  };
}
