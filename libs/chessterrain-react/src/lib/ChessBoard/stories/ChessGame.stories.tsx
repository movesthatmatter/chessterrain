import React from 'react';
import type { Meta, StoryObj, StoryFn } from '@storybook/react';
import { GameConfigurator } from '../../Game/types';
import { Terrain } from '../../Terrain';
// import { chessBoardToPieceLayout } from '../util/chess';
import { dark } from '../../assets/pieces';

// import chess from 'chess';
import { Chess, Move, Square } from 'chess.js';
import { useCallbackIf } from '../../hooks/useCallbackIf';
import { useState } from 'react';
import { Color, ShortColor } from '../../commonTypes';
import { AbsoluteCoord } from '../../util-kit';
import { ChessBoardAsClass, ChessBoardAsClassProps } from '../ChessBoardAsClass';
import { ChessGame } from './ChessGame';

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

const meta: Meta<typeof ChessGame> = {
  component: ChessGame,
  title: 'ChessGame',
};

export default meta;
type Story = StoryObj<typeof ChessGame>;

export const Main: Story = {
  args: {
    sizePx: 500,
    playingColor: 'white',
    showAnnotations: true,
    canInteract: true,
  },
};



// import { getNewChessGame, toChessColor } from '../../lib';
// import { getCurrentChessBoardGameState, isPromotableMove } from './util';
// import {
//   ChessGameColor,
//   ChessGameStateFen,
//   ChessGameStatePgn,
//   ChessHistory,
//   ChessHistoryMove,
//   ChessMove,
//   GameRecord,
//   SimplePGN,
// } from 'chessroulette-io';
// import { StyledChessBoard, StyledChessBoardProps } from './StyledChessBoard';
// import { otherChessColor } from 'chessroulette-io/dist/chessGame/util/util';
// import { ChessBoardConfig, ChessBoardType, ChessBoardGameState } from './types';

// import { Chess } from 'chess.js';



// export const Heading: Story = {
//   args: {},
//   play: async ({ canvasElement }) => {
//     const canvas = within(canvasElement);
//     expect(canvas.getByText(/Welcome to ChessTerrain!/gi)).toBeTruthy();
//   },
// };
