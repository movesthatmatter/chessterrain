import { Err, Ok, Result } from 'ts-results';
import {
  GameState,
  GameStateCompleted,
  GameStateInAttackPhase,
  GameStateInAttackPhaseWithPreparingSubmission,
  GameStateInMovePhase,
  GameStateInMovePhaseWithPreparingSubmission,
  GameStateInProgress,
  GameStatePending,
  GameWinner,
  InProgressGameStatePhaseSlice,
} from './types';
import {
  getMoveNotPossibleError,
  getAttackNotPossibleError,
} from './errors/helpers';
import { Board } from '../Board/Board';
import { AttackNotPossibleError, MoveNotPossibleError } from './errors';
import {
  insertItemIntoArrayOnIndex,
  isGameInAttackPhase,
  isGameInAttackPhaseWithPreparingSubmission,
  isGameInMovePhase,
  isGameInMovePhaseWithPreparingSubmission,
  removeItemAtIndex,
} from './helpers/main';
import { IGame } from './IGame';
import { Attack, Color, GameHistory, Move, ShortMove } from '../commonTypes';
import { PieceRegistry } from '../Piece/types';
import { Coord, coordsAreEqual } from '../util-kit';

export type GameProps = {
  history: GameHistory;
  winner?: GameWinner;
};

export type PartialGameStatePending = Omit<GameStatePending, 'boardState'>;
export type PartialGameStateInProgress = Omit<
  GameStateInProgress,
  'boardState'
> &
  InProgressGameStatePhaseSlice;
export type PartialGameStateCompleted = Omit<GameStateCompleted, 'boardState'>;

export type PartialState =
  | PartialGameStatePending
  | PartialGameStateInProgress
  | PartialGameStateCompleted;

