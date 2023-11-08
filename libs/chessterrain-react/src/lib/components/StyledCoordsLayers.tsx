import React, { CSSProperties } from 'react';
import { serializeCoord } from '../util-kit';
import { StyledTerrainCoord } from '../types';

type Props = {
  styledCoordsList: StyledTerrainCoord[];
  squareSize: number;
  style?: CSSProperties;
};

export const StyledCoordsLayer: React.FC<Props> = ({
  styledCoordsList,
  squareSize,
  style,
}) => (
  <div style={style}>
    {styledCoordsList.map(({ style: coordStyle, className, ...coord }) => (
      <div
        key={serializeCoord(coord)}
        className={className}
        style={{
          ...coordStyle,
          position: 'absolute',
          left: coord.col * squareSize,
          top: coord.row * squareSize,
          width: squareSize,
          height: squareSize,
        }}
      >
        {/* <span>{serializeCoord(coord)}</span> */}
      </div>
    ))}
  </div>
);
