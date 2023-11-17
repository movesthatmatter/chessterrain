import { TerrainState } from '../Terrain';
import { Color, ShortColor } from '../commonTypes';
import { Coord, Matrix } from '../util-kit';
import { Piece } from './Piece';

export type PieceStaticProps = {
  label: string; // pawn, knight, bishop, queen, king, but also beserk king and whatever other new ones
  color: Color;
  maxHitPoints: number; // static
};

export type PieceType = 'Q' | 'N' | 'K' | 'B' | 'R' | 'P' | 'BK';

export type PieceDynamicProps = {
  // Health
  hitPoints: number;

  //Check against initial position
  pieceHasMoved?: boolean;

  // TODO: The Attack Bonus or other Special Rules & Crits will come later!
  // bonus?: {
  //   affectedKeys: keyof PieceState<string>;
  //   isActive: boolean;
  // }
};

export type PieceState<L extends string = string> = PieceStaticProps &
  PieceDynamicProps;

export type PieceId<PR extends PieceRegistry = PieceRegistry> =
  // | `${ShortColor}:${string}:${Coord['row']}-${Coord['col']}` // color:pieceName:coord
  `${ShortColor}:${string}:${string}`; // 'color:pieceName:uniqueNumber'

export type IdentifiablePieceState<PR extends PieceRegistry = PieceRegistry> = {
  // id: string; //
  id: PieceId<PR>;
} & PieceState;

export type PieceFactory = (
  id: IdentifiablePieceState<any>['id'],
  dynamicProps?: Partial<PieceDynamicProps>
) => Piece;

export type PieceRegistry = Record<string, PieceFactory>;

export type SerializedPiece = ReturnType<Piece['serialize']>;

export type CastlingRole = 'castler' | 'castlee' | 'none';

// Added in the new in the generalized chessterrain
export type UniquePiece<
  PR extends PieceRegistry = PieceRegistry,
  PieceState = undefined
> = { id: PieceId<PR> } & PieceState;

export type IdentifiablePiece<
  PR extends PieceRegistry = PieceRegistry,
  PieceState = undefined
> = PieceState extends undefined
  ? { id: PieceId<PR>; color: ShortColor }
  : { id: PieceId<PR>; color: ShortColor; state: PieceState };

// This is for chess -bP wP without having to give the full id just the piece kind
export type NonUniquePiece<PR extends PieceRegistry = PieceRegistry> = {
  kind: keyof PR;
};

export type AnyPiece<PR extends PieceRegistry = PieceRegistry> =
  | UniquePiece<PR>
  | NonUniquePiece;

// Added in the new chessterraim

export type GeneralPieceLayoutState<PR extends PieceRegistry = PieceRegistry> =
  // | Matrix<0 | UniquePiece<PR>> // This is for Maha like where each piece has a state
  Matrix<0 | IdentifiablePiece<PR>>; // This is for Chess like where there's no state

export type GeneralBoardState<PR extends PieceRegistry = PieceRegistry> = {
  terrainState: TerrainState;
  pieceLayoutState: GeneralPieceLayoutState<PR>;
};
