import React, {
  CSSProperties,
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Coord,
  matrixGet,
  noop,
  SerializedCoord,
  RelativeCoord,
  AbsoluteCoord,
  isRelativeCoord,
  coordsAreEqual,
  serializeCoord,
} from '../util-kit';
import { ArrowsLayer, Arrow } from '../components/ArrowsLayer';
import {
  coordToArrow,
  determineArrowMargin,
  // getBoardCoordsFromAbsoluteCoords,
  // getMouseCoords,
  isMouseInRect,
} from '../util';
import { InteractionLayer } from '../components/InteractionLayer';
import { BackgroundLayer } from '../components/BackgroundLayer';
import {
  PromotionDialogLayer,
  PromotionDialogLayerProps,
} from '../components/PromotionDialogLayer';
import { StyledCoordsLayer } from '../components/StyledCoordsLayers';
import { PiecesLayer, PiecesLayerProps } from '../components/PiecesLayer';
import { OverlaysLayer } from '../components/OverlaysLayer';
import { RelativeArrow, StyledTerrainCoord } from '../types';
import { AnnotationsLayer } from '../components/AnnotationsLayer';
import { BoardState } from '../Board/types';
import { Color, ShortColor } from '../commonTypes';
import {
  GeneralBoardState,
  IdentifiablePiece,
  IdentifiablePieceState,
  // IdentifiablePieceState
} from '../Piece/types';
import { coordToMatrixIndex } from '../util';
import { useCallbackIf } from '../hooks/useCallbackIf';
import { ChessTerrain, ChessTerrainProps } from '../ChessTerrain';
import { Terrain } from '../Terrain';
import { GameConfigurator } from '../Game/types';
import { chessBoardToPieceLayout, relativeCoordToSquare } from './util';
import { Chess } from 'chess.js';
import { dark } from '../assets/pieces';

/**
 * This is the component that works with the Chess Game rules and makes the Terrain (peice, square) interaction possible
 * It would be a different such Board component per Game type (i.e. Maha would have a different one)
 */

// TODO: The identifiablePiece should be given gerneically so the pieceSTate is inferrred correctly outside
export type ChessBoardProps = Pick<
  ChessTerrainProps,
  'sizePx' | 'playingColor' | 'showAnnotations'
>;

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

const startingChessBoard = gameClient.board();

