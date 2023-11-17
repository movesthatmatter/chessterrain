import React, { CSSProperties, ReactNode, useMemo } from 'react';
import { Coord, makeStyles, MatrixIndex, matrixReduce } from '../util-kit';
import { GeneralBoardState, IdentifiablePiece } from '../Piece/types';
import { matrixIndexToCoord } from '../util';
import { ShortColor } from '../commonTypes';

export type PiecesLayerProps = {
  pieceLayoutState: GeneralBoardState['pieceLayoutState'];
  squareSize: number;
  isFlipped: boolean;
  style?: CSSProperties;

  renderPiece: (p: {
    piece: IdentifiablePiece;
    color: ShortColor;
    label: string;
    isFlipped: boolean;
    coord: Coord;
    squareSize: number;
  }) => ReactNode;
};

export const PiecesLayer: React.FC<PiecesLayerProps> = React.memo(
  ({ pieceLayoutState, squareSize, isFlipped, style, renderPiece }) => {
    const renderContent = useMemo(() => {
      // This is super important in order to not reorder the pieces and break animations!
      // TODO: Look into optimizing it even more!
      const pieceCoordsAndIdSortedById =
        getPiecesCoordsAndId(pieceLayoutState).sort(sortById);

      const maxZIndex =
        pieceLayoutState[0].length * 10 + pieceLayoutState[0].length;

      return pieceCoordsAndIdSortedById.map(({ coord, index }) => {
        const piece = (pieceLayoutState[coord.row] || [])[coord.col];

        if (!piece) {
          return null;
        }

        const color = piece.id.slice(0, piece.id.indexOf(':'))[0] as ShortColor;

        const pieceWoColor = piece.id.slice(color.length + 1);
        const label = pieceWoColor.slice(0, pieceWoColor.indexOf(':'));

        const currentZindex = index[0] * 10 + index[1];
        const zIndex = isFlipped ? maxZIndex - currentZindex : currentZindex;

        return (
          <div
            key={piece.id}
            className={cls.pieceContainer}
            style={{
              left: coord.col * squareSize,
              top: coord.row * squareSize,
              zIndex,
            }}
          >
            {renderPiece({
              piece,
              label,
              color,
              isFlipped,
              coord,
              squareSize,
            })}
          </div>
        );
      });
    }, [pieceLayoutState, squareSize, renderPiece]);

    return <div style={style}>{renderContent}</div>;
  }
);

const cls = makeStyles({
  pieceContainer: {
    position: 'absolute',
    zIndex: 9,
    transition: 'all 150ms linear',
  },
});

const sortById = (a: { id: string }, b: { id: string }) =>
  a.id < b.id ? -1 : a.id > b.id ? 1 : 0;

const getPiecesCoordsAndId = (
  pieceLayoutState: GeneralBoardState['pieceLayoutState']
) =>
  matrixReduce(
    pieceLayoutState,
    (accum, next, index) =>
      next === 0
        ? accum
        : [
            ...accum,
            {
              id: next.id,
              coord: matrixIndexToCoord(index),
              index,
            },
          ],
    [] as { id: string; coord: Coord; index: MatrixIndex }[]
  );
