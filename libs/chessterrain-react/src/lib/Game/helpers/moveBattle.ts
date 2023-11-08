import {
  Coord,
  resultError,
  ResultError,
  serializeCoord,
  SerializedCoord,
} from '../../util-kit';
import { Err, Ok, Result } from 'ts-results';
import { Board } from '../../Board/Board';
import { Attack, MoveOutcome, ShortMove } from '../../commonTypes';
import { BaseKing } from '../../Piece/BasePieces';
import { Piece } from '../../Piece/Piece';
import { GameReconciliator } from '../GameReconciliator';
import { IGame } from '../IGame';

export const getBattlePairsFromSetOfMoves = (moves: ShortMove[]) =>
  Object.values(
    moves.reduce((accum, next) => {
      const serializedTo = serializeCoord(next.to);
      return {
        ...accum,
        [serializedTo]: accum[serializedTo]
          ? [...accum[serializedTo], next]
          : [next],
      };
    }, {} as { [toCoord: SerializedCoord]: ShortMove[] })
  ).filter((m) => m.length === 2) as [ShortMove, ShortMove][];

export const sortBattlePairsByLoserWinnerOrder = (
  pairs: [MoveOutcome, MoveOutcome][]
): [loserMove: MoveOutcome, winnerMove: MoveOutcome][] =>
  pairs.map((pair) =>
    pair[0].piece.hitPoints === 0 ? [pair[0], pair[1]] : [pair[1], pair[0]]
  );

export type ExecuteBattleError =
  | ResultError<{
      type: 'ExecuteBattleError';
      reason: 'EqualKingVsKing';
    }>
  | ResultError<{
      type: 'ExecuteBattleError';
      reason: 'MovesNotPossible';
    }>
  | ResultError<{
      type: 'ExecuteBattleError';
      reason: 'PieceNotFound';
    }>
  | ResultError<{
      type: 'ExecuteBattleError';
      reason: 'Unknown'; // TODO: This shouldnt really exist as the others errors are accaprating the unknown
    }>;

export const executeBattlesAndApplyDamageForPairs = (
  moves: [ShortMove, ShortMove][],
  game: GameReconciliator<any>
): Result<[MoveOutcome, MoveOutcome][], ExecuteBattleError> => {
  const tempBoard = new Board({
    load: true,
    pieceRegistry: game.board.pieceRegistry,
    boardState: game.board.state,
  });

  return Result.all(...moves.map((m) => tempBoard.applyMoves([m[0]])))
    .mapErr(() => resultError('ExecuteBattleError', 'MovesNotPossible'))
    .andThen(() =>
      Result.all(
        ...moves.map(([firstMove, secondMove]) => {
          const firstPiece = tempBoard.getPieceByCoord(firstMove.to);
          if (!firstPiece) {
            return new Err(resultError('ExecuteBattleError', 'PieceNotFound'));
          }

          const secondPiece = tempBoard.getPieceByCoord(secondMove.from);
          if (!secondPiece) {
            return new Err(resultError('ExecuteBattleError', 'PieceNotFound'));
          }

          const firstPieceIsKing = tempBoard.isPieceOfClass(
            firstPiece.state.id,
            BaseKing
          );
          const secondPieceIsKing = tempBoard.isPieceOfClass(
            secondPiece.state.id,
            BaseKing
          );

          // If one of the Pieces is King, he always wins
          if (firstPieceIsKing && !secondPieceIsKing) {
            return new Ok([
              {
                ...firstMove,
                piece: {
                  ...firstPiece.state,
                  pieceHasMoved: true,
                },
              },
              {
                ...secondMove,
                piece: {
                  ...secondPiece.state,
                  pieceHasMoved: true,
                  hitPoints: 0,
                },
              },
            ] as [MoveOutcome, MoveOutcome]);
          }

          // If one of the Pieces is King, he always wins
          if (secondPieceIsKing && !firstPieceIsKing) {
            return new Ok([
              {
                ...firstMove,
                piece: {
                  ...firstPiece.state,
                  pieceHasMoved: true,
                  hitPoints: 0,
                },
              },
              {
                ...secondMove,
                piece: {
                  ...secondPiece.state,
                  pieceHasMoved: true,
                },
              },
            ] as [MoveOutcome, MoveOutcome]);
          }

          // In Power Level, if the Pieces are exactly the same they both die!
          if (
            firstPiece.state.hitPoints === secondPiece.state.hitPoints &&
            firstPiece.state.maxHitPoints === secondPiece.state.maxHitPoints &&
            game.conflictResolutionType === 'powerLevel'
          ) {
            return new Ok([
              {
                ...firstMove,
                piece: {
                  ...firstPiece.state,
                  pieceHasMoved: true,
                  hitPoints: 0,
                },
              },
              {
                ...secondMove,
                piece: {
                  ...secondPiece.state,
                  // This is important to add here as this will be removed from
                  //  the actual Board and never set to true
                  pieceHasMoved: true,
                  hitPoints: 0,
                },
              },
            ] as [MoveOutcome, MoveOutcome]);
          }

          const winner = getWinnerFromPieceVsPiece(game, firstMove.to, [
            firstPiece,
            secondPiece,
          ]);

          return winner.pieceId === firstPiece.state.id
            ? new Ok([
                {
                  ...firstMove,
                  piece: {
                    ...firstPiece.state,
                    hitPoints: winner.hitPoints,
                    pieceHasMoved: true,
                  },
                },
                {
                  ...secondMove,
                  piece: {
                    ...secondPiece.state,
                    // This is important to add here as this will be removed from
                    //  the actual Board and never set to true
                    pieceHasMoved: true,
                    hitPoints: 0,
                  },
                },
              ] as [MoveOutcome, MoveOutcome])
            : new Ok([
                {
                  ...firstMove,
                  piece: {
                    ...firstPiece.state,
                    // This is important to add here as this will be removed from
                    //  the actual Board and never set to true
                    pieceHasMoved: true,
                    hitPoints: 0,
                  },
                },
                {
                  ...secondMove,
                  piece: {
                    ...secondPiece.state,
                    hitPoints: winner.hitPoints,
                    pieceHasMoved: true,
                  },
                },
              ] as [MoveOutcome, MoveOutcome]);
        })
      )
    );
};

