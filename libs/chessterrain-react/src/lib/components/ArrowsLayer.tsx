import React, { CSSProperties, useMemo } from 'react';
import { LineVector } from '../commonTypes';
import { invoke } from '../util-kit';

const DEFAULT_ARROW_STROKE_COLOR = 'purple';

export type Arrow = LineVector & {
  strokeColor?: string;
  // strokeGradient?: [offsetPercentage: number, color: string][];
  strokeGradient?: { fromColor: string; toColor: string };
  width: number;
  minimal?: boolean;
  isDashed?: boolean;
  isFreeArrow?: boolean;
};

type Props = {
  width: number;
  height: number;
  fill?: string;
  style?: CSSProperties;
  arrows?: Arrow[];
};

const toArrowId = (arrow: Arrow) => {
  return arrow.isFreeArrow
    ? 'free-arrow'
    : `${arrow.from.x},${arrow.from.y}-${arrow.to.x},${arrow.to.y}`;
};

export const ArrowsLayer: React.FC<Props> = ({
  width,
  height,
  arrows,
  style,
}) => {
  const containerStyle = useMemo(
    () => ({ width, height, ...style } as const),
    [style, width, height]
  );

  return (
    <div style={containerStyle}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
      >
        {arrows?.map((arrow, i) => {
          const arrowId = toArrowId(arrow);

          const linearGradient =
            arrow.strokeGradient && !arrow.isFreeArrow
              ? invoke(() => {
                  const id = `gradient-${arrowId}`;

                  return {
                    id,
                    render: (
                      <linearGradient
                        id={id}
                        x1={arrow.to.x}
                        y1={arrow.to.y}
                        x2={arrow.from.x}
                        y2={arrow.from.y}
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop
                          stopColor={arrow.strokeGradient?.toColor}
                          offset="0"
                        />
                        <stop
                          stopColor={arrow.strokeGradient?.fromColor}
                          offset="100"
                        />
                      </linearGradient>
                    ),
                  };
                })
              : undefined;

          return (
            <React.Fragment key={i}>
              <defs>
                {linearGradient && linearGradient.render}
                <marker
                  id={`arrowhead-${arrowId}`}
                  markerWidth={5}
                  markerHeight={5}
                  refX={0.5}
                  refY={1}
                  orient="auto"
                >
                  <circle
                    cx="1.2"
                    cy="1.2"
                    r="1.2"
                    fill={arrow.strokeColor || DEFAULT_ARROW_STROKE_COLOR}
                  />
                </marker>
              </defs>
              <line
                strokeWidth={arrow.width}
                x1={arrow.from.x}
                y1={arrow.from.y}
                x2={arrow.to.x}
                y2={arrow.to.y}
                stroke={
                  linearGradient
                    ? `url(#${linearGradient.id})`
                    : arrow.strokeColor || DEFAULT_ARROW_STROKE_COLOR
                }
                markerEnd={`url(#arrowhead-${toArrowId(arrow)})`}
                {...{
                  ...(arrow.isDashed && {
                    strokeDasharray: '1, 14',
                    strokeLinecap: 'round',
                  }),
                }}
              />
            </React.Fragment>
          );
        })}
      </svg>
    </div>
  );
};
