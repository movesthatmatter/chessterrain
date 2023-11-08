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
} from './util-kit';
import { ArrowsLayer, Arrow } from './components/ArrowsLayer';
import {
  coordToArrow,
  determineArrowMargin,
  getBoardCoordsFromAbsoluteCoords,
  getMouseCoords,
  isMouseInRect,
} from './util';
import { InteractionLayer } from './components/InteractionLayer';
import { BackgroundLayer } from './components/BackgroundLayer';
import {
  PromotionDialogLayer,
  PromotionDialogLayerProps,
} from './components/PromotionDialogLayer';
import { StyledCoordsLayer } from './components/StyledCoordsLayers';
import { PiecesLayer, PiecesLayerProps } from './components/PiecesLayer';
import { OverlaysLayer } from './components/OverlaysLayer';
import { RelativeArrow, StyledTerrainCoord } from './types';
import { AnnotationsLayer } from './components/AnnotationsLayer';
import { BoardState } from './Board/types';
import { Color } from './commonTypes';
import { IdentifiablePieceState } from './Piece/types';
import { coordToMatrixIndex } from './util';

// TODO: This compoonent should not be in Maha, as it's dynamic enough
// Can be in itos own lib or just in game-mehcanics or game-ui, o just chess-terrain

export type ChessTerrainProps = {
  sizePx: number;
  board: BoardState;
  renderPiece: PiecesLayerProps['renderPiece'];

  promotablePiecesMap: PromotionDialogLayerProps['promotablePiecesMap'];
  renderPromotablePiece: PromotionDialogLayerProps['renderPromotablePiece'];

  playingColor: Color;
  arrows?: Arrow[];
  freeArrow?: Arrow | RelativeArrow;
  styledCoords?: Record<SerializedCoord, StyledTerrainCoord>;
  overlays?: Record<
    SerializedCoord,
    | React.ReactNode
    | ((p: { squareSize: number; isFlipped: boolean }) => React.ReactNode)
  >;

  showAnnotations?: boolean;
  orientation?: Color;

  lightSquareColor?: string;
  darkSquareColor?: string;

  onCoordClicked?: (coord: Coord, piece?: IdentifiablePieceState) => void;

  // Sugar for onCoordClicked with piece or not
  // onPieceClicked?: (piece: IdentifiablePieceState, coord: Coord) => void;
  // onEmptySquareClicked?: (coord: Coord) => void;

  onCoordHover?: (coord: Coord, piece?: IdentifiablePieceState) => void;

  onBoardMouseLeave?: () => void;

  onPieceDragStarted?: (p: {
    from: {
      piece: IdentifiablePieceState;
      coords: {
        absoluteCoords: AbsoluteCoord;
        relativeCoords: Coord;
      };
    };
    squareSize: number;
  }) => void;
  onPieceDragStopped?: (p: {
    from: {
      piece: IdentifiablePieceState;
      absoluteCoords: AbsoluteCoord;
      relativeCoords: Coord;
    };
    to: {
      piece?: IdentifiablePieceState;
      absoluteCoords: AbsoluteCoord;
      relativeCoords: Coord;
    };
  }) => void;
  onPieceDragUpdate?: (p: {
    from: {
      piece: IdentifiablePieceState;
      absoluteCoords: AbsoluteCoord;
      relativeCoords: Coord;
    };
    to: {
      piece?: IdentifiablePieceState;
      absoluteCoords: AbsoluteCoord;
      relativeCoords: Coord;
    };
  }) => void;

  promotion?: Coord;

  onPromotePiece: (p: string) => void;
};

