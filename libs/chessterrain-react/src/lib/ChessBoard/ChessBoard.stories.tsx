import type { Meta, StoryObj, StoryFn } from '@storybook/react';
import { GameConfigurator } from '../Game/types';
import { Terrain } from '../Terrain';
// import { chessBoardToPieceLayout } from '../util/chess';
import { dark } from '../assets/pieces';

// import chess from 'chess';
import { Chess } from 'chess.js';
import { useCallbackIf } from '../hooks/useCallbackIf';
import { useState } from 'react';
import { ShortColor } from '../commonTypes';
import { AbsoluteCoord } from '../util-kit';
import { ChessBoard, ChessBoardProps } from './ChessBoard';

// const deafultTestPieceBlack = new BasePiece(
//   'black',
//   'default_test_piece_black' as PieceId
// );
// const deafultTestPieceWhite = new Pawn(
//   'white',
//   'default_test_piece_white' as PieceId
// );

// const pieceRegistry = {
//   bP: getPieceFactory((...args) => deafultTestPieceBlack),
//   wP: getPieceFactory((...args) => deafultTestPieceWhite),
// };

// const ChessTerrainWithInteractions = () => {

// }

const meta: Meta<typeof ChessBoard> = {
  component: ChessBoard,
  title: 'ChessBoard',
};

export default meta;
type Story = StoryObj<typeof ChessBoard>;

export const Main: Story = {
  args: {
    sizePx: 500,
    playingColor: 'black',
    showAnnotations: true,
  },
};

// export const Heading: Story = {
//   args: {},
//   play: async ({ canvasElement }) => {
//     const canvas = within(canvasElement);
//     expect(canvas.getByText(/Welcome to ChessTerrain!/gi)).toBeTruthy();
//   },
// };
