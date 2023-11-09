import { Chess } from 'chess.js';
import { GeneralPieceLayoutState } from '../Piece/types';
import { matrixMap } from '../util-kit';

type ChessBoard = ReturnType<Chess['board']>;
export const chessBoardToPieceLayout = (
  b: ChessBoard
): GeneralPieceLayoutState =>
  matrixMap(b, (s) =>
    s
      ? { id: `${s.color}:${s.type.toUpperCase()}:${s.square}`, color: s.color }
      : 0
  );

// export const coordToSq
