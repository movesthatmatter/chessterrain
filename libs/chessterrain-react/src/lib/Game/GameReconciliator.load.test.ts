import {
  DEFAULT_MAHA_CONFIGURATOR,
  mahaChessSquareToCoord,
  mahaPieceRegistry,
} from '@maha-monorepo/maha-chess-game-mechanics';
import { Result } from 'ts-results';
import { Board } from '../Board/Board';
import { GameReconciliator } from './GameReconciliator';
import { getLastGameTurn } from './helpers/main';

const getInitialBoard = () =>
  new Board({
    load: false,
    pieceRegistry: mahaPieceRegistry,
    configurator: DEFAULT_MAHA_CONFIGURATOR,
  });

test('load game in move phase with partial turn', () => {
  const reconciliator = new GameReconciliator(getInitialBoard());

  const defaultWhiteRook = reconciliator.board.getPieceByCoord(
    mahaChessSquareToCoord('h1')
  );
  const defaultBlackRook = reconciliator.board.getPieceByCoord(
    mahaChessSquareToCoord('a8')
  );
  const defaultBishop = reconciliator.board.getPieceByCoord(
    mahaChessSquareToCoord('f1')
  );

  expect(defaultBishop).toBeDefined();
  expect(defaultBlackRook).toBeDefined();
  expect(defaultWhiteRook).toBeDefined();

  if (!(defaultWhiteRook && defaultBlackRook && defaultBishop)) {
    return;
  }

  const submission = Result.all(
    reconciliator.submitMoves({
      color: 'white',
      moves: [
        {
          from: mahaChessSquareToCoord('d2'),
          to: mahaChessSquareToCoord('d4'),
        },
        {
          from: mahaChessSquareToCoord('c1'),
          to: mahaChessSquareToCoord('g5'),
        },
        {
          from: mahaChessSquareToCoord('e2'),
          to: mahaChessSquareToCoord('e4'),
        },
        {
          from: mahaChessSquareToCoord('f1'),
          to: mahaChessSquareToCoord('b5'),
        },
        {
          from: mahaChessSquareToCoord('g1'),
          to: mahaChessSquareToCoord('f3'),
        },
        {
          from: mahaChessSquareToCoord('e1'),
          to: mahaChessSquareToCoord('g1'),
          castle: {
            from: mahaChessSquareToCoord('h1'),
            to: mahaChessSquareToCoord('f1'),
          },
        },
      ],
    }),
    reconciliator.submitMoves({
      color: 'black',
      moves: [
        {
          from: mahaChessSquareToCoord('d7'),
          to: mahaChessSquareToCoord('d5'),
        },
        {
          from: mahaChessSquareToCoord('e7'),
          to: mahaChessSquareToCoord('e5'),
        },
        {
          from: mahaChessSquareToCoord('b7'),
          to: mahaChessSquareToCoord('b5'),
        },
        {
          from: mahaChessSquareToCoord('d8'),
          to: mahaChessSquareToCoord('g5'),
        },
        {
          from: mahaChessSquareToCoord('c8'),
          to: mahaChessSquareToCoord('d7'),
        },
        {
          from: mahaChessSquareToCoord('b8'),
          to: mahaChessSquareToCoord('c6'),
        },
        {
          from: mahaChessSquareToCoord('e8'),
          to: mahaChessSquareToCoord('c8'),
          castle: {
            from: mahaChessSquareToCoord('a8'),
            to: mahaChessSquareToCoord('d8'),
          },
        },
      ],
    })
  );
  expect(submission.ok).toBe(true);
  if (!submission.ok) {
    return;
  }

  const [, turn] = submission.val;

  expect(turn.state).toEqual('inProgress');
  expect(turn.phase).toEqual('attack');

  const whiteKingRook = reconciliator.board.getPieceByCoord(
    mahaChessSquareToCoord('f1')
  );
  const blackQueenRook = reconciliator.board.getPieceByCoord(
    mahaChessSquareToCoord('d8')
  );
  const whiteWinnerBishop = reconciliator.board.getPieceByCoord(
    mahaChessSquareToCoord('b5')
  );

  expect(whiteKingRook).toBeDefined();
  expect(blackQueenRook).toBeDefined();
  expect(whiteWinnerBishop).toBeDefined();

  if (!(whiteKingRook && blackQueenRook && whiteWinnerBishop)) {
    return;
  }

  //Checking for castling to have executed correctly
  expect(whiteKingRook.state.id).toEqual(defaultWhiteRook.state.id);
  expect(blackQueenRook.state.id).toEqual(defaultBlackRook.state.id);

  //Checking for move resolution between bishop and pawn to have executed correctly
  expect(whiteWinnerBishop.state.id).toEqual(defaultBishop.state.id);
  expect(whiteWinnerBishop.state.hitPoints).toEqual(4);

  const prevGameHistory = turn.history;

  const newGame = new GameReconciliator(getInitialBoard()).loadHistory(
    prevGameHistory
  );

  expect(newGame.ok).toBe(true);
  if (!newGame.ok) {
    return;
  }

  const actual = newGame.val.state;

  expect(actual.state).toEqual('inProgress');
  expect(actual.phase).toEqual('attack');
  expect(actual.history.length).toEqual(prevGameHistory.length);
  expect(actual.boardState.pieceLayoutState).toEqual(
    turn.boardState.pieceLayoutState
  );
});