export class Game<PR extends PieceRegistry = PieceRegistry>
  implements IGame<PR>
{
  // This is the state the Game class works with.
  //  The first level of the State, not the nested ones like board, etc..
  // As the nested ones get merged back in the state getter method
  protected partialState: PartialState;

  constructor(public board: Board<PR>, protected gameProps?: GameProps) {
    this.partialState = this.calcPartialState(gameProps);
  }

  private calcPartialState = (gameProps?: GameProps): PartialState => {
    if (!gameProps || gameProps.history.length === 0) {
      return {
        state: 'pending',
        winner: undefined,
        history: [],
      };
    }

    if (gameProps.history.length > 0 && gameProps.winner) {
      return {
        state: 'completed',
        winner: gameProps.winner,
        history: gameProps.history,
      };
    }

    return {
      state: 'inProgress',
      winner: undefined,

      // TODO: this isn't enough as the board state could be different than the calculated one coming from the history
      history: gameProps.history,
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
    };
  };

  start(): void {
    if (this.state.state !== 'pending') {
      return;
    }

    const inProgressState: PartialGameStateInProgress = {
      ...this.partialState,
      state: 'inProgress',
      history: [],
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

    this.partialState = inProgressState;
  }

  // Loads a new GameState and does all the needed calculations
  // TODO: Rename to setState
  load({ boardState, ...partialState }: GameState): void {
    // this.board = new Board({
    //   load: true,
    //   boardState,
    //   pieceRegistry: this.pieceRegistry,
    // });
    this.board.load(boardState);

    this.partialState = partialState;
  }

  // When a Move is Succesfully Drawn it gets appended to the nextMoves List of the "move" phase
  // TODO: TEST!
  drawMove(move: ShortMove): Result<
    {
      move: Move;
      gameState: GameStateInProgress;
    },
    MoveNotPossibleError
  > {
    // Can't make a move when game is completed
    if (this.partialState.state === 'completed') {
      return new Err(getMoveNotPossibleError('GameIsCompleted'));
    }

    if (!(isGameInMovePhase(this.state) || this.state.state === 'pending')) {
      return new Err(getMoveNotPossibleError('GameNotInMovePhase'));
    }

    const piece = this.board.getPieceByCoord(move.from);

    if (!piece) {
      return new Err(getMoveNotPossibleError('PieceNotExistent'));
    }

    // TODO: Change this to evalMoveTo so it doesn't recalculate all the possibilities!
    const dests = piece.evalMove(this);

    const moveIsPartOfDests = dests.find((d) => coordsAreEqual(d.to, move.to));

    // Move is Valid
    if (!moveIsPartOfDests) {
      return new Err(getMoveNotPossibleError('DestinationNotValid'));
    }

    const indexOfAPreviousMoveByPiece = (
      (this.state as GameStateInMovePhase)[piece.state.color].moves || []
    ).findIndex((m) => coordsAreEqual(m.from, move.from));

    const preparingState: GameStateInMovePhaseWithPreparingSubmission = {
      ...this.state,
      state: 'inProgress',
      winner: undefined,
      submissionStatus: 'preparing',
      phase: 'move',

      ...(isGameInMovePhaseWithPreparingSubmission(this.state)
        ? {
            white: this.state.white,
            black: this.state.black,
          }
        : {
            white: {
              canDraw: true,
              moves: [],
            },
            black: {
              canDraw: true,
              moves: [],
            },
          }),
    };

    const nextMove: Move = {
      ...move,
      piece: piece.state,
      // TODO: Add promotion
    };

    // TODO: Update the board and all the other state derivates
    this.partialState = {
      ...preparingState,
      ...(isGameInMovePhaseWithPreparingSubmission(preparingState) && {
        white: {
          ...preparingState.white,
          ...(nextMove.piece.color === 'white' && {
            moves:
              indexOfAPreviousMoveByPiece > -1
                ? [
                    ...removeItemAtIndex(
                      preparingState.white.moves,
                      indexOfAPreviousMoveByPiece
                    ),
                    nextMove,
                  ]
                : [...preparingState.white.moves, nextMove],
          }),
        },
        black: {
          ...preparingState.black,
          ...(nextMove.piece.color === 'black' && {
            moves:
              indexOfAPreviousMoveByPiece > -1
                ? [
                    ...removeItemAtIndex(
                      preparingState.black.moves,
                      indexOfAPreviousMoveByPiece
                    ),
                    nextMove,
                  ]
                : [...preparingState.black.moves, nextMove],
          }),
        },
      }),
    };

    return new Ok({
      move: nextMove,
      gameState: this.state as GameStateInProgress,
    });
  }

  // // When an Attack is Succesfully Drawn it gets appended to the nextAttacks List of the "attack" phase
  // TODO: Test
  drawAttack(
    from: Coord,
    to: Coord
  ): Result<
    {
      attack: Attack;
      gameState: GameStateInProgress;
    },
    AttackNotPossibleError
  > {
    // Can't make a move when game is completed
    if (this.partialState.state === 'completed') {
      return new Err(getAttackNotPossibleError('GameIsCompleted'));
    }

    if (!isGameInAttackPhase(this.state)) {
      return new Err(getAttackNotPossibleError('GameNotInMovePhase'));
    }

    const piece = this.board.getPieceByCoord(from);

    if (!piece) {
      return new Err(getAttackNotPossibleError('AttackerPieceNotExistent'));
    }

    const dests = piece.evalAttack(this);
    const attackIsPartOfDests = dests.find((d) => coordsAreEqual(d.to, to));

    // Attack is Valid
    if (!attackIsPartOfDests) {
      return new Err(getAttackNotPossibleError('DestinationNotValid'));
    }

    const indexOfAPreviousAttackByPiece = (
      (this.state as GameStateInAttackPhase)[piece.state.color].attacks || []
    ).findIndex((a) => coordsAreEqual(a.from, from));

    const preparingState: GameStateInAttackPhaseWithPreparingSubmission = {
      ...this.state,
      history: [...this.state.history],
      state: 'inProgress',
      winner: undefined,
      submissionStatus: 'preparing',
      phase: 'attack',

      ...(isGameInAttackPhaseWithPreparingSubmission(this.state)
        ? {
            white: this.state.white,
            black: this.state.black,
          }
        : {
            white: {
              canDraw: true,
              attacks: [],
            },
            black: {
              canDraw: true,
              attacks: [],
            },
          }),
    };

    const attack: Attack = {
      from,
      to,
    };

    // TODO: Update the board and all the other state derivates
    this.partialState = {
      ...preparingState,
      ...(isGameInAttackPhaseWithPreparingSubmission(preparingState) && {
        white: {
          ...preparingState.white,
          ...(piece.state.color === 'white' && {
            attacks: insertItemIntoArrayOnIndex(
              preparingState.white.attacks,
              attack,
              indexOfAPreviousAttackByPiece
            ),
          }),
        },
        black: {
          ...preparingState.black,
          ...(piece.state.color === 'black' && {
            attacks: insertItemIntoArrayOnIndex(
              preparingState.black.attacks,
              attack,
              indexOfAPreviousAttackByPiece
            ),
          }),
        },
      }),
    };

    return new Ok({
      attack,
      gameState: this.state,
    });
  }

  evalIfPossibleAttacks(color: Color): boolean {
    return this.state.boardState.pieceLayoutState.some((row, rowIndex) =>
      row.some((col, colIndex) => {
        const piece = this.board.getPieceByCoord({
          row: rowIndex,
          col: colIndex,
        });
        if (!piece || piece.state.color !== color) {
          return false;
        }

        return piece.evalAttack(this).length > 0;
      })
    );
  }

  // This function is faster than loading a game since the loadHistory can slow things down
  // Especially when needed to be called multiple times in a row like during validation!
  // TODO: Test more to ensure other or edge cases work as well!
  clone(): Game {
    const tempGame = this.createNewGame();

    Object.assign(tempGame, {
      partialState: { ...this.partialState },
      board: this.board.clone(),
    });

    return tempGame as unknown as Game;
  }

  protected createNewGame() {
    // return new Game(this.pieceRegistry, this.configurator);
    return new Game(this.board.createNewBoard());
  }

  get state(): GameState {
    return {
      ...this.partialState,
      boardState: this.board.state,
    };
  }

  export() {
    return 'TBD'; // TODO: Add PNG or other notation for the basic GAme
  }

  exportPosition() {
    return this.board.export();
  }
}
