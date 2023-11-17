import { CSSProperties } from 'react';

export const hoveredOwnPieceSquareStyle: CSSProperties = {
  background: 'rgba(0, 163, 255, .3)',
  borderRadius: '20%',
  transform: 'scale(.925)',
};

export const touchedPieceSquareStyle: CSSProperties = {
  background: 'rgba(0, 163, 255, .6)',
  borderRadius: '20%',
  // scale: '.9',
  transform: 'scale(.9)',
  // background: 'rgba(255, 0, 255)',
  // transform: 'scale(.3)',
  // transform: 'skew(100deg)',
  // boxShadow: '0px 0px 20px 0px red',
  // boxShadow: `0 0 120px 60px rgba(0, 163, 255, .6), 0 0 100px 60px rgba(0, 163, 255, 1)`,
  // background: '#0ff',
  // border: '5px solid black',
  // width: '10% !important',
  // height: '10% !important',
  // scale: '.8',
};