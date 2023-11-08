import { deserializeCoord, SerializedCoord } from '../util-kit';
import React from 'react';

type Props = {
  overlays: Record<
    SerializedCoord,
    | React.ReactNode
    | ((p: { squareSize: number; isFlipped: boolean }) => React.ReactNode)
  >;
  squareSize: number;
  isFlipped: boolean;
};

export const OverlaysLayer: React.FC<Props> = ({
  overlays,
  squareSize,
  isFlipped,
}) => {
  return (
    <>
      {Object.entries(overlays).map(([coord, overlay]) => {
        const { row, col } = deserializeCoord(coord as SerializedCoord);

        return (
          <div
            key={coord}
            style={{
              position: 'absolute',
              left: col * squareSize,
              top: row * squareSize,
              width: squareSize,
              height: squareSize,
              pointerEvents: 'none',
              zIndex: 9999,
              ...(isFlipped && {
                transform: 'scaleY(-1) scaleX(-1)',
              }),
            }}
          >
            {typeof overlay === 'function'
              ? overlay({ squareSize, isFlipped })
              : overlay}
          </div>
        );
      })}
    </>
  );
};
