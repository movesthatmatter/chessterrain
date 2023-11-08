import { Asset } from '../util-kit';
import React, { CSSProperties } from 'react';

type Props = {
  width: number | string;
  asset: Asset;
  label: string;
  className?: string;
  style?: CSSProperties;
};

export const TerrainPieceGraphic: React.FC<Props> = ({
  width,
  asset,
  label,
  className,
  style,
}) => (
  <img
    src={asset.path}
    alt={label}
    style={{ width, ...style }}
    className={className}
  />
);