export const ChessBoard: React.FC<ChessBoardProps> = ({
  playingColor = 'white',
  ...chessTerrainProps
}) => {
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

  // const onInteractableCoordHover = useCallbackIf(
  //   canHover,
  //   (coord: Coord, piece?: IdentifiablePieceState) => {
  //     if (piece) {
  //       onPieceHovered({ piece, coord });
  //     } else {
  //       onEmptySquareHovered(coord);
  //     }

  //     onCoordHover(coord, piece);
  //   },
  //   [onPieceHovered, onEmptySquareHovered, onCoordHover]
  // );

  // const onInteractableCoordClicked = useCallbackIf(
  //   canTouch,
  //   (p: { relativeCoords: RelativeCoord; piece?: IdentifiablePieceState }) =>
  //     piece ? onPieceClicked({ piece, coord }) : onEmptySquareClicked(coord),
  //   [onPieceClicked, onEmptySquareClicked]
  // );

  const updateDraggedPieceFn = useCallback<
    NonNullable<ChessTerrainProps['onPieceDragUpdated']>
  >(
    (p) => {
      console.log(
        'Dragging |',
        `Abs: ${p.to.absoluteCoords.x},${p.to.absoluteCoords.y};`,
        `Rel: ${p.to.relativeCoords.row},${p.to.relativeCoords.col};`,
        `Sq: ${relativeCoordToSquare(p.to.relativeCoords)}`
      );
      // console.log('from relative', );
      // console.log(
      //   'from sq',

      // );
      // console.groupEnd();
      // console.log(
      //   'update',
      //   p.to.absoluteCoords,
      //   relativeCoordToSquare(p.to.relativeCoords)
      // );

      setAbsoluteCoords(p.to.absoluteCoords);
    },
    [playingColor, chessTerrainProps.sizePx]
  );

  // useEffect(() => {
  //   console.log('absoluteCoords', absoluteCoords);
  // }, [absoluteCoords]);

  const [styledCoordsRecord, setStyledCoordsRecord] =
    useState<Record<SerializedCoord, StyledTerrainCoord>>();

  // const onInteractableCoordClicked = useCallbackIf(
  //   canTouch,
  //   (p: { relativeCoords: RelativeCoord; piece?: IdentifiablePieceState }) =>
  //     p.piece ? onPieceClicked(p) : onEmptySquareClicked(p.relativeCoords),
  //   [onPieceClicked, onEmptySquareClicked]
  // );

  const onEmptySquareClicked = (relativeCoords: RelativeCoord) => {};

  // const onPieceClicked = useCallback((p: {
  //   relativeCoords: RelativeCoord;
  //   piece: IdentifiablePieceState;
  // }) => {
  //   // If the Game is Completed, the pieces can be touched
  //   // if (this.props.gameState.state === 'completed') {
  //   //   const { touchedPiece } = this.state;

  //   //   // If a Touched Piece with the Same Coords exists, it means: "untouch"
  //   //   if (touchedPiece && coordsAreEqual(touchedPiece?.coord, p.coord)) {
  //   //     this.onUserSpecificallyUntouchedPiece(p);

  //   //     return;
  //   //   }

  //   //   // Otherwise, if the Piece is mine, it means: "touch"
  //   //   this.touchPiece(p);

  //   //   return;
  //   // }

  //   // // Game in Progress
  //   // if (!this.canDraw()) {
  //   //   return;
  //   // }

  //   // const { touchedPiece } = this.state;

  //   // // If a Touched Piece with the Same Coords exists, it means: "untouch"
  //   // if (touchedPiece && coordsAreEqual(touchedPiece?.coord, p.coord)) {
  //   //   this.onUserSpecificallyUntouchedPiece(p);

  //   //   return;
  //   // }

  //   // // If the next Touched Piece is also mine (but moving) maybe the Touched Piece wants to take it's place there
  //   // if (touchedPiece) {
  //   //   const drawingResult = this.attemptToDrawArrowForTouchedPiece({
  //   //     to: p.coord,
  //   //     piece: touchedPiece.piece,
  //   //     from: touchedPiece.coord,
  //   //   });

  //   //   if (drawingResult.ok) {
  //   //     this.clearTouchedPiece();
  //   //     return;
  //   //   }
  //   // }

  //   // Otherwise, if the Piece is mine, it means: "touch"
  //   if (this.props.playingColor === p.piece.color) {
  //     this.touchPiece(p);
  //   }
  // });

  return (
    <>
      <ChessTerrain
        board={{
          terrainState: terrain.state,
          pieceLayoutState: chessBoardToPieceLayout(startingChessBoard),
        }}
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
        darkSquareColor="#aaa"
        onPieceDragStarted={(p) => {
          console.log(
            'Start Dragging |',
            `Abs: ${p.from.absoluteCoords.x},${p.from.absoluteCoords.y};`,
            `Rel: ${p.from.relativeCoords.row},${p.from.relativeCoords.col};`,
            `Sq: ${relativeCoordToSquare(p.from.relativeCoords)}`
          );

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
            coords: p.from.absoluteCoords,
          });
        }}
        // onPieceDragUpdate={(p) => {
        //   // console.log('rel', p.to.relativeCoords);
        //   // setDraggedPiece((prev) =>
        //   //   prev
        //   //     ? {
        //   //         ...prev,
        //   //         coords: p.from.absoluteCoords,
        //   //       }
        //   //     : undefined
        //   // );
        // }}
        onPieceDragUpdated={updateDraggedPieceFn}
        onPieceDragStopped={(p) => {
          console.log(
            'Stopped Dragging |',
            `From Abs: ${p.from.absoluteCoords.x},${p.from.absoluteCoords.y};`,
            `From Rel: ${p.from.relativeCoords.row},${p.from.relativeCoords.col};`,
            `To Abs: ${p.to.absoluteCoords.x},${p.to.absoluteCoords.y};`,
            `To Rel: ${p.to.relativeCoords.row},${p.to.relativeCoords.col};`,
            `Sq: ${relativeCoordToSquare(p.from.relativeCoords)}`
          );

          setDraggedPiece(undefined);
          setAbsoluteCoords(undefined);
        }}
        // onCoordClicked={(c, p) => {
        //   console.log('clicked', c, coordToAlphaNotation(c), p);
        // }}
        // onCoordHover={(c, p) => {
        //   console.log('hovered', c, coordToAlphaNotation(c), p);
        // }}
        onCoordClicked={(p) => {
          console.log(
            'Clicked |',
            `Abs: ${NaN};`,
            `Rel: ${p.relativeCoords.row},${p.relativeCoords.col};`,
            `Sq: ${relativeCoordToSquare(p.relativeCoords)}`
          );
        }}
        playingColor={playingColor}
        onCoordHover={(p) => {
          console.log(
            'Hovered |',
            `Abs: ${NaN};`,
            `Rel: ${p.relativeCoords.row},${p.relativeCoords.col};`,
            `Sq: ${relativeCoordToSquare(p.relativeCoords)}`
          );

          setStyledCoordsRecord({
            [serializeCoord(p.relativeCoords)]: {
              relativeCoord: p.relativeCoords,
              style: {
                backgroundColor: 'red',
              },
            },
          });
        }}
        onTerrainMouseLeave={() => {
          setStyledCoordsRecord(undefined);
        }}
        // styledCoords={{
        //   [serializeCoord({ col: 3, row: 3 })]: {
        //     relativeCoord: {
        //       row: 0,
        //       col: 0,
        //     },
        //     style: {
        //       backgroundColor: 'red',
        //     },
        //   },
        // }}
        styledCoords={styledCoordsRecord}
        {...chessTerrainProps}
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
};
