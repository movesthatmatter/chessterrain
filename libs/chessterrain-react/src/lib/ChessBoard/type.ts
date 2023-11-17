import { Square } from 'chess.js';
import { GeneralPieceLayoutState, PieceRegistry } from '../Piece/types';

export type ChessMove = {
  from: Square;
  to: Square;
};

export type ChessPieceLayout = GeneralPieceLayoutState<PieceRegistry>;


export type ChessPGN = string;

export type ChessFEN = string;