const getWinnerFromPieceVsPiece = (
  game: IGame,
  squareToFightOn: Coord,
  [firstPiece, secondPiece]: [Piece, Piece]
): { pieceId: string; hitPoints: number } => {
  //TODO - known bug, in case of Bishop vs Knight it will not apply attack bonus because
  //       it won't find any piece at square since the move hasn't apply yet.
  const attack: Attack = { from: squareToFightOn, to: squareToFightOn };

  const firstPieceDamagePoints =
    firstPiece.attackDamage +
    firstPiece.calculateAttackBonus(attack, game.board, game.state) -
    secondPiece.calculateDefenseBonus(attack, game.board, game.state);

  const secondPieceDamagePoints =
    secondPiece.attackDamage +
    secondPiece.calculateAttackBonus(attack, game.board, game.state) -
    firstPiece.calculateDefenseBonus(attack, game.board, game.state);

  if (secondPieceDamagePoints <= 0) {
    return {
      pieceId: firstPiece.state.id,
      hitPoints: firstPiece.state.hitPoints,
    };
  }

  if (firstPieceDamagePoints <= 0) {
    return {
      pieceId: secondPiece.state.id,
      hitPoints: secondPiece.state.hitPoints,
    };
  }

  const firstPieceBattleResult = applyDamageUntilDeath({
    damage: secondPieceDamagePoints,
    health: firstPiece.state.hitPoints,
  });

  const secondPieceBattleResult = applyDamageUntilDeath({
    damage: firstPieceDamagePoints,
    health: secondPiece.state.hitPoints,
  });

  const differenceInHits =
    firstPieceBattleResult.hits - secondPieceBattleResult.hits;

  if (differenceInHits > 0) {
    return {
      pieceId: firstPiece.state.id,
      hitPoints:
        firstPieceBattleResult.remainingHealth +
        secondPieceDamagePoints *
          (Math.abs(differenceInHits) > 0 ? Math.abs(differenceInHits) : 1),
    };
  }

  if (differenceInHits < 0) {
    return {
      pieceId: secondPiece.state.id,
      hitPoints:
        secondPieceBattleResult.remainingHealth +
        firstPieceDamagePoints *
          (Math.abs(differenceInHits) > 0 ? Math.abs(differenceInHits) : 1),
    };
  }

  // The Difference in Hits is 0, meaning they both died at the same time
  // And the winner gets determined by the one left with more health
  // The next hitPoints are calculated from the remainingHealth after the battle + the damage applied to it

  if (
    secondPieceBattleResult.remainingHealth >
    firstPieceBattleResult.remainingHealth
  ) {
    return {
      pieceId: secondPiece.state.id,
      hitPoints:
        secondPieceBattleResult.remainingHealth + firstPieceDamagePoints,
    };
  }

  return {
    pieceId: firstPiece.state.id,
    hitPoints: firstPieceBattleResult.remainingHealth + secondPieceDamagePoints,
  };
};

const applyDamageUntilDeath = ({
  damage,
  health,
  currentStep = 1,
}: {
  damage: number;
  health: number;
  currentStep?: number;
}): { remainingHealth: number; hits: number } => {
  const remainingHealth = health - damage;

  if (remainingHealth > 0) {
    return applyDamageUntilDeath({
      damage,
      health: remainingHealth,
      currentStep: currentStep + 1,
    });
  }

  return {
    remainingHealth,
    hits: currentStep,
  };
};
