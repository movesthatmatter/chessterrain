import type {
  BlackColor,
  Color,
  FullGameTurn,
  GameTurn,
  PartialGameTurn,
  ShortAttack,
  ShortColor,
  ShortMove,
  WhiteColor,
} from '../commonTypes';
import { GamePhase } from '../Game/types';
import {
  type Coord,
  type MatrixIndex,
  calculateDistanceBetween2Coords,
  coordsAreEqual,
} from '../util-kit';

// I don't know why this needs to be typed like this
//  with a function declaration but if it's declared
//  as an anonymous function it throws a tsc error
export function toOppositeColor<C extends Color>(
  c: C
): C extends WhiteColor ? BlackColor : WhiteColor;
export function toOppositeColor<C extends Color>(c: C) {
  return c === 'white' ? 'black' : 'white';
}

export function toOppositePhase<P extends GamePhase>(
  p: P
): P extends 'move' ? 'attack' : 'move';
export function toOppositePhase<P extends GamePhase>(p: P) {
  return p === 'move' ? 'attack' : 'move';
}

export const isMeleeAttack = (attack: ShortAttack) =>
  calculateDistanceBetween2Coords(attack.to, attack.from) < 2;

export const isRangeAttack = (attack: ShortAttack) =>
  calculateDistanceBetween2Coords(attack.to, attack.from) > 1;

export const isPartialGameTurn = (g: GameTurn): g is PartialGameTurn =>
  !isFullGameTurn(g);

export const isFullGameTurn = (g: GameTurn): g is FullGameTurn => !!(g && g[1]);

export const toShortColor = (c: Color | ShortColor): ShortColor =>
  c[0] as ShortColor;

// TODO: Eliminate the need for this so it doesn't take extra size space
export const toLongColor = (c: Color | ShortColor): Color =>
  c === 'b' || c === 'black' ? 'black' : 'white';

export const coordToMatrixIndex = (c: Coord): MatrixIndex => [c.row, c.col];
export const matrixIndexToCoord = ([row, col]: MatrixIndex): Coord => ({
  row,
  col,
});

export const movesAreEqual = (a: ShortMove, b: ShortMove) => {
  const coordsEqual =
    coordsAreEqual(a.from, b.from) && coordsAreEqual(a.to, b.to);

  if (!coordsEqual) {
    return false;
  }

  const castleEqual = a.castle
    ? b.castle
      ? coordsAreEqual(a.castle.from, b.castle.from) &&
        coordsAreEqual(a.castle.to, b.castle.to)
      : false
    : b.castle
    ? false
    : true;

  if (!castleEqual) {
    return false;
  }

  const promotionEqual = a.promotion
    ? b.promotion
      ? a.promotion === b.promotion
      : false
    : b.promotion
    ? false
    : true;

  return coordsEqual && castleEqual && promotionEqual;
};
