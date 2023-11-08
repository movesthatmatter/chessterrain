import React, { useMemo } from 'react';
import { Coord, objectKeys } from '../util-kit';
import { Color } from '../commonTypes';

export type PromotionDialogLayerProps = {
  isFlipped: boolean;
  squareSize: number;
  promotion: Coord;
  playingColor: Color;
  promotablePiecesMap: Record<string, unknown | null | undefined>;
  onPromotePiece: (p: string) => void;
  renderPromotablePiece: (p: {
    ref: string;
    squareSize: number;
    isFlipped: boolean;
  }) => React.ReactNode;
};

export const PromotionDialogLayer: React.FC<PromotionDialogLayerProps> = ({
  isFlipped,
  squareSize,
  promotion,
  playingColor,
  promotablePiecesMap,
  onPromotePiece,
  renderPromotablePiece,
}) => {
  const promoPositionHorizontal = useMemo(
    () => (promotion ? promotion.col * squareSize : 0),
    [promotion, squareSize]
  );

  const piecesListRender = useMemo(() => {
    const piecesAsList = objectKeys(promotablePiecesMap)
      .map((ref) => {
        const color: Color = ref[0] === 'w' ? 'white' : 'black';

        return {
          color,
          ref,
          asset: promotablePiecesMap[ref],
        } as const;
      })
      .filter((p) => p.color === playingColor);

    return piecesAsList.map((p) => (
      <span
        key={p.ref}
        role="presentation"
        onClick={() => onPromotePiece(p.ref)}
      >
        {renderPromotablePiece({
          ref: p.ref,
          squareSize,
          isFlipped,
        })}
        {/* <TerrainPieceGraphic
          asset={p.asset}
          label={p.ref}
          width={squareSize / 1.3}
        /> */}
      </span>
    ));
  }, [
    promotablePiecesMap,
    playingColor,
    isFlipped,
    squareSize,
    onPromotePiece,
  ]);

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        background: `rgba(0, 0, 0, .3)`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          backgroundColor: '#fff',
          left: promoPositionHorizontal,
          ...(isFlipped ? { bottom: 0 } : { top: 0 }),
        }}
      >
        <div
          style={{
            textAlign: 'center',
            cursor: 'pointer',
            display: 'flex',
            width: squareSize,
            flexDirection: 'column',
            gap: '10px',
            ...(isFlipped && {
              transform: 'scaleY(-1)',
            }),
          }}
        >
          {piecesListRender}
        </div>
      </div>
    </div>
  );
};
