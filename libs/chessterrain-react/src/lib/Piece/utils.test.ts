import {
  DEFAULT_MAHA_CONFIGURATOR,
  mahaChessSquareToCoord,
} from '@maha-monorepo/maha-chess-game-mechanics';
import { mahaPieceRegistry } from '../../../../maha-chess-game-mechanics/src/lib/Pieces/registry';
import { Color, GameHistory, PartialGameTurn } from '../commonTypes';
import { Game } from '../Game/Game';
import { GameConfigurator, GameStateInProgress } from '../Game/types';
import { Coord, Matrix } from '@maha-monorepo/util-kit';
import { PieceId } from './types';
import {
  checkForFirstRookOnDirection,
  getAllAdjecentPiecesToPosition,
} from './util';

// TODO: These shouldn't be tested here!
import { MahaGame } from '../../../../maha-chess-game-mechanics/src/lib/MahaGame';
import { Knight } from '../../../../maha-chess-game-mechanics/src/lib/Pieces/Knight';
import { Pawn } from '../../../../maha-chess-game-mechanics/src/lib/Pieces/Pawn';
import { Queen } from '../../../../maha-chess-game-mechanics/src/lib/Pieces/Queen';
import { MahaBoard } from '../../../../maha-chess-game-mechanics/src/lib/MahaBoard/MahaBoard';
import { Board } from '../Board/Board';

export const generatePieceLabel = (
  color: Color,
  label: string,
  coord: Coord
): string => {
  return `${color}-${label}-${coord.row}-${coord.col}`;
};

describe('test getAllAdjecentPiecesToPosition function', () => {
  test('with no pieces', () => {
    const pieceLayout: Game['board']['state']['pieceLayoutState'] = [
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ];

    const pieces = getAllAdjecentPiecesToPosition(
      { row: 2, col: 2 },
      pieceLayout
    );

    expect(pieces).toEqual([]);
  });

  test('with position in the middle and few pieces around', () => {
    const pieceLayout: Game['board']['state']['pieceLayoutState'] = [
      [0, 0, new Queen('white', 'wQ' as PieceId).state, 0, 0],
      [0, new Knight('black', 'wB' as PieceId).state, 0, 0, 0],
      [0, 0, new Pawn('white', 'wP' as PieceId).state, 0, 0],
      [0, 0, 0, 0, 0],
    ];

    const pieces = getAllAdjecentPiecesToPosition(
      { row: 1, col: 2 },
      pieceLayout
    );

    expect(pieces).toEqual([
      {
        hitPoints: 20,
        pieceHasMoved: false,
        color: 'white',
        label: 'Queen',
        maxHitPoints: 20,
        id: 'wQ',
      },
      {
        hitPoints: 6,
        pieceHasMoved: false,
        color: 'white',
        label: 'Pawn',
        maxHitPoints: 6,
        id: 'wP',
      },
      {
        hitPoints: 12,
        pieceHasMoved: false,
        color: 'black',
        label: 'Knight',
        maxHitPoints: 12,
        id: 'wB',
      },
    ]);
  });

  test('with position in the corner and few pieces around', () => {
    const pieceLayout: Game['board']['state']['pieceLayoutState'] = [
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [
        new Knight('black', 'wB' as PieceId).state,
        new Pawn('white', 'wP' as PieceId).state,
        0,
        0,
        0,
      ],
      [0, new Queen('white', 'wQ' as PieceId).state, 0, 0, 0],
    ];

    const pieces = getAllAdjecentPiecesToPosition(
      { row: 3, col: 0 },
      pieceLayout
    );

    expect(pieces).toEqual([
      {
        hitPoints: 12,
        pieceHasMoved: false,
        color: 'black',
        label: 'Knight',
        maxHitPoints: 12,

        id: 'wB',
      },
      {
        hitPoints: 6,
        pieceHasMoved: false,
        color: 'white',
        label: 'Pawn',
        maxHitPoints: 6,
        id: 'wP',
      },
      {
        hitPoints: 20,
        pieceHasMoved: false,
        color: 'white',
        label: 'Queen',
        maxHitPoints: 20,
        id: 'wQ',
      },
    ]);
  });
});

