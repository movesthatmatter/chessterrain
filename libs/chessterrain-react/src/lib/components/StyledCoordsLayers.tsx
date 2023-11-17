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
}) => {
  console.log('styledCoordsList', styledCoordsList);

  return (
    <div style={style}>
      {styledCoordsList.map(
        ({ style: coordStyle, className, relativeCoord }) => (
          <div
            key={serializeCoord(relativeCoord)}
            className={className}
            style={{
              ...coordStyle,
              position: 'absolute',
              left: relativeCoord.col * squareSize,
              top: relativeCoord.row * squareSize,
              width: squareSize,
              height: squareSize,
            }}
          >
            {/* <span>{serializeCoord(coord)}</span> */}
          </div>
        )
      )}
    </div>
  );
};
