import { Chess, Square } from 'chess.js';
import { GeneralPieceLayoutState } from '../Piece/types';
import { RelativeCoord, matrixMap } from '../util-kit';
import { ChessFEN } from './type';

type ChessBoard = ReturnType<Chess['board']>;
export const chessBoardToPieceLayout = (
  b: ChessBoard
): GeneralPieceLayoutState =>
  matrixMap(b, (s) =>
    s
      ? { id: `${s.color}:${s.type.toUpperCase()}:${s.square}`, color: s.color }
      : 0
  );

export const FENToChessBoard = (fen: ChessFEN) => new Chess(fen).board();

// export const relativeCoordToSq = (coord: RelativeCoord): Square => {
//   coord.row
// }

export const indexedFiles = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
export const indexedRanks = ['8', '7', '6', '5', '4', '3', '2', '1'] as const;

type AcceptableTupleCoordForChessSquare = [
  row: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7,
  col: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
];

const tupleCoordToMahaChessSquare = ([
  row,
  col,
]: AcceptableTupleCoordForChessSquare): Square => {
  const rank = indexedRanks[row];
  const file = indexedFiles[col];

  return `${file}${rank}`;
};

export const relativeCoordToSquare = (c: RelativeCoord): Square =>
  tupleCoordToMahaChessSquare([
    c.row,
    c.col,
  ] as AcceptableTupleCoordForChessSquare);
