import { BoardState } from '../../Board/types';
import {
  AttackOutcome,
  Color,
  GameHistory,
  Move,
  PartialShortGameTurnAttackPhase,
  PartialShortGameTurnMovePhase,
  ShortAttack,
  ShortGameHistory,
  ShortMove,
} from '../../commonTypes';
import { isPartialGameTurn } from '../../util';
import { Coord } from '../../util-kit';
import {
  GameState,
  GameStateCompleted,
  GameStateInAttackPhase,
  GameStateInAttackPhaseWithPartialSubmission,
  GameStateInAttackPhaseWithPreparingSubmission,
  GameStateInAtttackPhaseWithNoSubmission,
  GameStateInMovePhase,
  GameStateInMovePhaseWithPartialSubmission,
  GameStateInMovePhaseWithPreparingSubmission,
  GameStateInProgress,
  GameStatePending,
} from '../types';

export const isGameInMovePhase = (g: GameState): g is GameStateInMovePhase =>
  g.state === 'inProgress' && g.phase === 'move';

export const isGameInMovePhaseWithNoSubmission = (
  g: GameState
): g is GameStateInMovePhaseWithPreparingSubmission => {
  return (
    g.state === 'inProgress' &&
    g.phase === 'move' &&
    g.submissionStatus === 'none'
  );
};

export const isGameInMovePhaseWithPreparingSubmission = (
  g: GameState
): g is GameStateInMovePhaseWithPreparingSubmission => {
  return (
    g.state === 'inProgress' &&
    g.phase === 'move' &&
    g.submissionStatus === 'preparing'
  );
};

export const isGameInMovePhaseWithPartialSubmission = (
  g: GameState
): g is GameStateInMovePhaseWithPartialSubmission => {
  return (
    g.state === 'inProgress' &&
    g.phase === 'move' &&
    g.submissionStatus === 'partial'
  );
};

export const isGameInMovePhaseWithPartialOrPreparingSubmission = (
  g: GameState
): g is
  | GameStateInMovePhaseWithPreparingSubmission
  | GameStateInMovePhaseWithPartialSubmission => {
  return (
    isGameInMovePhaseWithPreparingSubmission(g) ||
    isGameInMovePhaseWithPartialSubmission(g)
  );
};

export const isGameInAttackPhase = (
  g: GameState
): g is GameStateInAttackPhase =>
  g.state === 'inProgress' && g.phase === 'attack';

export const isGameInAttackPhaseWithNoSubmission = (
  g: GameState
): g is GameStateInAtttackPhaseWithNoSubmission => {
  return (
    g.state === 'inProgress' &&
    g.phase === 'attack' &&
    g.submissionStatus === 'none'
  );
};

export const isGameInAttackPhaseWithPreparingSubmission = (
  g: GameState
): g is GameStateInAttackPhaseWithPreparingSubmission => {
  return (
    g.state === 'inProgress' &&
    g.phase === 'attack' &&
    g.submissionStatus === 'preparing'
  );
};

export const isGameInAttackPhaseWithPartialSubmission = (
  g: GameState
): g is GameStateInAttackPhaseWithPartialSubmission => {
  return (
    g.state === 'inProgress' &&
    g.phase === 'attack' &&
    g.submissionStatus === 'partial'
  );
};

export const isGameInAttackPhaseWithPartialOrPreparingSubmission = (
  g: GameState
): g is
  | GameStateInAttackPhaseWithPreparingSubmission
  | GameStateInAttackPhaseWithPartialSubmission => {
  return (
    isGameInAttackPhaseWithPreparingSubmission(g) ||
    isGameInAttackPhaseWithPartialSubmission(g)
  );
};

export const isGamePending = (g: GameState): g is GameStatePending =>
  g.state === 'pending';

export const isGameInProgress = (g: GameState): g is GameStateInProgress =>
  g.state === 'inProgress';

export const isGameCompleted = (g: GameState): g is GameStateCompleted =>
  g.state === 'completed';

export const insertItemIntoArrayOnIndex = <T>(
  items: T[],
  item: T,
  index: number = -1
) => {
  if (index === -1) {
    return [...items, item];
  }
  return [...items.slice(0, index), item, ...items.slice(index + 1)];
};

export const removeItemAtIndex = <T>(items: T[], index: number) => [
  ...items.slice(0, index),
  ...items.slice(index + 1),
];

export function checkIfSquareAtOppsiteEndOfBoard(
  forColor: Color,
  board: BoardState,
  square: Coord
): boolean {
  return forColor === 'white'
    ? square.row === 0
    : forColor === 'black'
    ? square.row === board.terrainState.length - 1
    : false;
}

export const getLastGameTurn = <G extends GameState>(g: G) =>
  g.history.slice(-1)[0];

export const getLastPartialGameTurn = <G extends GameState>(g: G) => {
  const lastTurn = getLastGameTurn(g);

  if (!lastTurn) {
    return undefined;
  }

  const [movePartialTurn, attackPartialTurn] = lastTurn;

  return attackPartialTurn
    ? ({
        type: 'attack',
        partialTurn: attackPartialTurn,
      } as const)
    : ({
        type: 'move',
        partialTurn: movePartialTurn,
      } as const);
};

export const getLastTurnMovesForColor = (g: GameState, color: Color) => {
  const lastTurn = getLastGameTurn(g);
  return lastTurn && lastTurn[0].length > 0
    ? lastTurn[0].find((c) => c.color === color)?.moves
    : undefined;
};

export const getLastTurnAttacksForColor = (g: GameState, color: Color) => {
  const lastTurn = getLastGameTurn(g);
  return lastTurn && lastTurn.length > 0
    ? !isPartialGameTurn(lastTurn)
      ? lastTurn[1].find((c) => c.color === color)?.attacks
      : undefined
    : undefined;
};

export const moveOutcomeToShortMove = (m: Move | ShortMove): ShortMove => ({
  from: m.from,
  to: m.to,
  castle: m.castle,
  promotion: m.promotion,
});

export const attackOutcomekToShortMove = (a: AttackOutcome): ShortAttack =>
  a.attack;

export const gameHistoryToShortGameHistory = (
  history: GameHistory
): ShortGameHistory =>
  history.map(
    ([
      [firstMoveTurnSubmission, secondMoveTurnSubmission],
      attackSubmission,
    ]) => {
      const moveTurn: PartialShortGameTurnMovePhase = [
        {
          color: firstMoveTurnSubmission.color,
          moves: firstMoveTurnSubmission.moves.map(moveOutcomeToShortMove),
        },
        {
          color: secondMoveTurnSubmission.color,
          moves: secondMoveTurnSubmission.moves.map(moveOutcomeToShortMove),
        },
      ];

      if (attackSubmission) {
        const [firstAttackTurnSubmission, secondAttackTurnSubmission] =
          attackSubmission;

        const attackTurn: PartialShortGameTurnAttackPhase = [
          {
            color: firstAttackTurnSubmission.color,
            attacks: firstAttackTurnSubmission.attacks.map(
              attackOutcomekToShortMove
            ),
          },
          {
            color: secondAttackTurnSubmission.color,
            attacks: secondAttackTurnSubmission.attacks.map(
              attackOutcomekToShortMove
            ),
          },
        ];

        return [moveTurn, attackTurn];
      }

      return [moveTurn];
    }
  );

export const gameHasPreparingSubmission = (game: GameState, color: Color) =>
  (isGameInMovePhaseWithPreparingSubmission(game) &&
    game[color].moves.length > 0) ||
  (isGameInAttackPhaseWithPreparingSubmission(game) &&
    game[color].attacks.length > 0);
