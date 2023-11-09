import type { Meta, StoryObj } from '@storybook/react';
import { ChessTerrain, ChessTerrainProps } from './ChessTerrain';

import { within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';
import { Example } from './Example';
import { GameConfigurator } from './Game/types';
import { getPieceFactory } from './Piece/util';
import { Terrain } from './Terrain';
import { chessBoardToPieceLayout } from './util/chess';
import { dark } from './assets/pieces';

// import chess from 'chess';
import { Chess } from 'chess.js';
import { coordToAlphaNotation } from './util';
import { useCallbackIf } from './hooks/useCallbackIf';
import { useEffect, useMemo, useState } from 'react';
import { IdentifiablePiece } from './Piece/types';
import { PiecesLayerProps } from './components/PiecesLayer';
import { ShortColor } from './commonTypes';
import { AbsoluteCoord } from './util-kit';

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

const CONFIGURATOR: GameConfigurator<any> = {
  terrain: { width: 8 },
  pieceLayout: [
    ['bP', 'bP', 'bP', 'bP'],
    [1, 0, 0, 0],
    [0, 0, 0, 0],
    ['wP', 'wP', 'wP', 'wP'],
  ],
  // TODO: add this dynamic props going to be needed
  // pieceDynamicProps: []
};

const terrain = new Terrain({ props: { width: CONFIGURATOR.terrain.width } });

const gameClient = new Chess();

// gameClient.board

// console.log('board', gameClient.board()[0][0]);

const startingChessBoard = gameClient.board();

// const ChessTerrainWithInteractions = () => {

// }

const meta: Meta<typeof ChessTerrain> = {
  component: () => {
    // const { canHover, canTouch } = useMemo(
    //   () => ({
    //     canHover: canInteract === 'all' || canInteract === 'hover',
    //     canTouch: canInteract === 'all' || canInteract === 'touch',
    //   }),
    //   [canInteract]
    // );
    const canHover = true;
    const canTouch = true;

    const onInteractablePieceDragStarted = useCallbackIf(
      canTouch,
      (
        ...[p]: Parameters<NonNullable<ChessTerrainProps['onPieceDragStarted']>>
      ) => {
        // if (p.from.piece.color !== chessTerrainProps.playingColor) {
        //   return;
        // }
        // setDraggingPieceArrow({
        //   piece: p.from.piece,
        //   arrow: {
        //     from: p.from.coords.relativeCoords,
        //     to: p.from.coords.absoluteCoords,
        //     width: p.squareSize / 9,
        //     isFreeArrow: true,
        //     ...(phase === 'move' ? moveFreeArrowStyle : attackFreeArrowStyle),
        //   },
        //   startCoord: p.from.coords.relativeCoords,
        // });
        // onPieceArrowDragStarted({
        //   from: { coords: p.from.coords.relativeCoords, piece: p.from.piece },
        // });
      },
      [
        // chessTerrainProps.playingColor,
        // onPieceArrowDragStarted,
        // attackFreeArrowStyle,
        // moveFreeArrowStyle,
      ]
    );

    const [draggedPiece, setDraggedPiece] = useState<{
      squareSize: number;
      color: ShortColor;
      label: string;
      coords: AbsoluteCoord;
    }>();

    const [absoluteCoords, setAbsoluteCoords] = useState<AbsoluteCoord>();

    // useEffect(() => {
    //   console.log('absoluteCoords', absoluteCoords);
    // }, [absoluteCoords]);

    return (
      <>
        <ChessTerrain
          board={{
            terrainState: terrain.state,
            pieceLayoutState: chessBoardToPieceLayout(startingChessBoard),
          }}
          sizePx={500}
          renderPiece={(p) => {
            // p.piece.
            const imgName = `${p.color}${p.label}` as keyof typeof dark;

            return (
              <div
                style={{
                  ...(p.isFlipped && { transform: 'scaleY(-1) scaleX(-1)' }),
                }}
                // draggable="true"
                key={p.piece.id}
              >
                {/* {p.color}:{p.label} */}
                <img
                  src={dark[imgName]}
                  style={{
                    height: p.squareSize,
                    // scale: '.8',
                  }}
                />
              </div>
            );
          }}
          playingColor="white"
          darkSquareColor="#aaa"
          onPieceDragStarted={(p) => {
            console.log('p dragged', p);

            const color = p.from.piece.id.slice(
              0,
              p.from.piece.id.indexOf(':')
            )[0] as ShortColor;

            const pieceWoColor = p.from.piece.id.slice(color.length + 1);
            const label = pieceWoColor.slice(0, pieceWoColor.indexOf(':'));

            setDraggedPiece({
              ...p.from.piece,
              squareSize: p.squareSize,
              label,
              coords: p.from.coords.absoluteCoords,
            });
          }}
          onPieceDragUpdate={(p) => {
            // console.log('rel', p.to.relativeCoords);
            setAbsoluteCoords(p.to.absoluteCoords);
            // setDraggedPiece((prev) =>
            //   prev
            //     ? {
            //         ...prev,
            //         coords: p.from.absoluteCoords,
            //       }
            //     : undefined
            // );
          }}
          onPieceDragStopped={() => {
            setDraggedPiece(undefined);
            setAbsoluteCoords(undefined);
          }}
          // onCoordClicked={(c, p) => {
          //   console.log('clicked', c, coordToAlphaNotation(c), p);
          // }}
          // onCoordHover={(c, p) => {
          //   console.log('hovered', c, coordToAlphaNotation(c), p);
          // }}
        />
        <div className="draggable-layer">
          {draggedPiece && (
            <img
              src={
                dark[
                  `${draggedPiece.color}${draggedPiece.label}` as keyof typeof dark
                ]
              }
              style={{
                height: draggedPiece.squareSize,
                position: 'absolute',
                top: absoluteCoords?.y,
                left: absoluteCoords?.x,
                // scale: '.8',
              }}
            />
          )}
        </div>
      </>
    );
  },
  title: 'ChessTerrain',
};

export default meta;
type Story = StoryObj<typeof ChessTerrain>;

export const ChessGame = {
  args: {},
};

// export const Heading: Story = {
//   args: {},
//   play: async ({ canvasElement }) => {
//     const canvas = within(canvasElement);
//     expect(canvas.getByText(/Welcome to ChessTerrain!/gi)).toBeTruthy();
//   },
// };
