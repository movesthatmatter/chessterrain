import React from 'react';
import {
  SerializedCoord,
  RelativeCoord,
  serializeCoord,
  invoke,
} from '../util-kit';
import { toShortColor } from '../util';
import {
  RelativeCoordsWithOptionalPiece,
  RelativeCoordsWithPiece,
  StyledTerrainCoord,
} from '../types';
import { Move, ShortColor } from '../commonTypes';
import { ChessTerrain, ChessTerrainProps } from '../ChessTerrain';
import { Terrain } from '../Terrain';
import { GameConfigurator } from '../Game/types';
import { chessBoardToPieceLayout, relativeCoordToSquare } from './util';
import { Chess } from 'chess.js';
import { dark } from '../assets/pieces';
import { toDictIndexedBy } from '../util-kit';
import {
  hoveredOwnPieceSquareStyle,
  touchedPieceSquareStyle,
} from './squareStyles';
import { PiecesLayerProps } from '../components/PiecesLayer';
import { ChessMove } from './type';
import { GeneralPieceLayoutState, PieceRegistry } from '../Piece/types';

/**
 * This is the component that works with the Chess Game rules and makes the Terrain (peice, square) interaction possible
 * It would be a different such Board component per Game type (i.e. Maha would have a different one)
 */

// TODO: The identifiablePiece should be given gerneically so the pieceSTate is inferrred correctly outside
export type ChessBoardAsClassProps = Pick<
  ChessTerrainProps,
  'sizePx' | 'playingColor' | 'showAnnotations'
> & {
  pieceLayoutState: GeneralPieceLayoutState<PieceRegistry>, // TODO: PieceRegistry this can be hardcoded for chess
  onMove: (p: { move: ChessMove }) => void;
};

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

// export type PieceWithCoord = {
//   piece: IdentifiablePieceState;
//   relativeCoords: RelativeCoord;
// };

export type RelativeCoordsMap = Record<SerializedCoord, RelativeCoord>;

export type StyledSquaresState = {
  hoveredSquare?: RelativeCoordsMap;
  possibleMoves?: RelativeCoordsMap;
};

type State = {
  touchedPiece?: RelativeCoordsWithPiece;
  hoveredPiece?: RelativeCoordsWithPiece;

  // pendingPromoMove?: PendingPromoMove;

  styledSquares: StyledSquaresState;

  pieceLayoutState: GeneralPieceLayoutState<PieceRegistry>,
};

const CLEAR_STYLED_SQUARES_STATE: StyledSquaresState = {
  possibleMoves: undefined,
  hoveredSquare: undefined,
};

export class ChessBoardAsClass extends React.Component<
  ChessBoardAsClassProps,
  State
