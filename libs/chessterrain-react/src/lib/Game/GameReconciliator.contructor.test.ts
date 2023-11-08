import {
  DEFAULT_MAHA_CONFIGURATOR,
  mahaChessSquareToCoord,
  mahaPieceRegistry,
} from '@maha-monorepo/maha-chess-game-mechanics';
import { GameReconciliator } from './GameReconciliator';
import { Board } from '../Board/Board';
import { AttackOutcome, GameHistory, MoveOutcome } from '../commonTypes';
import { Result } from 'ts-results';
import { matrixInsertMany } from '@maha-monorepo/util-kit';
import { toPieceId } from '../Board/util';

const getInitialBoard = () =>
  new Board({
    load: false,
    pieceRegistry: mahaPieceRegistry,
    configurator: DEFAULT_MAHA_CONFIGURATOR,
  });

test('it constucts game in initial state (empty)', () => {
  const actual = new GameReconciliator(getInitialBoard());

  const expectedState = {
    boardState: getInitialBoard().state,
    history: [],
    state: 'pending',
    winner: undefined,
  };

  expect(actual.state).toEqual(expectedState);
});

test('it constructs pending game from given empty history', () => {
  const initalBoard = getInitialBoard();

  const actual = new GameReconciliator(initalBoard, {
    history: [],
  });

  const expectedState = {
    boardState: initalBoard.state,
    history: [],
    state: 'pending',
    winner: undefined,
  };

  expect(actual.state).toEqual(expectedState);
});

test('it constructs game from given history with just the first partial game turn (move phase completed)', () => {
  const initialBoard = getInitialBoard();

  const actualE2Pawn = initialBoard.getPieceByCoord(
    mahaChessSquareToCoord('e2')
  );

  const actualE7Pawn = initialBoard.getPieceByCoord(
    mahaChessSquareToCoord('e7')
  );

  // Double check these exist
  expect(actualE7Pawn?.state.id).toBe(
    toPieceId('bP', mahaChessSquareToCoord('e7'))
  );
  expect(actualE2Pawn?.state.id).toBe(
    toPieceId('wP', mahaChessSquareToCoord('e2'))
  );

  if (!(actualE7Pawn && actualE2Pawn)) {
    return;
  }

  const whiteMoves = [
    {
      from: mahaChessSquareToCoord('e2'),
      to: mahaChessSquareToCoord('e4'),
      piece: actualE2Pawn!.state,
    },
  ];

  const blackMoves = [
    {
      from: mahaChessSquareToCoord('e7'),
      to: mahaChessSquareToCoord('e5'),
      piece: actualE7Pawn!.state,
    },
  ];

  const actual = new GameReconciliator(initialBoard, {
    history: [
      [
        [
          {
            color: 'white',
            moves: whiteMoves,
          },
          {
            color: 'black',
            moves: blackMoves,
          },
        ],
      ],
    ],
  });

  initialBoard.applyMoves([...whiteMoves, ...blackMoves]);

  const expectedState = {
    boardState: initialBoard.state,
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
      ],
    ],
    state: 'inProgress',
    phase: 'attack',
    submissionStatus: 'none',
    white: {
      canDraw: true,
      attacks: undefined,
    },
    black: {
      canDraw: true,
      attacks: undefined,
    },
    winner: undefined,
  };
  expect(actual.state).toEqual(expectedState);
});

