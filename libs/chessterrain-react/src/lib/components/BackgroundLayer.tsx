import React, { useMemo } from 'react';

type Props = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
> & {
  squareSize: number;
  lightColor: string;
  darkColor: string;
};

const getSvg = (p: { darkColor: string }) =>
  `<svg\
    xmlns='http://www.w3.org/2000/svg'\
    fill-opacity='1'\
    fill='${p.darkColor}'\
    width='2px'\
    height='2px'\
  >\
    <rect x='1' width='1' height='1'/>\
    <rect y='1' width='1' height='1'/>\
  </svg>`;

const sanitizeHex = (color: string) => {
  if (color[0] === '#') {
    return `%23${color.slice(1)}`;
  }

  return color;
};

export const BackgroundLayer: React.FC<Props> = React.memo(
  ({ squareSize, darkColor, lightColor, style, ...props }) => {
    const backgroundImage = useMemo(
      () =>
        `url("data:image/svg+xml,${getSvg({
          darkColor: sanitizeHex(darkColor),
        })}")`,
      [darkColor]
    );

    return (
      <div
        style={{
          backgroundColor: lightColor,
          backgroundImage,
          backgroundRepeat: 'repeat',
          backgroundSize: squareSize * 2,
          ...style,
        }}
        {...props}
      />
    );
  }
);
