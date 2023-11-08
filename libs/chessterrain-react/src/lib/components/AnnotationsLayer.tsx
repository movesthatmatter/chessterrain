import { TerrainState } from '../Terrain';
import { indexedFiles, indexedRanks } from '../util';
import { range, serializeCoord } from '../util-kit';
import React, { useMemo } from 'react';

type Props = {
  terrain: TerrainState;
  squareSize: number;
  isFlipped: boolean;
};

export const AnnotationsLayer: React.FC<Props> = ({
  terrain,
  squareSize,
  isFlipped,
}) => {
  const { ranks, files } = useMemo(() => {
    const ranks = range(terrain.length, 0).map((row) => ({
      coord: {
        row: isFlipped ? terrain.length - 1 - row : row,
        col: terrain[row].length - 1,
      },
      val: indexedRanks[row],
    }));

    const files = range(terrain[0].length, 0).map((col) => ({
      coord: {
        row: terrain.length - 1,
        col: isFlipped ? terrain.length - 1 - col : col,
      },
      val: indexedFiles[col],
    }));

    return { ranks, files };
  }, [terrain, isFlipped]);

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 9,
        ...(isFlipped && {
          transform: 'scaleY(-1) scaleX(-1)',
        }),
      }}
    >
      {files.map(({ coord, val }) => (
        <div
          key={serializeCoord(coord)}
          style={{
            position: 'absolute',
            left: coord.col * squareSize,
            top: coord.row * squareSize,
            width: squareSize,
            height: squareSize,
            zIndex: 9,
            display: 'flex',
            justifyContent: 'flex-end',
            color: 'black',
            fontWeight: 'bold',

            flexDirection: 'column',
            paddingLeft: squareSize / 10,
          }}
        >
          {val}
        </div>
      ))}
      {ranks.map(({ coord, val }) => (
        <div
          key={serializeCoord(coord)}
          style={{
            position: 'absolute',
            left: coord.col * squareSize,
            top: coord.row * squareSize,
            width: squareSize,
            height: squareSize,
            zIndex: 9,
            display: 'flex',
            justifyContent: 'flex-end',
            color: 'black',
            fontWeight: 'bold',
            paddingRight: squareSize / 10,
          }}
        >
          {val}
        </div>
      ))}
    </div>
  );
};
