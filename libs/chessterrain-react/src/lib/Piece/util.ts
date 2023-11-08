import {
  calculateDistanceBetween2Coords,
  Coord,
  coordsAreEqual,
  matrixGet,
  MatrixIndex,
  matrixInsertMany,
  range,
  serializeCoord,
  toDictIndexedBy,
} from '../util-kit';
import { Board } from '../Board/Board';
import { IBoard } from '../Board/IBoard';
import { PieceLayoutState } from '../Board/types';
import { Color, Move, ShortMove, ShortAttack } from '../commonTypes';
import { isGameInMovePhase } from '../Game/helpers/main';
import { IGame } from '../Game/IGame';
import { movesAreEqual } from '../util';
import { Piece } from './Piece';
import { IdentifiablePieceState, PieceFactory, PieceRegistry } from './types';

export const getPieceFactory =
  (factory: PieceFactory) =>
  (...args: Parameters<PieceFactory>) =>
    factory(...args);

export const checkIfMovesAreOnSameDelta = (a: ShortMove, b: ShortMove) =>
  coordsAreEqual(getMoveDelta(a), getMoveDelta(b));

export const checkIfMovesAreOnExactlyOppositeDeltas = (
  a: ShortMove,
  b: ShortMove
) => {
  const { row, col } = getMoveDelta(a);
  return coordsAreEqual({ row: row * -1, col: col * -1 }, getMoveDelta(b));
};

export const getMoveDelta = (move: ShortMove): Coord =>
  getDelta({ from: move.from, to: move.to });

export const getAttackDelta = (attack: ShortAttack): Coord =>
  getDelta({ from: attack.from, to: attack.to });

export const getDelta = ({ from, to }: { from: Coord; to: Coord }) => {
  const multiplier = getMultiplier(from, to);

  return {
    row:
      from.row === to.row
        ? 0
        : from.row < to.row
        ? 1 * multiplier.row
        : -1 * multiplier.row,
    col:
      from.col === to.col
        ? 0
        : from.col < to.col
        ? 1 * multiplier.col
        : -1 * multiplier.col,
  };
};

export const getMultiplier = (
  a: Coord,
  b: Coord
): { row: number; col: number } => {
  const rowM = a.row === b.row ? 1 : Math.max(Math.abs(a.row - b.row));
  const colM = a.col === b.col ? 1 : Math.max(Math.abs(a.col - b.col));

  return Math.abs(colM) === Math.abs(rowM)
    ? {
        col: Math.abs(rowM / colM),
        row: Math.abs(rowM / colM),
      }
    : {
        col: Math.abs(a.row - b.row) === 0 ? (colM > 0 ? 1 : -1) : colM,
        row: Math.abs(a.col - b.col) === 0 ? (rowM > 0 ? 1 : -1) : rowM,
      };
};