test('it constructs game from given history with just the first full game turn (move & attack phases)', () => {
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
  expect(actualPieces.e7Pawn?.state.id).toBe(
    toPieceId('bP', mahaChessSquareToCoord('e7'))
  );
  expect(actualPieces.d7Pawn?.state.id).toBe(
    toPieceId('bP', mahaChessSquareToCoord('d7'))
  );

  expect(actualPieces.e2Pawn?.state.id).toBe(
    toPieceId('wP', mahaChessSquareToCoord('e2'))
  );
  expect(actualPieces.d2Pawn?.state.id).toBe(
    toPieceId('wP', mahaChessSquareToCoord('d2'))
  );

  expect(actualPieces.b1KNight?.state.id).toBe(
    toPieceId('wN', mahaChessSquareToCoord('b1'))
  );
  expect(actualPieces.g8KNight?.state.id).toBe(
    toPieceId('bN', mahaChessSquareToCoord('g8'))
  );

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

  const actualWhiteAttackOutcomes: AttackOutcome[] = [
    {
      attack: {
        from: mahaChessSquareToCoord('e4'),
        to: mahaChessSquareToCoord('d5'),
      },
      damage: 2,
      willTake: false,
    },
  ];

  const actualBlackAttackOutcomes: AttackOutcome[] = [
    {
      attack: {
        from: mahaChessSquareToCoord('f6'),
        to: mahaChessSquareToCoord('e4'),
      },
      damage: 3,
      willTake: false,
    },
  ];

  const actual = new GameReconciliator(initialBoard, {
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
            attacks: actualWhiteAttackOutcomes,
          },
          {
            color: 'black',
            attacks: actualBlackAttackOutcomes,
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
            attacks: actualWhiteAttackOutcomes,
          },
          {
            color: 'black',
            attacks: actualBlackAttackOutcomes,
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

  expect(actual.state).toEqual(expectedState);
});

describe('Complete game ', () => {
  test('It constructs a complete game - game ended in attack phase', () => {
    const game = new GameReconciliator(getInitialBoard());

    const pieceAtf2 = game.board.getPieceByCoord(mahaChessSquareToCoord('f2'));
    const pieceAtE7 = game.board.getPieceByCoord(mahaChessSquareToCoord('e7'));
    const pieceAtD8 = game.board.getPieceByCoord(mahaChessSquareToCoord('d8'));
    const pieceAtE2 = game.board.getPieceByCoord(mahaChessSquareToCoord('e2'));
    const pieceAtD7 = game.board.getPieceByCoord(mahaChessSquareToCoord('d7'));

    expect(pieceAtf2).toBeDefined();
    expect(pieceAtE7).toBeDefined();
    expect(pieceAtD8).toBeDefined();
    expect(pieceAtE2).toBeDefined();
    expect(pieceAtD7).toBeDefined();

    if (!(pieceAtD8 && pieceAtf2 && pieceAtE7 && pieceAtE2 && pieceAtD7)) {
      return;
    }

    const t1MoveSubmission = Result.all(
      game.submitMoves({
        color: 'white',
        moves: [
          {
            from: mahaChessSquareToCoord('f2'),
            to: mahaChessSquareToCoord('f4'),
          },
        ],
      }),
      game.submitMoves({
        color: 'black',
        moves: [
          {
            from: mahaChessSquareToCoord('e7'),
            to: mahaChessSquareToCoord('e5'),
          },
          {
            from: mahaChessSquareToCoord('d8'),
            to: mahaChessSquareToCoord('h4'),
          },
        ],
      })
    );

    expect(t1MoveSubmission.ok).toBe(true);

    if (!t1MoveSubmission.ok) {
      return;
    }

    const whiteMovesT1: MoveOutcome[] = [
      {
        from: mahaChessSquareToCoord('f2'),
        to: mahaChessSquareToCoord('f4'),
        piece: {
          ...pieceAtf2?.state,
          pieceHasMoved: true,
        },
      },
    ];

    const blackMovesT1: MoveOutcome[] = [
      {
        from: mahaChessSquareToCoord('e7'),
        to: mahaChessSquareToCoord('e5'),
        piece: {
          ...pieceAtE7?.state,
          pieceHasMoved: true,
        },
      },
      {
        from: mahaChessSquareToCoord('d8'),
        to: mahaChessSquareToCoord('h4'),
        piece: {
          ...pieceAtD8?.state,
          pieceHasMoved: true,
        },
      },
    ];

    const whiteAttacksT1: AttackOutcome[] = [
      {
        attack: {
          from: mahaChessSquareToCoord('f4'),
          to: mahaChessSquareToCoord('e5'),
        },
        damage: 2,
        willTake: false,
      },
    ];

    const blackAttacksT1: AttackOutcome[] = [
      {
        attack: {
          from: mahaChessSquareToCoord('e5'),
          to: mahaChessSquareToCoord('f4'),
        },
        damage: 2,
        willTake: false,
      },
    ];

    const t1AttackSubmission = Result.all(
      game.submitAttacks({
        color: 'white',
        attacks: [
          {
            from: mahaChessSquareToCoord('f4'),
            to: mahaChessSquareToCoord('e5'),
          },
        ],
      }),
      game.submitAttacks({
        color: 'black',
        attacks: [
          {
            from: mahaChessSquareToCoord('e5'),
            to: mahaChessSquareToCoord('f4'),
          },
        ],
      })
    );

    expect(t1AttackSubmission.ok).toBe(true);
    if (!t1AttackSubmission.ok) {
      return;
    }

    const [, t1res] = t1AttackSubmission.val;

    const t1history = t1res.history;

    expect(t1history).toEqual([
      [
        [
          {
            color: 'white',
            moves: whiteMovesT1,
          },
          {
            color: 'black',
            moves: blackMovesT1,
          },
        ],
        [
          {
            color: 'white',
            attacks: whiteAttacksT1,
          },
          {
            color: 'black',
            attacks: blackAttacksT1,
          },
        ],
      ],
    ]);

    const whiteMovesT2: MoveOutcome[] = [
      {
        from: mahaChessSquareToCoord('e2'),
        to: mahaChessSquareToCoord('e3'),
        piece: {
          ...pieceAtE2?.state,
          pieceHasMoved: true,
        },
      },
    ];

    const blackMovesT2: MoveOutcome[] = [
      {
        from: mahaChessSquareToCoord('d7'),
        to: mahaChessSquareToCoord('d6'),
        piece: {
          ...pieceAtD7?.state,
          pieceHasMoved: true,
        },
      },
    ];

    const t2MovesSubmission = Result.all(
      game.submitMoves({
        color: 'white',
        moves: [
          {
            from: mahaChessSquareToCoord('e2'),
            to: mahaChessSquareToCoord('e3'),
          },
        ],
      }),
      game.submitMoves({
        color: 'black',
        moves: [
          {
            from: mahaChessSquareToCoord('d7'),
            to: mahaChessSquareToCoord('d6'),
          },
        ],
      })
    );

    expect(t2MovesSubmission.ok).toBe(true);
    if (!t2MovesSubmission.ok) {
      return;
    }

    const t2AttackSubmission = Result.all(
      game.submitAttacks({
        color: 'white',
        attacks: [
          {
            from: mahaChessSquareToCoord('f4'),
            to: mahaChessSquareToCoord('e5'),
          },
        ],
      }),
      game.submitAttacks({
        color: 'black',
        attacks: [
          {
            from: mahaChessSquareToCoord('h4'),
            to: mahaChessSquareToCoord('e1'),
          },
        ],
      })
    );

    expect(t2AttackSubmission.ok).toBe(true);
    if (!t2AttackSubmission.ok) {
      return;
    }

    const whiteAttacksT2: AttackOutcome[] = [
      {
        attack: {
          from: mahaChessSquareToCoord('f4'),
          to: mahaChessSquareToCoord('e5'),
        },
        damage: 2,
        willTake: false,
      },
    ];

    const blackAttacksT2: AttackOutcome[] = [
      {
        attack: {
          from: mahaChessSquareToCoord('h4'),
          to: mahaChessSquareToCoord('e1'),
        },
        damage: 4,
        willTake: false,
      },
    ];

    const [, turn] = t2AttackSubmission.val;

    const finalHistory: GameHistory = [
      [
        [
          {
            color: 'white',
            moves: whiteMovesT1,
          },
          {
            color: 'black',
            moves: blackMovesT1,
          },
        ],
        [
          {
            color: 'white',
            attacks: whiteAttacksT1,
          },
          {
            color: 'black',
            attacks: blackAttacksT1,
          },
        ],
      ],
      [
        [
          {
            color: 'white',
            moves: whiteMovesT2,
          },
          {
            color: 'black',
            moves: blackMovesT2,
          },
        ],
        [
          {
            color: 'white',
            attacks: whiteAttacksT2,
          },
          {
            color: 'black',
            attacks: blackAttacksT2,
          },
        ],
      ],
    ];

    expect(turn.history).toEqual(finalHistory);

    expect(turn.state).toEqual('completed');

    const newGame = new GameReconciliator(getInitialBoard(), {
      history: finalHistory,
    });

    expect(newGame.state.state).toEqual('completed');
    expect(newGame.state.history).toEqual(finalHistory);
    expect(newGame.state.boardState.pieceLayoutState).toEqual(
      turn.boardState.pieceLayoutState
    );
  });

  test('It constructs a complete game - game ended in attack phase with Queen attacking the opposite King', () => {
    const game = new GameReconciliator(getInitialBoard());

    const pieceAtf2 = game.board.getPieceByCoord(mahaChessSquareToCoord('f2'));
    const pieceAtE7 = game.board.getPieceByCoord(mahaChessSquareToCoord('e7'));
    const pieceAtD8 = game.board.getPieceByCoord(mahaChessSquareToCoord('d8'));
    const pieceAtE2 = game.board.getPieceByCoord(mahaChessSquareToCoord('e2'));
    const pieceAtD7 = game.board.getPieceByCoord(mahaChessSquareToCoord('d7'));
    const whiteKing = game.board.getPieceByCoord(mahaChessSquareToCoord('e1'));

    expect(pieceAtf2).toBeDefined();
    expect(pieceAtE7).toBeDefined();
    expect(pieceAtD8).toBeDefined();
    expect(pieceAtE2).toBeDefined();
    expect(pieceAtD7).toBeDefined();
    expect(whiteKing).toBeDefined();

    if (
      !(
        pieceAtD8 &&
        pieceAtf2 &&
        pieceAtE7 &&
        pieceAtE2 &&
        pieceAtD7 &&
        whiteKing
      )
    ) {
      return;
    }

    const t1MoveSubmission = Result.all(
      game.submitMoves({
        color: 'white',
        moves: [
          {
            from: mahaChessSquareToCoord('f2'),
            to: mahaChessSquareToCoord('f4'),
          },
        ],
      }),
      game.submitMoves({
        color: 'black',
        moves: [
          {
            from: mahaChessSquareToCoord('e7'),
            to: mahaChessSquareToCoord('e5'),
          },
          {
            from: mahaChessSquareToCoord('d8'),
            to: mahaChessSquareToCoord('h4'),
          },
        ],
      })
    );

    expect(t1MoveSubmission.ok).toBe(true);

    if (!t1MoveSubmission.ok) {
      return;
    }

    const whiteMovesT1: MoveOutcome[] = [
      {
        from: mahaChessSquareToCoord('f2'),
        to: mahaChessSquareToCoord('f4'),
        piece: {
          ...pieceAtf2?.state,
          pieceHasMoved: true,
        },
      },
    ];

    const blackMovesT1: MoveOutcome[] = [
      {
        from: mahaChessSquareToCoord('e7'),
        to: mahaChessSquareToCoord('e5'),
        piece: {
          ...pieceAtE7?.state,
          pieceHasMoved: true,
        },
      },
      {
        from: mahaChessSquareToCoord('d8'),
        to: mahaChessSquareToCoord('h4'),
        piece: {
          ...pieceAtD8?.state,
          pieceHasMoved: true,
        },
      },
    ];

    const whiteAttacksT1: AttackOutcome[] = [
      {
        attack: {
          from: mahaChessSquareToCoord('f4'),
          to: mahaChessSquareToCoord('e5'),
        },
        damage: 2,
        willTake: false,
      },
    ];

    const blackAttacksT1: AttackOutcome[] = [
      {
        attack: {
          from: mahaChessSquareToCoord('e5'),
          to: mahaChessSquareToCoord('f4'),
        },
        damage: 2,
        willTake: false,
      },
    ];

    const t1AttackSubmission = Result.all(
      game.submitAttacks({
        color: 'white',
        attacks: [
          {
            from: mahaChessSquareToCoord('f4'),
            to: mahaChessSquareToCoord('e5'),
          },
        ],
      }),
      game.submitAttacks({
        color: 'black',
        attacks: [
          {
            from: mahaChessSquareToCoord('e5'),
            to: mahaChessSquareToCoord('f4'),
          },
        ],
      })
    );

    expect(t1AttackSubmission.ok).toBe(true);
    if (!t1AttackSubmission.ok) {
      return;
    }

    const [, t1res] = t1AttackSubmission.val;

    const t1history = t1res.history;

    expect(t1history).toEqual([
      [
        [
          {
            color: 'white',
            moves: whiteMovesT1,
          },
          {
            color: 'black',
            moves: blackMovesT1,
          },
        ],
        [
          {
            color: 'white',
            attacks: whiteAttacksT1,
          },
          {
            color: 'black',
            attacks: blackAttacksT1,
          },
        ],
      ],
    ]);

    const blackMovesT2: MoveOutcome[] = [
      {
        from: mahaChessSquareToCoord('e5'),
        to: mahaChessSquareToCoord('e4'),
        piece: { ...pieceAtE7?.state, hitPoints: 4 },
      },
    ];

    const whiteMovesT2: MoveOutcome[] = [
      {
        from: mahaChessSquareToCoord('e1'),
        to: mahaChessSquareToCoord('f2'),
        piece: {
          ...whiteKing.state,
          pieceHasMoved: true,
          hitPoints: whiteKing.state.hitPoints,
        },
      },
    ];

    const t2MovesSubmission = Result.all(
      game.submitMoves({
        color: 'white',
        moves: [
          {
            from: mahaChessSquareToCoord('e1'),
            to: mahaChessSquareToCoord('f2'),
          },
        ],
      }),
      game.submitMoves({
        color: 'black',
        moves: [
          {
            from: mahaChessSquareToCoord('e5'),
            to: mahaChessSquareToCoord('e4'),
          },
        ],
      })
    );

    expect(t2MovesSubmission.ok).toBe(true);
    if (!t2MovesSubmission.ok) {
      return;
    }

    const t2AttacksSubmission = Result.all(
      game.submitAttacks({
        color: 'white',
        attacks: [],
      }),
      game.submitAttacks({
        color: 'black',
        attacks: [
          {
            from: mahaChessSquareToCoord('h4'),
            to: mahaChessSquareToCoord('f2'),
          },
        ],
      })
    );

    expect(t2AttacksSubmission.ok).toBe(true);
    if (!t2AttacksSubmission.ok) {
      return;
    }

    const [, turn] = t2AttacksSubmission.val;

    expect(turn.state).toEqual('completed');

    const newGame = new GameReconciliator(getInitialBoard(), {
      history: turn.history,
    });

    expect(newGame.state.state).toEqual('completed');
    expect(newGame.state.history).toEqual(turn.history);
    expect(newGame.state.boardState.pieceLayoutState).toEqual(
      turn.boardState.pieceLayoutState
    );
  });
});
