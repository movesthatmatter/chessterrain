import { MouseEvent } from 'react';
import { Arrow } from '../components/ArrowsLayer';
import { RelativeArrow } from '../types';
import { AbsoluteCoord, Coord, RelativeCoord } from '../util-kit';
import { getMoveDelta } from '../Piece/util';

export const getDOMRectFromMouseEvent = (e: MouseEvent): DOMRect =>
  (e.target as HTMLElement).getBoundingClientRect();

export const getMouseCoordsInRect = (
  e: MouseEvent,
  rect: DOMRect
): AbsoluteCoord => ({
  x: e.clientX - rect.left, // x position within the element.,
  y: e.clientY - rect.top, // y position within the element.,
});

export const flipAbsoluteCoords = (
  coords: AbsoluteCoord,
  rect: Pick<DOMRect, 'width' | 'height'>
) => ({
  x: rect.width - coords.x,
  y: rect.height - coords.y,
});

export const isMouseInRect = (e: MouseEvent) => {
  const rect = (e.target as any).getBoundingClientRect();

  return (
    e.clientX > rect.left &&
    e.clientX < rect.right &&
    e.clientY > rect.top &&
    e.clientY < rect.bottom
  );
};

export const coordToArrow = (squareSize: number, val: number) =>
  val * squareSize + squareSize / 2;

export const isHorizontalMove = (from: Coord, to: Coord) => from.row === to.row;

export const isVerticalMove = (from: Coord, to: Coord) => from.col === to.col;

export const isDiagonalMove = (from: Coord, to: Coord) =>
  from.row !== to.row && from.col !== to.col;

export const determineArrowMargin = (
  arrow: Arrow | RelativeArrow | undefined,
  squareSize: number
): {
  from: { x: number; y: number };
  to: { x: number; y: number };
} => {
  if (!arrow) {
    return {
      from: { x: 0, y: 0 },
      to: { x: 0, y: 0 },
    };
  }
  const from: Coord =
    'x' in arrow.from && 'y' in arrow.from
      ? { row: arrow.from.y, col: arrow.from.x }
      : { row: arrow.from.row, col: arrow.from.col };

  const to: Coord =
    'x' in arrow.to && 'y' in arrow.to
      ? { row: arrow.to.y, col: arrow.to.x }
      : { row: arrow.to.row, col: arrow.to.col };

  if (isDiagonalMove(from, to)) {
    if (
      Math.abs(getMoveDelta({ from, to }).col) > 1 ||
      Math.abs(getMoveDelta({ from, to }).row) > 1
    ) {
      return {
        from: {
          x:
            Math.abs(from.col - to.col) > 1
              ? (squareSize / 3) * (from.col - to.col < 0 ? 1 : -1)
              : 0,
          y:
            Math.abs(from.row - to.row) > 1
              ? (squareSize / 3) * (from.row - to.row < 0 ? 1 : -1)
              : 0,
        },
        to: {
          x:
            Math.abs(from.col - to.col) > 1
              ? (squareSize / 2) * (from.col - to.col < 0 ? 1 : -1)
              : 0,
          y:
            Math.abs(from.row - to.row) > 1
              ? (squareSize / 2) * (from.row - to.row < 0 ? 1 : -1)
              : 0,
        },
      };
    }
    return {
      from: {
        x: (squareSize / 3) * (from.col - to.col < 0 ? 1 : -1),
        y: (squareSize / 3) * (from.row - to.row < 0 ? 1 : -1),
      },
      to: {
        x: (squareSize / 1.8) * (from.col - to.col < 0 ? 1 : -1),
        y: (squareSize / 1.8) * (from.row - to.row < 0 ? 1 : -1),
      },
    };
  }
  return {
    from: {
      x: isHorizontalMove(from, to)
        ? (squareSize / 3) * (from.col - to.col < 0 ? 1 : -1)
        : 0,
      y: isVerticalMove(from, to)
        ? (squareSize / 3) * (from.row - to.row < 0 ? 1 : -1)
        : 0,
    },
    to: {
      x: isHorizontalMove(from, to)
        ? (squareSize / 1.8) * (from.col - to.col < 0 ? 1 : -1)
        : 0,
      y: isVerticalMove(from, to)
        ? (squareSize / 1.8) * (from.row - to.row < 0 ? 1 : -1)
        : 0,
    },
  };
};

/**
 * Translates absolute coords (px) to Relative Coords
 *
 * @param param0
 * @returns
 */
// export const getBoardCoordsFromAbsoluteCoords = ({
//   absoluteCoords,
//   squareSize,
// }: {
//   absoluteCoords: AbsoluteCoord;
//   squareSize: number;
// }): RelativeCoord => ({
//   row: Math.floor(absoluteCoords.y / squareSize),
//   col: Math.floor(absoluteCoords.x / squareSize),
// });
