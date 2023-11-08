import React, { CSSProperties } from 'react';
import { cx } from '@emotion/css';
import { TerrainPieceGraphic } from './TerrainPieceGraphic';
import { Asset, makeStyles } from '../util-kit';
import { PieceState } from '../Piece/types';

export type TerrainPieceProps = {
  pieceLabel: PieceState['label'];
  asset: Asset;
  width: number | string;
  isFlipped: boolean;
  style?: CSSProperties;
  className?: string;
  overlay?: React.ReactNode;
};

export const TerrainPiece: React.FC<TerrainPieceProps> = ({
  pieceLabel,
  asset,
  style,
  isFlipped,
  className,
  overlay,
  width,
}) => (
  <div
    className={cx(cls.container, className)}
    style={{
      width,
      height: width,
      ...style,
    }}
  >
    <span className={cx(isFlipped && cls.flippedContainer)}>
      <div className={cx(cls.graphic)}>
        <TerrainPieceGraphic asset={asset} label={pieceLabel} width={width} />
        {overlay}
      </div>
    </span>
  </div>
);

const cls = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    cursor: 'pointer',

    transition: 'all 150ms linear',
  },

  flippedContainer: {
    transform: 'scaleY(-1) scaleX(-1)',
  },

  graphic: {
    transform: `scale(1.3)`,
  },
});
