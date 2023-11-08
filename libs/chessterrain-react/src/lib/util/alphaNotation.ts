// import { Coord, range } from '../../../../util-kit/src';
import { ShortMove } from '../commonTypes';
import { Coord } from '../util-kit';

const alphaFileKeys = [
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'q',
  'r',
  's',
  't',
  'u',
  'v',
  'w',
  'x',
  'y',
  'z',
] as const;

export type AlphaNotation = `${string}${number}`;

// This is a dynamic notation of the form a1, b2, ..., z35
// It is only limited by the amount of letter but that could be extended somehow as well
export const coordToAlphaNotation = (c: Coord, maxRow = 8, maxCol = maxRow) => {
  const rank = maxCol - c.row;
  const file = alphaFileKeys[c.col];

  return `${file}${rank}`;
};

type AlphaNotationRegularMove = `${AlphaNotation}${AlphaNotation}`;
type AlphaNotationPromotingMove =
  `${AlphaNotationRegularMove}=${AlphaNotationRegularMove}`;
export type AlphaNotationMove =
  | AlphaNotationRegularMove
  | AlphaNotationPromotingMove;

export const moveToAlphaNotationMove = (m: ShortMove): AlphaNotationMove =>
  `${coordToAlphaNotation(m.from)}${coordToAlphaNotation(m.to)}${
    m.castle ? '-' + moveToAlphaNotationMove(m.castle) : ''
  }${m.promotion ? '=' + m.promotion : ''}` as AlphaNotationMove;

// TODO: Don't hardcode these to chess or 8x8 but allow it be given at config time
export const indexedFiles = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
export const indexedRanks = ['8', '7', '6', '5', '4', '3', '2', '1'] as const;

// export const alphaSquareToCoord = (an: AlphaNotation): Coord => {

// const letters = an.slice(0, an.indexOf(\/[0-9]))

// const row = an.length - Number(an.);
// const col = alphaFileKeys[an[0] as keyof typeof alphaFileKeys];

// return { row, col };
// };
// tupleCoordToMahaChessSquare([
//   c.row,
//   c.col,
// ] as AcceptableTupleCoordForMahaChessSquare);

// export const moveToChessNotation = (m: ShortMove): string =>
//   `${coordToMahaChessSquare(m.from)}${coordToMahaChessSquare(m.to)}${
//     m.castle ? '-' + toMPGNMove(m.castle) : ''
//   }${m.promotion ? '=' + m.promotion : ''}`;
