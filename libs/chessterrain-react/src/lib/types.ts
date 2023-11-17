import { CSSProperties } from 'react';
import { Arrow } from './components/ArrowsLayer';
import { AbsoluteCoord, Coord, RelativeCoord } from './util-kit';
import {
  IdentifiablePiece,
  IdentifiablePieceState,
  PieceId,
} from './Piece/types';

export type RelativeArrow = Omit<Arrow, 'from' | 'to'> & {
  from: RelativeCoord | AbsoluteCoord;
  to: RelativeCoord | AbsoluteCoord;
};

export type StyledTerrainCoord = {
  relativeCoord: RelativeCoord;
  style?: CSSProperties;
  className?: string;
};

// export type PieceComponentsMap<PR extends PieceRegistry = PieceRegistry> = {
//   [: PieceId]: (p: Omit<TerrainPieceProps, 'asset'>) => React.ReactNode;
// };

export type PiecesMap = {
  [id: PieceId]: unknown | undefined | null;
};

export type RelativeCoordsWithPiece = {
  relativeCoords: RelativeCoord;
  piece: IdentifiablePiece;
};

export type RelativeCoordsWithOptionalPiece = {
  relativeCoords: RelativeCoord;
  piece?: IdentifiablePiece;
};