export const ChessTerrain: React.FC<ChessTerrainProps> = ({
  // pieceAssetsMap,
  // pieceComponentsMap,
  // piecesMap,
  // onPieceClicked = noop,
  // onEmptySquareClicked = noop,
  renderPiece,
  renderPromotablePiece,

  onCoordClicked = noop,

  onCoordHover = noop,
  onBoardMouseLeave = noop,

  onPieceDragStarted = noop,
  onPieceDragUpdate = noop,
  onPieceDragStopped = noop,

  playingColor,
  orientation = playingColor,
  promotablePiecesMap,
  board,
  sizePx,
  arrows = [],
  styledCoords = [],
  promotion,
  freeArrow,
  onPromotePiece = noop,

  lightSquareColor = 'white',
  darkSquareColor = 'black',
  overlays,
  showAnnotations,
}) => {
  const styledCoordsList = useMemo(
    () => Object.values(styledCoords),
    [styledCoords]
  );

  const squareSize = useMemo(
    () => sizePx / board.terrainState.length,
    [sizePx, board.terrainState.length]
  );

  const isFlipped = useMemo(() => orientation !== 'white', [orientation]);

  const [draggedPiece, setDraggedPiece] = useState<{
    piece: IdentifiablePieceState;
    from: AbsoluteCoord;
    to: AbsoluteCoord;
  }>();

  const getMouseCoordsWithIsFlipped = useMemo(
    () => (e: MouseEvent) => getMouseCoords(e, isFlipped),
    [isFlipped]
  );

  const onBoardClick = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();

      const boardCoords = getBoardCoordsFromAbsoluteCoords({
        absoluteCoords: getMouseCoordsWithIsFlipped(e),
        squareSize,
      });

      const piece = matrixGet(board.pieceLayoutState, [
        boardCoords.row,
        boardCoords.col,
      ]);

      // if (piece) {
      //   onPieceClicked(piece, boardCoords);
      // } else {
      //   onEmptySquareClicked(boardCoords);
      // }

      onCoordClicked(boardCoords, piece === 0 ? undefined : piece);
    },
    [
      squareSize,
      board,
      onCoordClicked,
      // onEmptySquareClicked,
      // onPieceClicked,
      getBoardCoordsFromAbsoluteCoords,
      getMouseCoordsWithIsFlipped,
    ]
  );

  const hoveredCoords = useRef<RelativeCoord | undefined>();
  const onBoardHover = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();

      // If there is a dragged piece then don't call hover!
      //  Use onDragUpdate!
      if (draggedPiece) {
        return;
      }

      const boardCoords = getBoardCoordsFromAbsoluteCoords({
        absoluteCoords: getMouseCoordsWithIsFlipped(e),
        squareSize,
      });

      if (
        hoveredCoords.current &&
        coordsAreEqual(hoveredCoords.current, boardCoords)
      ) {
        return;
      }

      const piece = matrixGet(board.pieceLayoutState, [
        boardCoords.row,
        boardCoords.col,
      ]);

      // if (piece) {
      //   onPieceTouched(piece, boardCoords);
      // } else {
      //   onEmptySquareTouched(boardCoords);
      // }

      onCoordHover(boardCoords, piece === 0 ? undefined : piece);

      hoveredCoords.current = boardCoords;
    },
    [
      squareSize,
      board,
      onCoordHover,
      draggedPiece,
      // onEmptySquareTouched,
      // onPieceTouched,
      getBoardCoordsFromAbsoluteCoords,
      getMouseCoordsWithIsFlipped,
    ]
  );

  const onMouseLeave = useCallback(() => {
    // Reset the hovered coords ref
    hoveredCoords.current = undefined;
    onBoardMouseLeave();
  }, [onBoardMouseLeave]);

  const normalizeAbsoluteCoordsToBoard = useMemo(
    () => (absoluteCoords: AbsoluteCoord) =>
      getBoardCoordsFromAbsoluteCoords({
        absoluteCoords,
        squareSize,
      }),
    [board, squareSize]
  );

  const onDragStart = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();

      if (draggedPiece) {
        return;
      }

      const mouseCoords = getMouseCoordsWithIsFlipped(e);
      const boardCoords = normalizeAbsoluteCoordsToBoard(mouseCoords);

      const piece = matrixGet(board.pieceLayoutState, [
        boardCoords.row,
        boardCoords.col,
      ]);

      if (piece) {
        setDraggedPiece({
          piece,
          from: mouseCoords,
          to: mouseCoords,
        });

        onPieceDragStarted({
          from: {
            piece,
            coords: {
              absoluteCoords: mouseCoords,
              relativeCoords: boardCoords,
            },
          },
          squareSize,
        });
      }
    },
    [
      normalizeAbsoluteCoordsToBoard,
      getMouseCoordsWithIsFlipped,
      onPieceDragStarted,
    ]
  );

  const onDragEnd = useCallback(
    (e: MouseEvent) => {
      if (!draggedPiece) {
        return;
      }

      const mouseCoords = getMouseCoordsWithIsFlipped(e);

      const toCoords = {
        absoluteCoords: draggedPiece.to,
        relativeCoords: normalizeAbsoluteCoordsToBoard(draggedPiece.to),
      };
      const toPiece = matrixGet(
        board.pieceLayoutState,
        coordToMatrixIndex(toCoords.relativeCoords)
      );

      onPieceDragStopped({
        to: {
          ...toCoords,
          piece: toPiece ? toPiece : undefined,
        },
        from: {
          piece: draggedPiece.piece,
          absoluteCoords: draggedPiece.from,
          relativeCoords: normalizeAbsoluteCoordsToBoard(draggedPiece.from),
        },
      });

      setDraggedPiece(undefined);
    },
    [
      getMouseCoordsWithIsFlipped,
      normalizeAbsoluteCoordsToBoard,
      onPieceDragStopped,
      draggedPiece,
    ]
  );

  const onDragUpdate = useCallback(
    (e: MouseEvent) => {
      const mouseCoords = getMouseCoordsWithIsFlipped(e);

      // If not in board return early
      if (!isMouseInRect(e)) {
        return;
      }

      setDraggedPiece((prev) => {
        if (!prev) {
          return prev;
        }

        return {
          ...prev,
          to: mouseCoords,
        };
      });
    },
    [getMouseCoordsWithIsFlipped]
  );

  useEffect(() => {
    if (draggedPiece) {
      const toCoords = {
        absoluteCoords: draggedPiece.to,
        relativeCoords: normalizeAbsoluteCoordsToBoard(draggedPiece.to),
      };
      const toPiece = matrixGet(
        board.pieceLayoutState,
        coordToMatrixIndex(toCoords.relativeCoords)
      );

      onPieceDragUpdate({
        from: {
          piece: draggedPiece.piece,
          absoluteCoords: draggedPiece.from,
          relativeCoords: normalizeAbsoluteCoordsToBoard(draggedPiece.from),
        },
        to: {
          ...toCoords,
          piece: toPiece ? toPiece : undefined,
        },
      });
    }
  }, [normalizeAbsoluteCoordsToBoard, draggedPiece]);

  const mergedArrows = useMemo(() => {
    return [
      ...(freeArrow
        ? [
            {
              ...freeArrow,
              ...(freeArrow.minimal
                ? {
                    from: isRelativeCoord(freeArrow.from)
                      ? {
                          x:
                            coordToArrow(squareSize, freeArrow.from.col) +
                            determineArrowMargin(freeArrow, squareSize).from.x,
                          y:
                            coordToArrow(squareSize, freeArrow.from.row) +
                            determineArrowMargin(freeArrow, squareSize).from.y,
                        }
                      : {
                          x:
                            freeArrow.from.x +
                            determineArrowMargin(freeArrow, squareSize).from.x,
                          y:
                            freeArrow.from.y +
                            determineArrowMargin(freeArrow, squareSize).from.y,
                        },
                    to: isRelativeCoord(freeArrow.to)
                      ? {
                          x:
                            coordToArrow(squareSize, freeArrow.to.col) +
                            determineArrowMargin(freeArrow, squareSize).to.x,
                          y:
                            coordToArrow(squareSize, freeArrow.to.row) +
                            determineArrowMargin(freeArrow, squareSize).to.y,
                        }
                      : {
                          x:
                            freeArrow.to.x +
                            determineArrowMargin(freeArrow, squareSize).to.x,
                          y:
                            freeArrow.to.y +
                            determineArrowMargin(freeArrow, squareSize).to.y,
                        },
                  }
                : {
                    from: isRelativeCoord(freeArrow.from)
                      ? {
                          x: coordToArrow(squareSize, freeArrow.from.col),
                          y: coordToArrow(squareSize, freeArrow.from.row),
                        }
                      : {
                          x: freeArrow.from.x,
                          y: freeArrow.from.y,
                        },
                    to: isRelativeCoord(freeArrow.to)
                      ? {
                          x: coordToArrow(squareSize, freeArrow.to.col),
                          y: coordToArrow(squareSize, freeArrow.to.row),
                        }
                      : {
                          x: freeArrow.to.x,
                          y: freeArrow.to.y,
                        },
                  }),
            },
          ]
        : []),
      ...arrows.map((arrow) => ({
        ...arrow,
        width: squareSize / 11,
        ...(arrow.minimal
          ? {
              from: {
                x:
                  coordToArrow(squareSize, arrow.from.x) +
                  determineArrowMargin(arrow, squareSize).from.x,
                y:
                  coordToArrow(squareSize, arrow.from.y) +
                  determineArrowMargin(arrow, squareSize).from.y,
              },
              to: {
                x:
                  coordToArrow(squareSize, arrow.to.x) -
                  determineArrowMargin(arrow, squareSize).to.x,
                y:
                  coordToArrow(squareSize, arrow.to.y) -
                  determineArrowMargin(arrow, squareSize).to.y,
              },
            }
          : {
              from: {
                x: coordToArrow(squareSize, arrow.from.x),

                y: coordToArrow(squareSize, arrow.from.y),
              },
              to: {
                x: coordToArrow(squareSize, arrow.to.x),

                y: coordToArrow(squareSize, arrow.to.y),
              },
            }),
      })),
    ];
  }, [arrows, freeArrow, squareSize]);

  // const promotablePieces = useMemo(
  //   () =>
  //     objectKeys(promotablePiecesMap).reduce(
  //       (accum, next) => ({
  //         ...accum,
  //         [next]: pieceComponentsMap[next],
  //       }),
  //       {} as PieceComponentsMap
  //     ),
  //   [promotablePiecesMap, pieceComponentsMap]
  // );

  const containerStyle: CSSProperties = useMemo(() => {
    return {
      width: sizePx,
      height: sizePx,
      position: 'relative',
      // zIndex: 99,
      ...(isFlipped && {
        transform: 'scaleY(-1) scaleX(-1)',
      }),
      // border: '10px solid black',
      // Adjust the position if needed to match the bottomLeft corner
      // backgroundPosition: `0 ${props.sizePx * 2}`,
    } as const;
  }, [sizePx, isFlipped]);

  return (
    <div style={containerStyle}>
      {overlays && (
        <OverlaysLayer
          overlays={overlays}
          squareSize={squareSize}
          isFlipped={isFlipped}
        />
      )}
      <PiecesLayer
        pieceLayoutState={board.pieceLayoutState}
        squareSize={squareSize}
        renderPiece={renderPiece}
        isFlipped={isFlipped}
        style={styles.piecesLayer}
      />
      <ArrowsLayer
        width={sizePx}
        height={sizePx}
        style={styles.arrowsLayer}
        arrows={mergedArrows}
      />
      {promotion && (
        <PromotionDialogLayer
          playingColor={playingColor}
          isFlipped={isFlipped}
          squareSize={squareSize}
          promotion={promotion}
          promotablePiecesMap={promotablePiecesMap}
          renderPromotablePiece={renderPromotablePiece}
          onPromotePiece={onPromotePiece}
        />
      )}
      {showAnnotations && (
        <AnnotationsLayer
          squareSize={squareSize}
          terrain={board.terrainState}
          isFlipped={isFlipped}
        />
      )}
      <BackgroundLayer
        squareSize={squareSize}
        darkColor={darkSquareColor}
        lightColor={lightSquareColor}
        style={styles.backgroundLayer}
      />
      <StyledCoordsLayer
        styledCoordsList={styledCoordsList}
        squareSize={squareSize}
      />
      <InteractionLayer
        style={styles.interactionLayer}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDrag={onDragUpdate}
        onClick={onBoardClick}
        onMouseMove={onBoardHover}
        onMouseLeave={onMouseLeave}
      />
    </div>
  );
};

// TODO: Move from here into a real css class
const styles = {
  arrowsLayer: {
    position: 'relative',
    zIndex: 7,
  },

  piecesLayer: {
    position: 'relative',
    zIndex: 8,
  },

  interactionLayer: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    cursor: 'pointer',
    zIndex: 9,
  },

  backgroundLayer: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
} as const;
