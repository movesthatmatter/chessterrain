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
  matrixGet,
  noop,
  SerializedCoord,
  RelativeCoord,
  AbsoluteCoord,
  isRelativeCoord,
  coordsAreEqual,
  absoluteCoordsToRelativeCoords,
} from './util-kit';
import { ArrowsLayer, Arrow } from './components/ArrowsLayer';
import {
  coordToArrow,
  determineArrowMargin,
  getMouseCoordsInRect,
  flipAbsoluteCoords,
  isMouseInRect,
  getDOMRectFromMouseEvent,
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

import { Color } from './commonTypes';
import {
  GeneralBoardState,
  IdentifiablePiece,
  // IdentifiablePieceState
} from './Piece/types';
import { coordToMatrixIndex } from './util';
import { useCallbackIf } from './hooks/useCallbackIf';

// TODO: This compoonent should not be in Maha, as it's dynamic enough
// Can be in itos own lib or just in game-mehcanics or game-ui, o just chess-terrain

// TODO: The identifiablePiece should be given gerneically so the pieceSTate is inferrred correctly outside
export type ChessTerrainProps = {
  sizePx: number;
  board: GeneralBoardState;
  renderPiece: PiecesLayerProps['renderPiece'];

  promotablePiecesMap?: PromotionDialogLayerProps['promotablePiecesMap'];
  renderPromotablePiece?: PromotionDialogLayerProps['renderPromotablePiece'];

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

  onCoordClicked?: (p: {
    relativeCoords: RelativeCoord;
    piece?: IdentifiablePiece;
  }) => void;

  // Sugar for onCoordClicked with piece or not
  // onPieceClicked?: (piece: IdentifiablePieceState, coord: Coord) => void;
  // onEmptySquareClicked?: (coord: Coord) => void;

  onCoordHover?: (p: {
    relativeCoords: RelativeCoord;
    piece?: IdentifiablePiece;
  }) => void;

  onTerrainMouseLeave?: () => void;

  onPieceDragStarted?: (p: {
    from: {
      piece: IdentifiablePiece;
      absoluteCoords: AbsoluteCoord;
      relativeCoords: RelativeCoord;
    };
    squareSize: number;
  }) => void;
  onPieceDragStopped?: (p: {
    from: {
      piece: IdentifiablePiece;
      absoluteCoords: AbsoluteCoord;
      relativeCoords: RelativeCoord;
    };
    to: {
      piece?: IdentifiablePiece;
      absoluteCoords: AbsoluteCoord;
      relativeCoords: RelativeCoord;
    };
  }) => void;
  onPieceDragUpdated?: (p: {
    from: {
      piece: IdentifiablePiece;
      absoluteCoords: AbsoluteCoord;
      relativeCoords: RelativeCoord;
    };
    to: {
      piece?: IdentifiablePiece;
      absoluteCoords: AbsoluteCoord;
      relativeCoords: RelativeCoord;
    };
  }) => void;

  promotion?: RelativeCoord;

  onPromotePiece?: (p: string) => void;
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
  onTerrainMouseLeave = noop,

  onPieceDragStarted = noop,
  // onPieceDragUpdate = noop,
  onPieceDragUpdated,
  onPieceDragStopped = noop,
  onPromotePiece = noop,

  playingColor,
  orientation = playingColor,
  promotablePiecesMap,
  board,
  sizePx,
  arrows = [],
  styledCoords = [],
  promotion,
  freeArrow,

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
    piece: IdentifiablePiece;
    from: AbsoluteCoord;
    to: AbsoluteCoord;
  }>();

  const getAbsoluteMouseCoords = useMemo(
    () => (e: MouseEvent) =>
      getMouseCoordsInRect(e, getDOMRectFromMouseEvent(e)),
    []
  );

  // const getMouseCoordsWithIsFlipped = useMemo(
  //   () => (e: MouseEvent) => {
  //     const rect = getDOMRectFromMouseEvent(e);

  //     return isFlipped
  //       ? flipAbsoluteCoords(getMouseCoordsInRect(e, rect), rect)
  //       : getMouseCoordsInRect(e, rect);
  //   },
  //   [isFlipped]
  // );

  const toBoardRelativeCoords = useMemo(() => {
    if (isFlipped) {
      // Hardcode the rect here since it's just the board as a square based on the sizePx
      // This should simply work - if not it needs to be taken from the MouseEvent.target.getBoundRect()
      //  but this should be faster and
      const rect = {
        width: sizePx,
        height: sizePx,
      };

      return (absoluteCoords: AbsoluteCoord) => {
        // These need to be flipped in order to get the correct relative coords
        return absoluteCoordsToRelativeCoords(
          flipAbsoluteCoords(absoluteCoords, rect),
          squareSize
        );
      };
    }

    return (absoluteCoords: AbsoluteCoord) =>
      absoluteCoordsToRelativeCoords(absoluteCoords, squareSize);
  }, [board, squareSize, isFlipped, sizePx]);

  const onBoardClick = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();

      const relativeBoardCoords = toBoardRelativeCoords(
        getAbsoluteMouseCoords(e)
      );

      const piece = matrixGet(board.pieceLayoutState, [
        relativeBoardCoords.row,
        relativeBoardCoords.col,
      ]);

      // if (piece) {
      //   onPieceClicked(piece, boardCoords);
      // } else {
      //   onEmptySquareClicked(boardCoords);
      // }

      onCoordClicked({
        relativeCoords: relativeBoardCoords,
        piece: piece === 0 ? undefined : piece,
      });
    },
    [
      board,
      onCoordClicked,
      toBoardRelativeCoords,
      // onEmptySquareClicked,
      // onPieceClicked,
      // getMouseCoordsWithIsFlipped,
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

      const relativeBoardCoords = toBoardRelativeCoords(
        getAbsoluteMouseCoords(e)
      );

      if (
        hoveredCoords.current &&
        coordsAreEqual(hoveredCoords.current, relativeBoardCoords)
      ) {
        return;
      }

      const piece = matrixGet(board.pieceLayoutState, [
        relativeBoardCoords.row,
        relativeBoardCoords.col,
      ]);

      // if (piece) {
      //   onPieceTouched(piece, boardCoords);
      // } else {
      //   onEmptySquareTouched(boardCoords);
      // }

      onCoordHover({
        relativeCoords: relativeBoardCoords,
        piece: piece === 0 ? undefined : piece,
      });

      hoveredCoords.current = relativeBoardCoords;
    },
    [
      squareSize,
      board,
      onCoordHover,
      draggedPiece,
      // onEmptySquareTouched,
      // onPieceTouched,
      toBoardRelativeCoords,
      // getMouseCoordsWithIsFlipped,
    ]
  );

  const onMouseLeave = useCallback(() => {
    // Reset the hovered coords ref
    hoveredCoords.current = undefined;
    onTerrainMouseLeave();
  }, [onTerrainMouseLeave]);

  const onDragStart = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();

      if (draggedPiece) {
        return;
      }

      // const mouseCoordsWithFlipped = getMouseCoordsWithIsFlipped(e);
      // const mouseCoords = getMouseCoordsInRect(e, getDOMRectFromMouseEvent(e));
      const absoluteMouseCoords = getAbsoluteMouseCoords(e);
      const relativeCoords = toBoardRelativeCoords(absoluteMouseCoords);

      const piece = matrixGet(board.pieceLayoutState, [
        relativeCoords.row,
        relativeCoords.col,
      ]);

      if (piece) {
        setDraggedPiece((prev) => {
          console.log('prev', prev?.piece.id, piece.id);
          if (prev?.piece.id === piece.id) {
            return prev;
          }

          return {
            piece,
            from: absoluteMouseCoords,
            to: absoluteMouseCoords,
          };
        });

        onPieceDragStarted({
          from: {
            piece,
            absoluteCoords: absoluteMouseCoords,
            relativeCoords,
          },
          squareSize,
        });
      }
    },
    [
      getAbsoluteMouseCoords,
      toBoardRelativeCoords,
      onPieceDragStarted,
      setDraggedPiece,
    ]
  );

  const onDragEnd = useCallback(
    (e: MouseEvent) => {
      // console.log('on drag end?', draggedPiece);

      if (!draggedPiece) {
        return;
      }

      // console.log('on drag end yep', draggedPiece);
      // const absoluteMouseCoords = getMouseCoordsWithIsFlipped(e);

      const toCoords = {
        absoluteCoords: draggedPiece.to,
        relativeCoords: toBoardRelativeCoords(draggedPiece.to),
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
          relativeCoords: toBoardRelativeCoords(draggedPiece.from),
        },
      });

      setDraggedPiece(undefined);
    },
    [
      // getMouseCoordsWithIsFlipped,
      toBoardRelativeCoords,
      onPieceDragStopped,
      setDraggedPiece,
      draggedPiece,
    ]
  );

  const onDragUpdate = useCallbackIf(
    typeof onPieceDragUpdated === 'function',
    (e: MouseEvent) => {
      // const mouseCoords = getMouseCoordsWithIsFlipped(e);

      // const mouseCoords = getMouseCoordsInRect(e, getDOMRectFromMouseEvent(e));

      // console.log('on drag update');
      // If not in board return early
      if (!isMouseInRect(e)) {
        return;
      }

      // console.log('on drag update yep');

      setDraggedPiece((prev) => {
        if (!prev) {
          return undefined;
        }

        return {
          ...prev,
          to: getAbsoluteMouseCoords(e),
        };
      });
    },
    [getAbsoluteMouseCoords, setDraggedPiece]
  );

  useEffect(() => {
    if (draggedPiece && onPieceDragUpdated) {
      const toCoords = {
        absoluteCoords: draggedPiece.to,
        relativeCoords: toBoardRelativeCoords(draggedPiece.to),
      };
      const toPiece = matrixGet(
        board.pieceLayoutState,
        coordToMatrixIndex(toCoords.relativeCoords)
      );

      onPieceDragUpdated({
        from: {
          piece: draggedPiece.piece,
          absoluteCoords: draggedPiece.from,
          relativeCoords: toBoardRelativeCoords(draggedPiece.from),
        },
        to: {
          ...toCoords,
          piece: toPiece ? toPiece : undefined,
        },
      });
    }
  }, [toBoardRelativeCoords, draggedPiece]);

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
      {promotion && promotablePiecesMap && renderPromotablePiece && (
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
    // background: 'rgba(100, 0, 0, .2)',
  },

  backgroundLayer: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
} as const;
