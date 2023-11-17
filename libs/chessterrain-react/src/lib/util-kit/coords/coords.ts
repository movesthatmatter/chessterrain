import { AbsoluteCoord, Coord, RelativeCoord, SerializedCoord } from './types';

export const serializeCoord = (c: Coord): SerializedCoord =>
  `${c.row},${c.col}`;

export const isRelativeCoord = (
  c: AbsoluteCoord | RelativeCoord
): c is RelativeCoord =>
  'row' in c &&
  'col' in c &&
  typeof c.row === 'number' &&
  typeof c.col === 'number';

export const isAbsoluteCoord = (c: AbsoluteCoord | RelativeCoord) => {
  return (
    'x' in c && 'y' in c && typeof c.x === 'number' && typeof c.y === 'number'
  );
};

export const coordsAreEqual = (a: Coord, b: Coord) =>
  a.col === b.col && a.row === b.row;

export const calculateDistanceBetween2Coords = (
  dest: Coord,
  target: Coord
): number =>
  Math.max(Math.abs(dest.row - target.row), Math.abs(dest.col - target.col));

export const absoluteCoordsToRelativeCoords = (
  absoluteCoords: AbsoluteCoord,
  squareSize: number
): RelativeCoord => ({
  row: Math.floor(absoluteCoords.y / squareSize),
  col: Math.floor(absoluteCoords.x / squareSize),
});