describe('test checkForFirstRookOnDirection for both left and right', () => {
  test('check for Rook on the left of King', () => {
    const pieceLayout: Matrix<keyof typeof mahaPieceRegistry | 0> = [
      ['wR', 'wN', 0, 'wK', 0, 0, 'wR', 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ];

    const game = new MahaGame(
      new MahaBoard({
        gameConfigurator: { terrain: { width: 8 }, pieceLayout },
      })
    );

    const result = checkForFirstRookOnDirection({
      board: game.board,
      from: { row: 0, col: 3 },
      dir: { row: 0, col: 1 },
      color: 'white',
    });

    expect(result).toBeDefined();

    expect(result).toEqual({ row: 0, col: 6 });
  });

  test('check for Rook on the right of King - fail', () => {
    const pieceLayout: Matrix<keyof typeof mahaPieceRegistry | 0> = [
      ['wR', 'wN', 0, 'wK', 0, 0, 'wR', 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ];
    const game = new MahaGame(
      new MahaBoard({
        gameConfigurator: { pieceLayout, terrain: { width: 8 } },
      })
    );

    const result = checkForFirstRookOnDirection({
      board: game.board,
      from: { row: 0, col: 3 },
      dir: { row: 0, col: -1 },
      color: 'white',
    });

    expect(result).toBeUndefined();
  });
});

describe('test checkForMoveOnDest', () => {
  test('check with default starting position, it shouldnt allow bishop to move', () => {
    const game = new MahaGame();

    const bishopC8 = game.board.getPieceByCoord(mahaChessSquareToCoord('c8'));

    expect(bishopC8).toBeDefined();

    if (!bishopC8) {
      return;
    }

    const illegalMove = bishopC8.evalMoveTo(game, mahaChessSquareToCoord('f5'));

    expect(illegalMove.ok).toBe(false);
    expect(illegalMove.val).toBeUndefined();
  });

  test('check with a piece blocking the way to dest but by being part of drawn moves so it should still be able to move to dest', () => {
    const game = new MahaGame();
    game.start();

    const pawnF2 = game.board.getPieceByCoord(mahaChessSquareToCoord('f2'));

    expect(pawnF2).toBeDefined();

    if (!pawnF2) {
      return;
    }

    const moves = game.drawMove({
      from: mahaChessSquareToCoord('g1'),
      to: mahaChessSquareToCoord('f3'),
    });

    expect(moves.ok).toBe(true);

    if (!moves.ok) {
      return;
    }

    const legalMove = pawnF2.evalMoveTo(game, mahaChessSquareToCoord('f4'));

    expect(legalMove.ok).toBe(true);

    if (!legalMove.ok) {
      return;
    }

    const { from, to, piece } = legalMove.val;

    expect(from).toEqual(mahaChessSquareToCoord('f2'));
    expect(to).toEqual(mahaChessSquareToCoord('f4'));
    expect(piece).toEqual(pawnF2.state);
  });

  test('check for starting Queen with piece blocking the way on same line, shouldnt be able to move forward from that point', () => {
    const game = new MahaGame();
    game.start();

    const queen = game.board.getPieceByCoord(mahaChessSquareToCoord('d1'));

    expect(queen).toBeDefined();

    if (!queen) {
      return;
    }

    const moves = game.drawMove({
      from: mahaChessSquareToCoord('d2'),
      to: mahaChessSquareToCoord('d3'),
    });

    expect(moves.ok).toBe(true);

    if (!moves.ok) {
      return;
    }

    const illegalMove = queen.evalMoveTo(game, mahaChessSquareToCoord('d6'));

    expect(illegalMove.ok).toBe(false);
    expect(illegalMove.val).toBeUndefined();

    const legalMove = queen.evalMoveTo(game, mahaChessSquareToCoord('d2'));

    expect(legalMove.ok).toBe(true);

    if (!legalMove.ok) {
      return;
    }

    expect(legalMove.val).toBeDefined();

    const { from, to, piece } = legalMove.val;

    expect(from).toEqual(mahaChessSquareToCoord('d1'));
    expect(to).toEqual(mahaChessSquareToCoord('d2'));
    expect(piece).toEqual(queen.state);
  });

  test('check for bishop with piece blocking the way, it should still move since the deltas are different', () => {
    const game = new MahaGame();
    game.start();

    const bishopF1 = game.board.getPieceByCoord(mahaChessSquareToCoord('f1'));

    expect(bishopF1).toBeDefined();

    if (!bishopF1) {
      return;
    }

    const m = game.drawMove({
      from: mahaChessSquareToCoord('e2'),
      to: mahaChessSquareToCoord('e3'),
    });

    expect(m.ok).toBe(true);

    if (!m.ok) {
      return;
    }

    const m2 = game.drawMove({
      from: mahaChessSquareToCoord('d2'),
      to: mahaChessSquareToCoord('d3'),
    });

    expect(m2.ok).toBe(true);

    if (!m2.ok) {
      return;
    }

    const legalMoveClose = bishopF1.evalMoveTo(
      game,
      mahaChessSquareToCoord('e2')
    );
    const illegalMove = bishopF1.evalMoveTo(game, mahaChessSquareToCoord('d3'));
    const legalMoveFar = bishopF1.evalMoveTo(
      game,
      mahaChessSquareToCoord('b5')
    );

    expect(legalMoveClose.ok).toBe(true);

    if (!legalMoveClose.ok) {
      return;
    }

    expect(legalMoveClose.val.piece).toEqual(bishopF1.state);

    expect(illegalMove.ok).toBe(false);
    expect(illegalMove.val).toBeUndefined();

    expect(legalMoveFar.ok).toBe(true);

    if (!legalMoveFar.ok) {
      return;
    }

    expect(legalMoveFar.val.piece).toEqual(bishopF1.state);
  });
});

test('check for bishop with piece blocking the way and bishop having a prev drawn move', () => {
  const game = new MahaGame();
  game.start();

  const bishopF1 = game.board.getPieceByCoord(mahaChessSquareToCoord('f1'));

  expect(bishopF1).toBeDefined();

  if (!bishopF1) {
    return;
  }

  const m = game.drawMove({
    from: mahaChessSquareToCoord('e2'),
    to: mahaChessSquareToCoord('e4'),
  });

  expect(m.ok).toBe(true);

  if (!m.ok) {
    return;
  }

  const m2 = game.drawMove({
    from: mahaChessSquareToCoord('d2'),
    to: mahaChessSquareToCoord('d3'),
  });

  expect(m2.ok).toBe(true);

  if (!m2.ok) {
    return;
  }

  const bishopDrawnMove = game.drawMove({
    from: mahaChessSquareToCoord('f1'),
    to: mahaChessSquareToCoord('c4'),
  });

  expect(bishopDrawnMove.ok).toBe(true);

  if (!bishopDrawnMove.ok) {
    return;
  }

  const legalMoveFar = bishopF1.evalMoveTo(game, mahaChessSquareToCoord('b5'));
  const illegalMove = bishopF1.evalMoveTo(game, mahaChessSquareToCoord('d3'));

  expect(illegalMove.ok).toBe(false);
  expect(illegalMove.val).toBeUndefined();

  expect(legalMoveFar.ok).toBe(true);

  if (!legalMoveFar.ok) {
    return;
  }

  expect(legalMoveFar.val.piece).toEqual(bishopF1.state);
});
