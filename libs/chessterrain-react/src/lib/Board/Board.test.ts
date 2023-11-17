import {
  King,
  Pawn,
  Queen,
  Rook,
} from '@maha-monorepo/maha-chess-game-mechanics';
import { matrixReduce } from '../util-kit';
import { GameConfigurator } from '../Game/types';
import { Piece } from '../Piece/Piece';
import { PieceId } from '../Piece/types';
import { getPieceFactory } from '../Piece/util';
import { Terrain } from '../Terrain/Terrain';
import { Board } from './Board';
import { BoardState } from './types';

describe('Constructor', () => {
  const deafultTestPieceBlack = new Pawn(
    'black',
    'default_test_piece_black' as PieceId
  );
  const deafultTestPieceWhite = new Pawn(
    'white',
    'default_test_piece_white' as PieceId
  );

  const pieceRegistry = {
    bP: getPieceFactory((...args) => deafultTestPieceBlack),
    wP: getPieceFactory((...args) => deafultTestPieceWhite),
  };

  const CONFIGURATOR: GameConfigurator<typeof pieceRegistry> = {
    terrain: { width: 4 },
    pieceLayout: [
      ['bP', 'bP', 'bP', 'bP'],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      ['wP', 'wP', 'wP', 'wP'],
    ],
    // TODO: add this dynamic props going to be needed
    // pieceDynamicProps: []
  };

  test('creates a new board with the correct piece layout', () => {
    const actual = new Board({
      pieceRegistry,
      configurator: CONFIGURATOR,
    }).state;
    const expected = {
      terrainState: new Terrain({ props: CONFIGURATOR.terrain }).state,
      pieceLayoutState: [
        [
          deafultTestPieceBlack.state,
          deafultTestPieceBlack.state,
          deafultTestPieceBlack.state,
          deafultTestPieceBlack.state,
        ],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [
          deafultTestPieceWhite.state,
          deafultTestPieceWhite.state,
          deafultTestPieceWhite.state,
          deafultTestPieceWhite.state,
        ],
      ],
    };

    expect(actual).toEqual(expected);
  });
});

describe('Get Piece By Coord', () => {
  const localPieceRegistry = {
    bP: getPieceFactory((...args) => new Pawn('black', ...args)),
    bQ: getPieceFactory((...args) => new Queen('black', ...args)),
    bR: getPieceFactory((...args) => new Rook('black', ...args)),

    wP: getPieceFactory((...args) => new Pawn('white', ...args)),
    wQ: getPieceFactory((...args) => new Queen('white', ...args)),
    wR: getPieceFactory((...args) => new Rook('white', ...args)),
  };

  const board = new Board({
    pieceRegistry: localPieceRegistry,
    configurator: {
      terrain: { width: 4 },
      pieceLayout: [
        ['bP', 0, 'wQ', 'wR'],
        [0, 0, 0, 0],
        ['wP', 0, 0, 0],
        [0, 'bQ', 'bR', 0],
      ],
    },
  });

  test('finds the prssent pieces upon constructing the Board', () => {
    const actualBlackPawn = board.getPieceByCoord({ row: 0, col: 0 })?.state;
    const expectedBlackPawn = new Pawn(
      'black',
      actualBlackPawn?.id || ('ABSENT' as PieceId)
    ).state;
    expect(actualBlackPawn).toEqual(expectedBlackPawn);

    const actualWhiteQueen = board.getPieceByCoord({ row: 0, col: 2 })?.state;
    const expectedWhiteQueen = new Queen(
      'white',
      actualWhiteQueen?.id || ('ABSENT' as PieceId)
    ).state;
    expect(actualWhiteQueen).toEqual(expectedWhiteQueen);

    const actualWhitePawn = board.getPieceByCoord({ row: 2, col: 0 })?.state;
    const expectedWhitePawn = new Pawn(
      'white',
      actualWhitePawn?.id || ('ABSENT' as PieceId)
    ).state;
    expect(actualWhitePawn).toEqual(expectedWhitePawn);
  });

  test('does not find the absent pieces within the board boundaries upon constructing the Board', () => {
    const actualAbsentPiece1 = board.getPieceByCoord({ row: 3, col: 3 })?.state;
    const actualAbsentPiece2 = board.getPieceByCoord({ row: 3, col: 0 })?.state;

    expect(actualAbsentPiece1).toEqual(undefined);
    expect(actualAbsentPiece2).toEqual(undefined);
  });

  test('does not find the absent pieces outside the board boundaries upon constructing the Board', () => {
    const actualCoordWithRowOutsideBoaundaries = board.getPieceByCoord({
      row: 7,
      col: 2,
    })?.state;
    const actualCoordWithColOutsideBoaundaries = board.getPieceByCoord({
      row: 1,
      col: 30,
    })?.state;
    const actualCoordWithRowAndColOutsideBoaundaries = board.getPieceByCoord({
      row: 124,
      col: 30,
    })?.state;

    expect(actualCoordWithRowOutsideBoaundaries).toEqual(undefined);
    expect(actualCoordWithColOutsideBoaundaries).toEqual(undefined);
    expect(actualCoordWithRowAndColOutsideBoaundaries).toEqual(undefined);
  });
});

