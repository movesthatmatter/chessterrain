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
};

export const Example: React.FC<ChessTerrainProps> = ({
  // pieceAssetsMap,
  // pieceComponentsMap,
  // piecesMap,
  // onPieceClicked = noop,
  // onEmptySquareClicked = noop,
  sizePx = 100,
}) => {
  

  return (
    <div style={{
      background: 'red',
      width: sizePx,
      height: sizePx,
    }}>
      asd
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
