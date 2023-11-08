import { Result } from 'ts-results';
import { AttackNotPossibleError } from '../Game/errors';
import { Piece } from '../Piece/Piece';
import { IdentifiablePieceState, PieceId, PieceRegistry } from '../Piece/types';
import { BoardState } from './types';
import { GameState } from '../Game/types';
import { Coord } from '../util-kit';
import { AttackOutcome, Move, ShortAttack, ShortMove } from '../commonTypes';

export interface IBoard<PR extends PieceRegistry = {}> {
  pieceRegistry: PieceRegistry;

  getPieceByCoord(coord: Coord): Piece | undefined;

  getPieceById(pieceId: string): Piece | undefined;

  getPieceCoordById(pieceId: string): Coord | undefined;

  updatePieceById<P extends Partial<IdentifiablePieceState>>(
    pieceId: PieceId,
    getNextState:
      | P
      | ((prev: IdentifiablePieceState) => Partial<IdentifiablePieceState>)
  ): Result<IdentifiablePieceState, void>;

  // This is done so there are no external updates
  get state(): BoardState;

  applyMoves(
    moves: ShortMove[],
    conflictResolution?: Function
  ): Result<Move[], 'MovesNotPossible'>;

  // TODO: Test
  applyAttacks(
    attacks: ShortAttack[],
    gameState: GameState
  ): Result<AttackOutcome[], AttackNotPossibleError>;

  isPieceOfClass(pieceId: string, PieceClass: Function): boolean;

  clone(): IBoard<PR>;

  resetCache(): void;
}
