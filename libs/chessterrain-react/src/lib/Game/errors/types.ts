// import { ResultError } from '@maha-monorepo/util-kit';
import { Color, ShortAttack } from '../../commonTypes';
import { ResultError } from '../../util-kit';
import { GameState } from '../types';

type GameIsCompletedReason = 'GameIsCompleted';

type GameNotInMovePhaseReason = 'GameNotInMovePhase';
type GameNotInAttackPhaseReason = 'GameNotInAttackPhase';

type PieceNotExistentReason = 'PieceNotExistent';
type AttackerPieceNotExistentReason = 'AttackerPieceNotExistent';
type VictimPieceNotExistentReason = 'VictimPieceNotExistent';

type DestinationNotValidReason = 'DestinationNotValid';
type PieceAlreadyMovedReason = 'PieceAlreadyMoved';

export type GameStateNotInMovePhaseError = {
  type: 'GameStateNotInMovePhase';
  content: undefined;
};

export type GameStateNotInAttackPhaseError = {
  type: 'GameStateNotInAttackPhase';
  content: undefined;
};

// TODO: Take the reason out of the content and use Tagged Unions if content is needed
export type MoveNotPossibleError = {
  type: 'MoveNotPossible';
  content: {
    reason:
      | GameIsCompletedReason
      | GameNotInMovePhaseReason
      | PieceNotExistentReason
      | DestinationNotValidReason
      | PieceAlreadyMovedReason;
  };
};

// TODO: Take the reason out of the content and use Tagged Unions if content is needed
export type AttackNotPossibleError = {
  type: 'AttackNotPossible';
  content: {
    reason:
      | GameIsCompletedReason
      | GameNotInMovePhaseReason
      | AttackerPieceNotExistentReason
      | VictimPieceNotExistentReason
      | DestinationNotValidReason;
    // | PieceAlreadyMovedReason;
  };
};

// I like this type of errors with a reason field b/c they could be easier
//  to catch by type and handle by reason!
// Also, the content could be union tagged by reason!
export type SubmitMovesNotPossibleError = {
  type: 'SubmitMovesNotPossible';
  reason:
    | GameNotInMovePhaseReason
    | `InvalidMoves:${Color}`
    | `InvalidMove:${Color}` // This could be typed better
    | 'MovesNotPossible';
  content: {
    game: GameState;
    gameExport: string;
    extra?: any;
  };
};

export type SubmitAttacksNotPossibleError = {
  type: 'SubmitAttacksNotPossible';
  reason:
    | GameNotInAttackPhaseReason
    | `InvalidAttacks:${Color}`
    | `InvalidAttack:${Color}`;
  content: {
    game: GameState;
    gameExport: string;
    submission: {
      color: Color;
      attacks: ShortAttack[];
      withCaptures?: boolean;
    };
    extra?: any;
  };
};

export type AttackTargetPieceUndefined = {
  type: 'TargetPieceIsUndefined';
  content: undefined;
};

// This could be more specifically typed
export type ValidateMovesError = ResultError<{
  type: 'ValidateMovesError';
  content: any;
  reason: string;
}>;

export type ValidateAttacksError = ResultError<{
  type: 'ValidateAttacksError';
  content: any;
  reason: string;
}>;