export const checkForMoveOnDest = ({
  game,
  to,
  from,
  piece,
  dir,
}: {
  game: IGame;
  to: Coord;
  from: Coord;
  piece: Piece;
  dir: Coord;
}): Move | undefined => {
  const drawnMoves = isGameInMovePhase(game.state)
    ? game.state[piece.state.color].moves || []
    : [];

  const drawnMovesIndexedByDest = toDictIndexedBy(drawnMoves, (move) =>
    serializeCoord(move.to)
  );

  const drawnMovesIndexedByOrigin = toDictIndexedBy(drawnMoves, (move) =>
    serializeCoord(move.from)
  );

  const dist =
    Math.max(Math.abs(dir.row), Math.abs(dir.col)) > 1 // Knight only, will use dist = 1 since it's 1 jump
      ? 1
      : calculateDistanceBetween2Coords(from, to);

  const isValid = range(dist, 1).every((sq, i) => {
    const targetSq: Coord = {
      row: from.row + sq * dir.row,
      col: from.col + sq * dir.col,
    };

    if (
      targetSq.row >= game.board.state.pieceLayoutState.length ||
      targetSq.col >= game.board.state.pieceLayoutState[0].length ||
      targetSq.row < 0 ||
      targetSq.col < 0
    ) {
      return false;
    }

    const destSquare =
      game.board.state.pieceLayoutState[targetSq.row][targetSq.col];

    const serializedTargetSq = serializeCoord(targetSq);

    if (destSquare !== 0) {
      if (serializedTargetSq in drawnMovesIndexedByOrigin) {
        if (
          serializedTargetSq in drawnMovesIndexedByDest &&
          !coordsAreEqual(
            drawnMovesIndexedByDest[serializedTargetSq].from,
            from
          )
        ) {
          if (
            checkIfMovesAreOnSameDelta(
              { from, to: targetSq },
              drawnMovesIndexedByDest[serializedTargetSq]
            ) ||
            checkIfMovesAreOnExactlyOppositeDeltas(
              {
                from,
                to: targetSq,
              },
              drawnMovesIndexedByDest[serializedTargetSq]
            )
          ) {
            return false;
          }
          return i === dist - 1 ? false : true;
        }
        return true;
      }
      return false;
    }

    // target square is empty
    if (
      serializedTargetSq in drawnMovesIndexedByDest &&
      !coordsAreEqual(drawnMovesIndexedByDest[serializedTargetSq].from, from)
    ) {
      if (
        checkIfMovesAreOnExactlyOppositeDeltas(
          {
            from,
            to: targetSq,
          },
          drawnMovesIndexedByDest[serializedTargetSq]
        )
      ) {
        return false;
      }
      if (
        checkIfMovesAreOnSameDelta(
          { from, to: targetSq },
          drawnMovesIndexedByDest[serializedTargetSq]
        )
      ) {
        const prevMoveIndex = drawnMoves.findIndex((m) =>
          movesAreEqual(drawnMovesIndexedByDest[serializedTargetSq], m)
        );
        const currentIndex = drawnMoves.findIndex((m) =>
          movesAreEqual({ from, to }, m)
        );

        return i === dist - 1 || currentIndex < 0
          ? false
          : prevMoveIndex > currentIndex;
      }
      return i === dist - 1 ? false : true; // last square to check
    }

    return true;
  });

  return isValid
    ? {
        from,
        to,
        piece: piece.state,
      }
    : undefined;
};

const buildBoardFromDrawnMoves = (
  game: IGame,
  origin: Coord,
  color: Color
): IBoard => {
  const { state: gameState } = game;
  const drawnMoves = isGameInMovePhase(gameState)
    ? gameState[color].moves || []
    : [];

  return new Board({
    load: true,
    pieceRegistry: game.board.pieceRegistry,
    boardState: {
      terrainState: game.board.state.terrainState,
      pieceLayoutState: matrixInsertMany(
        game.board.state.pieceLayoutState,
        drawnMoves.reduce(
          (total, move) => {
            const pieceFromMatrix = matrixGet(
              game.board.state.pieceLayoutState,
              [move.from.row, move.from.col]
            );
            if (!pieceFromMatrix) {
              return total;
            }

            if (
              coordsAreEqual(move.to, origin) ||
              coordsAreEqual(move.from, origin)
            ) {
              return total;
            }

            return [
              ...total,
              {
                index: [move.to.row, move.to.col],
                nextVal: pieceFromMatrix,
              },
              {
                index: [move.from.row, move.from.col],
                nextVal: 0 as const,
              },
            ];
          },
          [] as {
            index: MatrixIndex;
            nextVal: 0 | IdentifiablePieceState;
          }[]
        )
      ),
    },
  });
};

