export type RelativeCoord = {
  row: number;
  col: number;
};

export type SerializedCoord = `${number},${number}`;

// @deprecate in favor of Absolute Coord
// export type PointCoord = {
//   x: number;
//   y: number;
// };

export type AbsoluteCoord = {
  x: number;
  y: number;
};

// @deprecate in favor of RelativeCoord
// export type BoardCoord = Coord;

// The relative coord is used for sugar
export type Coord = RelativeCoord;
