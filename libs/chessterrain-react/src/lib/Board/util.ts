import { IdentifiablePieceState, PieceId, PieceRegistry } from '../Piece/types';
import {
  BoardConfigurator,
  BoardState,
  PieceLayoutConfigurator,
  PieceLayoutState,
} from './types';
import { coordToMatrixIndex } from '../util';
import { terrainStateToTerrainConfigurator } from '../Terrain';
import {
  Coord,
  Matrix,
  coordsAreEqual,
  matrixGet,
  matrixMap,
} from '../util-kit';
import { Color, MoveOutcome } from '../commonTypes';

// Returns the default color at the coord for any chess based games
// TODO: Might need to make it game specific in the future if this is not enough
// export const getInitialPieceColorAtCoord = (
//   pieceLayout: Matrix<unknown>,
//   coord: Coord
// ): Color =>
//   coord.row > getMatrixRowsLength(pieceLayout) / 2 ? 'white' : 'black';

export const boardMap = <T>(
  board: BoardState,
  fn: (coord: Coord, piece: undefined | IdentifiablePieceState) => T
) => {
  return matrixMap(board.terrainState, (_, [row, col]) => {
    const coord = { row, col };

    const piece = board.pieceLayoutState[row][col];

    return fn(coord, piece || undefined);
  });
};

export const boardForEach = (
  board: BoardState,
  fn: (coord: Coord, piece: undefined | IdentifiablePieceState) => void
) => {
  boardMap(board, fn);
};

export const toPrintableBoard = (board: BoardState) => {
  return matrixMap(board.pieceLayoutState, (sqOrPiece) => {
    if (sqOrPiece === 0) {
      return 0;
    }

    return `${sqOrPiece.color[0]}${sqOrPiece.label[0]}`;
  });
};

export const toPrintableBoardWithState = (board: BoardState) => {
  return matrixMap(board.pieceLayoutState, (sq, index) => {
    if (sq === 0) {
      return 0;
    }
    return `${sq.id}\n${sq.hitPoints}/${sq.maxHitPoints}`;
  });
};

export const printBoardAsTableWithState = (
  m: Matrix<0 | {}>,
  cellWidth = 10
) => {
  console.log(
    // table(
    //   matrixMap(m, (v) => (v === 0 ? '\n' : v))
      // {
      //   columnDefault: { width: cellWidth, alignment: 'center' },
      // }
    // )
  );
};

export const toPieceId = <PR extends PieceRegistry>(
  ref: keyof PR,
  { row, col }: Coord
): PieceId<PR> => `${String(ref)}:${row}-${col}` as PieceId; // TODO: this is hardcoded but it's like this only for Maha so it will be removed

export const getRefFromPieceId = <PR extends PieceRegistry>(
  id: PieceId<PR>
): {
  ref: string;
} => ({ ref: id.slice(0, id.indexOf(':')) });

export const updateMovesWithNewPieceState = (
  moves: MoveOutcome[],
  at: Coord,
  state: Partial<IdentifiablePieceState>
) => {
  const index = moves.findIndex((m) => coordsAreEqual(m.to, at));
  if (index > -1) {
    [
      ...moves.slice(0, index),
      { ...moves[index], piece: state },
      ...moves.slice(index + 1),
    ];
  }
  return moves;
};

export const getSquareColor = (
  board: BoardState,
  sq: Coord
): Color | undefined => {
  const val = matrixGet(board.terrainState, coordToMatrixIndex(sq));

  if (val === 'b') {
    return 'black';
  } else if (val === 'w') {
    return 'white';
  }

  return undefined;
};

export const pieceLayoutStateToPieceLayout = <
  PR extends PieceRegistry = PieceRegistry
>(
  pls: PieceLayoutState<PR>
): PieceLayoutConfigurator<PR> =>
  matrixMap(pls, (sq) => (sq === 0 ? 0 : getRefFromPieceId(sq.id).ref));

export const boardStateToBoardConfigurator = <
  PR extends PieceRegistry = PieceRegistry
>(
  bs: BoardState<PR>
): BoardConfigurator<PR> => ({
  terrain: terrainStateToTerrainConfigurator(bs.terrainState),
  pieceLayout: pieceLayoutStateToPieceLayout(bs.pieceLayoutState),
});