export const getCastlingMovesLeftAndRight = ({
  game,
  king,
}: {
  game: IGame;
  king: Piece;
}): Move[] => {
  const from = game.board.getPieceCoordById(king.state.id);

  const { color } = king.state;

  if (!from) {
    return [];
  }

  const drawnMoves = isGameInMovePhase(game.state)
    ? game.state[king.state.color].moves || []
    : [];

  const drawnMovesIndexedByOrigin = toDictIndexedBy(drawnMoves, (move) =>
    serializeCoord(move.from)
  );

  const board = buildBoardFromDrawnMoves(game, from, color);

  return [
    { row: 0, col: 1 },
    { row: 0, col: -1 },
  ].reduce((moves, dir) => {
    const rookCoords = checkForFirstRookOnDirection({
      board,
      from,
      dir,
      color,
    });

    if (
      rookCoords &&
      game.board.state.pieceLayoutState[rookCoords.row][rookCoords.col]
    ) {
      if (serializeCoord(rookCoords) in drawnMovesIndexedByOrigin) {
        return moves;
      }
      const distance = calculateDistanceBetween2Coords(from, rookCoords);
      const kingMove: Move = {
        from,
        to: {
          row: from.row,
          col: from.col + Math.ceil(distance / 2) * dir.col,
        },
        piece: king.state,
        castle: {
          from: rookCoords,
          to: {
            row: rookCoords.row,
            col:
              rookCoords.col -
              (distance % 2 === 0
                ? Math.floor(distance / 2 + 1) * dir.col
                : Math.ceil(distance / 2) * dir.col),
          },
        },
      };
      return [...moves, kingMove];
    }
    return moves;
  }, [] as Move[]);
};

export const checkForFirstRookOnDirection = ({
  board,
  from,
  dir,
  color,
}: {
  board: IBoard;
  from: Coord;
  dir: Coord;
  color: Color;
}): Coord | undefined => {
  let skip = false;
  const check = range(board.state.pieceLayoutState[0].length, 1).reduce(
    (result, nextSquareIndex) => {
      if (skip) {
        return result;
      }

      const targetSq: Coord = {
        row: from.row + dir.row * nextSquareIndex,
        col: from.col + dir.col * nextSquareIndex,
      };

      if (
        targetSq.col < board.state.pieceLayoutState[0].length &&
        targetSq.col > -1
      ) {
        const checkForPieceAsPieceState = matrixGet(
          board.state.pieceLayoutState,
          [targetSq.row, targetSq.col]
        );

        const checkForPiece =
          checkForPieceAsPieceState &&
          board.getPieceById(checkForPieceAsPieceState.id);

        if (checkForPiece) {
          if (
            checkForPiece.castlingRole === 'castlee' &&
            checkForPiece.state.color === color &&
            !checkForPiece.state.pieceHasMoved
          ) {
            skip = true;
            return [...result, targetSq];
          }
          skip = true;
          return result;
        }
        return result;
      }
      return result;
    },
    [] as Coord[]
  );

  return check.length === 0 ? undefined : check[0];
};

export const getAllAdjecentPiecesToPosition = (
  pos: Coord,
  pieceLayout: PieceLayoutState,
  direction?: Coord[]
): IdentifiablePieceState[] => {
  return (
    direction || [
      { row: -1, col: 0 },
      { row: -1, col: 1 },
      { row: 0, col: 1 },
      { row: 1, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: -1 },
      { row: 0, col: -1 },
      { row: -1, col: -1 },
    ]
  ).reduce((accum, dir) => {
    const target: Coord = { row: pos.row + dir.row, col: pos.col + dir.col };

    if (
      target.row >= pieceLayout.length ||
      target.col >= pieceLayout[0].length ||
      target.row < 0 ||
      target.col < 0
    ) {
      return accum;
    }

    const targetPiece = pieceLayout[target.row][target.col];

    if (targetPiece === 0) {
      return accum;
    }

    return [...accum, targetPiece];
  }, [] as IdentifiablePieceState[]);
};

export const toReadableMove = (m: ShortMove) =>
  `${m.from.row},${m.from.col} > ${m.to.row},${m.to.col}`;

export const isPieceRef = <PR extends PieceRegistry>(
  pr: PR,
  r: unknown
): r is keyof PR => typeof r === 'string' && r in pr;
