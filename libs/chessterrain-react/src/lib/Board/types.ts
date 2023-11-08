import { IdentifiablePieceState, PieceRegistry } from '../Piece/types';
import { Piece } from '../Piece/Piece';
import { Coord, Matrix } from '../util-kit';
import { TerrainConfigurator, TerrainState } from '../Terrain';

export type PieceMetaMappedById<PR extends PieceRegistry> = Record<
  Piece['state']['id'],
  {
    piece: Piece;
    coord: Coord;
    ref: PieceRef<PR>;
  }
>;

export type PieceRef<PR extends PieceRegistry> = keyof PR;

export type PiecesState<PR extends PieceRegistry> = {
  layoutMatrix: Matrix<Piece['state']['id'] | 0>;
  pieceById: PieceMetaMappedById<PR>;
};

export type PieceLayoutState<PR extends PieceRegistry = PieceRegistry> = Matrix<
  0 | IdentifiablePieceState<PR>
>; // 0 means no Piece

// export type PieceLayout = Matrix<0 | Piece<string>>; // 0 means no Piece

export type BoardState<PR extends PieceRegistry = PieceRegistry> = {
  terrainState: TerrainState;
  pieceLayoutState: PieceLayoutState<PR>;
};

export type PieceLayoutConfigurator<PR extends PieceRegistry = PieceRegistry> =
  Matrix<keyof PR | `${Extract<keyof PR, string>}[${string}]` | 0>;

export type BoardConfigurator<PR extends PieceRegistry = PieceRegistry> = {
  terrain: TerrainConfigurator;
  pieceLayout: PieceLayoutConfigurator<PR>;
};