test('load game with full turn, attack and move', () => {
  const reconciliator = new GameReconciliator(getInitialBoard());

  const submission = Result.all(
    reconciliator.submitMoves({
      color: 'white',
      moves: [
        {
          from: mahaChessSquareToCoord('d2'),
          to: mahaChessSquareToCoord('d4'),
        },
        {
          from: mahaChessSquareToCoord('c1'),
          to: mahaChessSquareToCoord('g5'),
        },
        {
          from: mahaChessSquareToCoord('e2'),
          to: mahaChessSquareToCoord('e4'),
        },
        {
          from: mahaChessSquareToCoord('f1'),
          to: mahaChessSquareToCoord('b5'),
        },
        {
          from: mahaChessSquareToCoord('g1'),
          to: mahaChessSquareToCoord('f3'),
        },
        {
          from: mahaChessSquareToCoord('e1'),
          to: mahaChessSquareToCoord('g1'),
          castle: {
            from: mahaChessSquareToCoord('h1'),
            to: mahaChessSquareToCoord('f1'),
          },
        },
      ],
    }),
    reconciliator.submitMoves({
      color: 'black',
      moves: [
        {
          from: mahaChessSquareToCoord('d7'),
          to: mahaChessSquareToCoord('d5'),
        },
        {
          from: mahaChessSquareToCoord('e7'),
          to: mahaChessSquareToCoord('e5'),
        },
        {
          from: mahaChessSquareToCoord('b7'),
          to: mahaChessSquareToCoord('b5'),
        },
        {
          from: mahaChessSquareToCoord('d8'),
          to: mahaChessSquareToCoord('g5'),
        },
        {
          from: mahaChessSquareToCoord('c8'),
          to: mahaChessSquareToCoord('d7'),
        },
        {
          from: mahaChessSquareToCoord('b8'),
          to: mahaChessSquareToCoord('c6'),
        },
        {
          from: mahaChessSquareToCoord('e8'),
          to: mahaChessSquareToCoord('c8'),
          castle: {
            from: mahaChessSquareToCoord('a8'),
            to: mahaChessSquareToCoord('d8'),
          },
        },
      ],
    })
  );
  expect(submission.ok).toBe(true);
  if (!submission.ok) {
    return;
  }

  const [, firstPhase] = submission.val;

  expect(firstPhase.state).toEqual('inProgress');
  expect(firstPhase.phase).toEqual('attack');

  const attackSubmission = Result.all(
    reconciliator.submitAttacks({
      color: 'white',
      attacks: [
        {
          from: mahaChessSquareToCoord('d4'),
          to: mahaChessSquareToCoord('e5'),
        },
      ],
    }),
    reconciliator.submitAttacks({
      color: 'black',
      attacks: [
        {
          from: mahaChessSquareToCoord('d5'),
          to: mahaChessSquareToCoord('e4'),
        },
      ],
    })
  );

  expect(attackSubmission.ok).toBe(true);

  if (!attackSubmission.ok) {
    return;
  }

  const [, secondPhase] = attackSubmission.val;

  expect(secondPhase.state).toEqual('inProgress');
  expect(secondPhase.phase).toEqual('move');

  const prevHistory = secondPhase.history;

  const newGameRes = new GameReconciliator(getInitialBoard()).loadHistory(
    prevHistory
  );

  expect(newGameRes.ok).toBe(true);

  if (!newGameRes.ok) {
    return;
  }

  const newGame = newGameRes.val.state;

  expect(newGame.state).toEqual('inProgress');
  expect(newGame.phase).toEqual('move');
  expect(newGame.boardState.pieceLayoutState).toEqual(
    secondPhase.boardState.pieceLayoutState
  );
});

test('loading a complete game with full last turn using the loadHistory function', () => {
  const game = new GameReconciliator(getInitialBoard());

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

  const [, turn] = t2AttackSubmission.val;

  const history = turn.history;

  expect(turn.state).toEqual('completed');

  const newGame = new GameReconciliator(getInitialBoard());

  const newGameRes = newGame.loadHistory(history);

  expect(newGameRes.ok).toBe(true);

  if (!newGameRes.ok) {
    return;
  }

  const actual = newGameRes.val;

  expect(actual.state.state).toEqual('completed');
  expect(actual.state.history).toHaveLength(2);
  expect(actual.state.boardState.pieceLayoutState).toEqual(
    turn.boardState.pieceLayoutState
  );
});

test('loading an inProgress game with partial last turn (ended in move turn) using the loadHistory function', () => {
  const game = new GameReconciliator(getInitialBoard());

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
          from: mahaChessSquareToCoord('h4'),
          to: mahaChessSquareToCoord('f2'),
        },
      ],
    })
  );

  expect(t2MovesSubmission.ok).toBe(true);

  if (!t2MovesSubmission.ok) {
    return;
  }

  const [, turn] = t2MovesSubmission.val;

  const history = turn.history;

  expect(turn.state).toEqual('inProgress');

  const newGame = new GameReconciliator(getInitialBoard());

  const newGameRes = newGame.loadHistory(history);

  expect(newGameRes.ok).toBe(true);

  if (!newGameRes.ok) {
    return;
  }

  const actual = newGameRes.val;

  expect(actual.state.state).toEqual('inProgress');
  expect(actual.state.history).toHaveLength(2);
  expect(getLastGameTurn(actual.state)[1]).not.toBeDefined();
  expect(actual.state.boardState.pieceLayoutState).toEqual(
    turn.boardState.pieceLayoutState
  );
});