> {
  override state: State = {
    styledSquares: CLEAR_STYLED_SQUARES_STATE,
    pieceLayoutState: chessBoardToPieceLayout(startingChessBoard),
  };

  setDraggedPiece() {}

  onCoordHover(p: RelativeCoordsWithOptionalPiece) {}

  private onCoordClicked = (p: RelativeCoordsWithOptionalPiece) => {
    const { touchedPiece } = this.state;

    console.log(
      'on coord clicked',
      relativeCoordToSquare(p.relativeCoords),
      p.piece?.id
    );

    if (p.piece) {
      console.log('has piece', p.piece.id);

      if (touchedPiece && p.piece.id === touchedPiece.piece.id) {
        this.touchPiece(undefined);
      }

      // If same color, just touch it
      else if (p.piece.color === toShortColor(this.props.playingColor)) {
        this.touchPiece({
          piece: p.piece,
          relativeCoords: p.relativeCoords,
        });
      }
    }

    if (touchedPiece) {
      console.log(
        'tpouched piece',
        relativeCoordToSquare(touchedPiece.relativeCoords),
        touchedPiece.piece.id
      );

      this.props.onMove({
        move: {
          from: relativeCoordToSquare(touchedPiece.relativeCoords),
          to: relativeCoordToSquare(p.relativeCoords),
        },
      });
    }

    // if (touchedPiece) {
    //   this.touchPiece(undefined);

    //   if (touchedPiece.piece.id === p.piece?.id) {
    //     return;
    //   }

    //   // if (p.piece && p.piece.id !== touchedPiece.piece.id) {

    //   // }

    //   this.props.onMove({
    //     move: {
    //       from: relativeCoordToSquare(touchedPiece.relativeCoords),
    //       to: relativeCoordToSquare(p.relativeCoords),
    //     },
    //   });
    // }
    // else if (p.piece !== undefined) {
    //   this.touchPiece({
    //     piece: p.piece,
    //     relativeCoords: p.relativeCoords,
    //   });
    // }
    //  else {
    // this.props.onMove({
    //   move: {
    //     from: relativeCoordToSquare(touchedPiece.relativeCoords),
    //     to: relativeCoordToSquare(p.relativeCoords),
    //   },
    // });
    // }

    // if (p?.piece.id === .piece.id) {
    //   this.touchPiece(undefined);
    //   return;
    // }

    // if (p.piece) {

    //   this.onPieceClicked({
    //     piece: p.piece,
    //     relativeCoords: p.relativeCoords,
    //   });
    // } else {
    //   // this.onEmptySquareClicked(p.relativeCoords);
    // }
    // const onInteractableCoordClicked = useCallbackIf(
    //   canTouch,
    //   (coord: Coord, piece?: IdentifiablePieceState) =>
    //     piece ? onPieceClicked({ piece, coord }) : onEmptySquareClicked(coord),
    //   [onPieceClicked, onEmptySquareClicked]
    // );
  };

  private onPieceClicked = (p: RelativeCoordsWithPiece) => {
    const { touchedPiece } = this.state;

    // If the next Touched Piece is also mine (but moving) maybe the Touched Piece wants to take it's place there
    if (touchedPiece) {
      // TODO: move
      // const drawingResult = this.attemptToDrawArrowForTouchedPiece({
      //   to: p.relativeCoords,
      //   piece: touchedPiece.piece,
      //   from: touchedPiece.coord,
      // });
      // if (drawingResult.ok) {
      //   this.clearTouchedPiece();
      //   return;
      // }
      if (touchedPiece.piece.id === p.piece.id) {
        this.touchPiece(undefined);
        return;
      }
    }

    // Otherwise, if the Piece is mine, it means: "touch"
    if (toShortColor(this.props.playingColor) === p.piece.color) {
      this.touchPiece(p);
    }
  };

  onEmptySquareClicked = (coords: RelativeCoord) => {
    this.setState({
      styledSquares: {
        hoveredSquare: {
          [serializeCoord(coords)]: coords,
        },
      },
    });
  };

  private touchPiece = (p: RelativeCoordsWithPiece | undefined) => {
    this.setState({
      touchedPiece: p,
      // peekedPiece: undefined
      hoveredPiece: undefined,
    });

    // TODO: Actual capture if needed
  };

  private renderPiece = (p: Parameters<PiecesLayerProps['renderPiece']>[0]) => {
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
  };

  private onPieceDragStarted = () => {};

  private onPieceDragUpdated = () => {};

  private onPieceDragEnded = () => {};

  render() {
    const { playingColor, ...chessTerrainProps } = this.props;

    // This could be memoized
    const mergedStyledCoords: Record<SerializedCoord, StyledTerrainCoord> =
      invoke(() => {
        const { styledSquares } = this.state;

        if (!this.state.styledSquares) {
          return {};
        }

        const { hoveredSquare } = this.state.styledSquares;

        const touchedPiece = this.state.touchedPiece;

        return {
          ...toDictIndexedBy(
            [
              ...(touchedPiece
                ? [
                    {
                      // ...touchedPiece.,
                      relativeCoord: touchedPiece.relativeCoords,
                      style: touchedPieceSquareStyle,
                      // hoveredSquare.piece.color ===
                      // chessTerrainProps.playingColor
                      //   ? hoveredOwnPieceSquareStyle
                      //   : hoveredOtherPieceSquareStyle,
                    },
                  ]
                : []),
              // ...(hoveredSquare ? Object.values(hoveredSquare).map((dest) => [
              //   relativeCoord: hoveredSquare.,
              //   style: touchedPieceSquareStyle,
              // ] : []),
              ...Object.values(styledSquares.hoveredSquare || {}).map(
                (dest) => ({
                  relativeCoord: dest,
                  style: hoveredOwnPieceSquareStyle,
                })
              ),
            ],
            (p) => serializeCoord(p.relativeCoord)
          ),

          // Extra
          // ...styledCoords,
        };
      });

    return (
      <>
        <ChessTerrain
          // TODO: This can be stored in the state
          board={{
            terrainState: terrain.state,
            pieceLayoutState: this.props.pieceLayoutState,
          }}
          renderPiece={this.renderPiece}
          darkSquareColor="rgba(0, 163, 255, .3)"
          // onPieceDragStarted={(p) => {
          //   console.log(
          //     'Start Dragging |',
          //     `Abs: ${p.from.absoluteCoords.x},${p.from.absoluteCoords.y};`,
          //     `Rel: ${p.from.relativeCoords.row},${p.from.relativeCoords.col};`,
          //     `Sq: ${relativeCoordToSquare(p.from.relativeCoords)}`
          //   );

          //   const color = p.from.piece.id.slice(
          //     0,
          //     p.from.piece.id.indexOf(':')
          //   )[0] as ShortColor;

          //   const pieceWoColor = p.from.piece.id.slice(color.length + 1);
          //   const label = pieceWoColor.slice(0, pieceWoColor.indexOf(':'));

          //   // setDraggedPiece({
          //   //   ...p.from.piece,
          //   //   squareSize: p.squareSize,
          //   //   label,
          //   //   coords: p.from.absoluteCoords,
          //   // });
          // }}
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
          // onPieceDragUpdate={updateDraggedPieceFn}
          // onPieceDragStopped={(p) => {
          //   console.log(
          //     'Stopped Dragging |',
          //     `From Abs: ${p.from.absoluteCoords.x},${p.from.absoluteCoords.y};`,
          //     `From Rel: ${p.from.relativeCoords.row},${p.from.relativeCoords.col};`,
          //     `To Abs: ${p.to.absoluteCoords.x},${p.to.absoluteCoords.y};`,
          //     `To Rel: ${p.to.relativeCoords.row},${p.to.relativeCoords.col};`,
          //     `Sq: ${relativeCoordToSquare(p.from.relativeCoords)}`
          //   );

          //   // setDraggedPiece(undefined);
          //   // setAbsoluteCoords(undefined);
          // }}
          // onCoordClicked={(c, p) => {
          //   console.log('clicked', c, coordToAlphaNotation(c), p);
          // }}
          // onCoordHover={(c, p) => {
          //   console.log('hovered', c, coordToAlphaNotation(c), p);
          // }}
          playingColor={this.props.playingColor}
          onCoordClicked={this.onCoordClicked}
          // onPieceDragStarted={this.onPieceDragStarted}
          // onPieceDragUpdated={this.onPieceDragUpdated}
          // onPieceDragStopped={this.onPieceDragUpdated}
          // onCoordHover={(p) => {
          //   console.log(
          //     'Hovered |',
          //     `Abs: ${NaN};`,
          //     `Rel: ${p.relativeCoords.row},${p.relativeCoords.col};`,
          //     `Sq: ${relativeCoordToSquare(p.relativeCoords)}`
          //   );

          //   this.setState({
          //     styledSquares: {
          //       ...CLEAR_STYLED_SQUARES_STATE,
          //       [serializeCoord(p.relativeCoords)]: {
          //         relativeCoord: p.relativeCoords,
          //         style: {
          //           backgroundColor: 'red',
          //         },
          //       },
          //     },
          //   });
          //   // setStyledCoordsRecord({
          //   //   [serializeCoord(p.relativeCoords)]: {
          //   //     relativeCoord: p.relativeCoords,
          //   //     style: {
          //   //       backgroundColor: 'red',
          //   //     },
          //   //   },
          //   // });
          // }}
          // onTerrainMouseLeave={() => {
          //   // setStyledCoordsRecord(undefined);
          // }}
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
          styledCoords={mergedStyledCoords}
          {...chessTerrainProps}
        />
        {/* <div className="draggable-layer">
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
        </div> */}
      </>
    );
  }
}
