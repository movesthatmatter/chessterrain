import {
  DEFAULT_MAHA_CONFIGURATOR,
  mahaChessSquareToCoord,
  mahaPieceRegistry,
} from '@maha-monorepo/maha-chess-game-mechanics';
import { GameReconciliator } from './GameReconciliator';
import { Board } from '../Board/Board';
import { AttackOutcome } from '../commonTypes';
import { matrixInsertMany } from '@maha-monorepo/util-kit';
import { toPieceId } from '../Board/util';

const getInitialBoard = () =>
  new Board({
    load: false,
    pieceRegistry: mahaPieceRegistry,
    configurator: DEFAULT_MAHA_CONFIGURATOR,
  });

test('it clones an advanced game (move & attack phases)', () => {
  const initialBoard = getInitialBoard();

  const actualPieces = {
    e2Pawn: initialBoard.getPieceByCoord(mahaChessSquareToCoord('e2')),
    d2Pawn: initialBoard.getPieceByCoord(mahaChessSquareToCoord('d2')),

    e7Pawn: initialBoard.getPieceByCoord(mahaChessSquareToCoord('e7')),
    d7Pawn: initialBoard.getPieceByCoord(mahaChessSquareToCoord('d7')),

    b1KNight: initialBoard.getPieceByCoord(mahaChessSquareToCoord('b1')),
    g8KNight: initialBoard.getPieceByCoord(mahaChessSquareToCoord('g8')),
  };

  // Double check these exist
  expect(actualPieces.e7Pawn?.state.id).toBe(toPieceId('bP', mahaChessSquareToCoord('e7')));
  expect(actualPieces.d7Pawn?.state.id).toBe(toPieceId('bP', mahaChessSquareToCoord('d7')));

  expect(actualPieces.e2Pawn?.state.id).toBe(toPieceId('wP', mahaChessSquareToCoord('e2')));
  expect(actualPieces.d2Pawn?.state.id).toBe(toPieceId('wP', mahaChessSquareToCoord('d2')));

  expect(actualPieces.b1KNight?.state.id).toBe(toPieceId('wN', mahaChessSquareToCoord('b1')));
  expect(actualPieces.g8KNight?.state.id).toBe(toPieceId('bN', mahaChessSquareToCoord('g8')));

  if (Object.values(actualPieces).find((p) => !p)) {
    return;
  }

  const whiteMoves = [
    {
      from: mahaChessSquareToCoord('e2'),
      to: mahaChessSquareToCoord('e4'),
      piece: actualPieces.e2Pawn!.state,
    },
    {
      from: mahaChessSquareToCoord('d2'),
      to: mahaChessSquareToCoord('d4'),
      piece: actualPieces.d2Pawn!.state,
    },
    {
      from: mahaChessSquareToCoord('b1'),
      to: mahaChessSquareToCoord('c3'),
      piece: actualPieces.b1KNight!.state,
    },
  ];

  const blackMoves = [
    {
      from: mahaChessSquareToCoord('e7'),
      to: mahaChessSquareToCoord('e5'),
      piece: actualPieces.e7Pawn!.state,
    },
    {
      from: mahaChessSquareToCoord('d7'),
      to: mahaChessSquareToCoord('d5'),
      piece: actualPieces.d7Pawn!.state,
    },
    {
      from: mahaChessSquareToCoord('g8'),
      to: mahaChessSquareToCoord('f6'),
      piece: actualPieces.g8KNight!.state,
    },
  ];

  const whiteAttackOutcomes: AttackOutcome[] = [
    {
      attack: {
        from: mahaChessSquareToCoord('e4'),
        to: mahaChessSquareToCoord('d5'),
      },
      damage: 2,
      willTake: false,
    },
  ];

  const blackAttackOutcomes: AttackOutcome[] = [
    {
      attack: {
        from: mahaChessSquareToCoord('f6'),
        to: mahaChessSquareToCoord('e4'),
      },
      damage: 3,
      willTake: false,
    },
  ];

  const actualGame = new GameReconciliator(getInitialBoard(), {
    history: [
      [
        [
          {
            color: 'white',
            moves: whiteMoves.map((m) => ({
              ...m,
              piece: { ...m.piece, pieceHasMoved: true },
            })),
          },
          {
            color: 'black',
            moves: blackMoves.map((m) => ({
              ...m,
              piece: { ...m.piece, pieceHasMoved: true },
            })),
          },
        ],
        [
          {
            color: 'white',
            attacks: whiteAttackOutcomes,
          },
          {
            color: 'black',
            attacks: blackAttackOutcomes,
          },
        ],
      ],
    ],
  });

  const tempBoard = getInitialBoard();

  tempBoard.applyMoves([...whiteMoves, ...blackMoves]);

  const coordAtD5 = mahaChessSquareToCoord('d5');
  const coordAtE4 = mahaChessSquareToCoord('e4');

  const boardPieceLayoutStateStateAfterAttacks = matrixInsertMany(
    tempBoard.state.pieceLayoutState,
    [
      {
        index: [coordAtD5.row, coordAtD5.col],
        nextVal: {
          ...tempBoard.getPieceByCoord(coordAtD5)!.state,
          hitPoints: 4,
        },
      },
      {
        index: [coordAtE4.row, coordAtE4.col],
        nextVal: {
          ...tempBoard.getPieceByCoord(coordAtE4)!.state,
          hitPoints: 3,
        },
      },
    ]
  );

  const expectedState = {
    boardState: {
      ...tempBoard.state,
      pieceLayoutState: boardPieceLayoutStateStateAfterAttacks,
    },
    history: [
      [
        [
          {
            color: 'white',
            moves: whiteMoves.map((m) => ({
              ...m,
              castle: undefined,
              promotion: undefined,
              piece: {
                ...m.piece,
                pieceHasMoved: true,
              },
            })),
          },
          {
            color: 'black',
            moves: blackMoves.map((m) => ({
              ...m,
              castle: undefined,
              promotion: undefined,
              piece: {
                ...m.piece,
                pieceHasMoved: true,
              },
            })),
          },
        ],
        [
          {
            color: 'white',
            attacks: whiteAttackOutcomes,
          },
          {
            color: 'black',
            attacks: blackAttackOutcomes,
          },
        ],
      ],
    ],
    state: 'inProgress',
    phase: 'move',
    submissionStatus: 'none',
    white: {
      canDraw: true,
      moves: undefined,
    },
    black: {
      canDraw: true,
      moves: undefined,
    },
    winner: undefined,
  };

  expect(actualGame.state).toEqual(expectedState);

  const actualClone = actualGame.clone();

  expect(actualClone.state).toEqual(expectedState);
  expect(actualClone.board.state).toEqual(expectedState.boardState);
});
