import { ShortBlackColor, ShortWhiteColor } from '../commonTypes';
import { Matrix } from '../util-kit';

export type TerrainSquareType =
  | 'x' // hole
  | ShortWhiteColor // white square
  | ShortBlackColor; // black square;

export type TerrainConfigurator = {
  width: number;
  height?: number; // if different from width
};

export type TerrainState = Matrix<TerrainSquareType>;
