import { Color } from '../commonTypes';
import { Coord } from '../util-kit';
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
  `${string}:${Coord['row']}-${Coord['col']}`;

export type IdentifiablePieceState<PR extends PieceRegistry = PieceRegistry> = {
  // id: string; // color-pieceName-uniqueNumber
  id: PieceId<PR>;
} & PieceState;

export type PieceFactory = (
  id: IdentifiablePieceState<any>['id'],
  dynamicProps?: Partial<PieceDynamicProps>
) => Piece;

export type PieceRegistry = Record<string, PieceFactory>;

export type SerializedPiece = ReturnType<Piece['serialize']>;

export type CastlingRole = 'castler' | 'castlee' | 'none';
