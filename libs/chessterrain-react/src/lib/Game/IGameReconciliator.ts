import { Result } from 'ts-results';
import { Color, ShortAttack, ShortMove } from '../commonTypes';
import { PieceRegistry } from '../Piece/types';
import {
  SubmitAttacksNotPossibleError,
  SubmitMovesNotPossibleError,
} from './errors';
import { IGame } from './IGame';
import {
  GameStateCompleted,
  GameStateInAttackPhaseWithPartialSubmission,
  GameStateInAtttackPhaseWithNoSubmission,
  GameStateInMovePhaseWithNoSubmission,
  GameStateInMovePhaseWithPartialSubmission,
} from './types';

export interface IGameReconciliator<PR extends PieceRegistry = PieceRegistry>
  extends IGame<PR> {
  submitMoves(p: {
    color: Color;
    moves: ShortMove[];
  }): Result<
    | GameStateInMovePhaseWithPartialSubmission
    | GameStateInAtttackPhaseWithNoSubmission
    | GameStateCompleted,
    SubmitMovesNotPossibleError
  >;

  submitAttacks(p: {
    color: Color;
    attacks: ShortAttack[];
    withCaptures: boolean;
  }): Result<
    | GameStateInAttackPhaseWithPartialSubmission
    | GameStateInMovePhaseWithNoSubmission
    | GameStateCompleted,
    SubmitAttacksNotPossibleError
  >;

  clone(): IGameReconciliator;
}