describe('Get Piece By Id', () => {
  test('able to get any piece present upon constructing the Board', () => {
    const localPieceRegistry = {
      bP: getPieceFactory((...args) => new Pawn('black', ...args)),
      bQ: getPieceFactory((...args) => new Queen('black', ...args)),
      bR: getPieceFactory((...args) => new Rook('black', ...args)),

      wP: getPieceFactory((...args) => new Pawn('white', ...args)),
      wQ: getPieceFactory((...args) => new Queen('white', ...args)),
      wR: getPieceFactory((...args) => new Rook('white', ...args)),
    };

    const board = new Board({
      pieceRegistry: localPieceRegistry,
      configurator: {
        terrain: { width: 4 },
        pieceLayout: [
          ['bP', 0, 'wQ', 'wR'],
          [0, 0, 0, 0],
          ['wP', 0, 0, 0],
          [0, 'bQ', 'bR', 0],
        ],
      },
    });

    const allPieceIds = matrixReduce(
      board.state.pieceLayoutState,
      (accum, p) => {
        if (p === 0) {
          return accum;
        }

        return [...accum, p.id];
      },
      [] as string[]
    );

    const actual = board.getPieceById(allPieceIds[0] as PieceId)?.state;
    const expected = new Pawn('black', actual!.id || 'ABSENT').state;

    expect(actual).toEqual(expected);
  });
});

describe('Update', () => {
  const piecesByLabelSpyMap: Record<string, Piece> = {};

  const localPieceRegistry = {
    bK: getPieceFactory((...args) => {
      const piece = new King('black', ...args);

      piecesByLabelSpyMap['bK'] = piece;

      return piece;
    }),
    wK: getPieceFactory((...args) => {
      const piece = new King('white', ...args);

      piecesByLabelSpyMap['wK'] = piece;

      return piece;
    }),
  };

  test('one move from initial phase', () => {
    const board = new Board({
      pieceRegistry: localPieceRegistry,
      configurator: {
        terrain: { width: 2 },
        pieceLayout: [
          [0, 'wK'],
          ['bK', 0],
        ],
      },
    });

    const moveResult = board.applyMoves([
      {
        from: { row: 1, col: 0 },
        to: { row: 0, col: 0 },
      },
    ]);

    expect(moveResult.ok).toBe(true);

    if (!moveResult.ok) {
      return;
    }

    const actualMove = moveResult.val[0];

    const expectedMove = {
      from: { row: 1, col: 0 },
      to: { row: 0, col: 0 },
      piece: piecesByLabelSpyMap['bK'].state,
    };

    const actualState = board.state;

    const expectedPieceLayoutState: BoardState['pieceLayoutState'] = [
      [piecesByLabelSpyMap['bK'].state, piecesByLabelSpyMap['wK'].state],
      [0, 0],
    ];

    const expectedState: BoardState = {
      terrainState: board.state.terrainState, // hasn't changed
      pieceLayoutState: expectedPieceLayoutState,
    };

    expect(actualState).toEqual(expectedState);
    expect(actualMove).toEqual(expectedMove);

    const actualPieceByPrevCoord = board.getPieceByCoord({ row: 1, col: 0 });
    const expectedPieceByPrevCoord = undefined;
    expect(actualPieceByPrevCoord).toEqual(expectedPieceByPrevCoord);

    const actualPieceByNextCoord = board.getPieceByCoord({
      row: 0,
      col: 0,
    })?.state;
    const expectedPieceByNextCoord = piecesByLabelSpyMap['bK'].state;
    expect(actualPieceByNextCoord).toEqual(expectedPieceByNextCoord);
  });

  test('multiple move from initial phase', () => {
    const board = new Board({
      pieceRegistry: localPieceRegistry,
      configurator: {
        terrain: { width: 2 },
        pieceLayout: [
          [0, 'wK'],
          ['bK', 0],
        ],
      },
    });

    const moveResult = board.applyMoves([
      {
        from: { row: 1, col: 0 },
        to: { row: 0, col: 0 },
      },
      {
        from: { row: 0, col: 1 },
        to: { row: 1, col: 1 },
      },
    ]);

    expect(moveResult.ok).toBe(true);

    if (!moveResult.ok) {
      return;
    }

    const actualMoves = moveResult.val;

    const expectedMoves = [
      {
        from: { row: 1, col: 0 },
        to: { row: 0, col: 0 },
        piece: piecesByLabelSpyMap['bK'].state,
      },
      {
        from: { row: 0, col: 1 },
        to: { row: 1, col: 1 },
        piece: piecesByLabelSpyMap['wK'].state,
      },
    ];

    const actualState = board.state;

    const expectedPieceLayoutState: BoardState['pieceLayoutState'] = [
      [piecesByLabelSpyMap['bK'].state, 0],
      [0, piecesByLabelSpyMap['wK'].state],
    ];

    const expectedState: BoardState = {
      terrainState: board.state.terrainState, // hasn't changed
      pieceLayoutState: expectedPieceLayoutState,
    };

    expect(actualState).toEqual(expectedState);
    expect(actualMoves).toEqual(expectedMoves);

    const actualPieceByPrevCoord = board.getPieceByCoord({ row: 1, col: 0 });
    const expectedPieceByPrevCoord = undefined;
    expect(actualPieceByPrevCoord).toEqual(expectedPieceByPrevCoord);

    const actualPieceByNextCoord = board.getPieceByCoord({
      row: 0,
      col: 0,
    })?.state;
    const expectedPieceByNextCoord = piecesByLabelSpyMap['bK'].state;
    expect(actualPieceByNextCoord).toEqual(expectedPieceByNextCoord);
  });
});
