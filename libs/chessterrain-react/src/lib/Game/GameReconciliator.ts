import { Err, Ok, Result } from 'ts-results';
import {
  groupByIndex,
  MatrixIndex,
  matrixInsertMany,
  resultError,
  serializeCoord,
  SerializedCoord,
  toDictIndexedBy,
} from '../util-kit';
import { Game, GameProps } from './Game';
import {
  SubmitMovesNotPossibleError,
  SubmitAttacksNotPossibleError,
  getSubmitMovesNotPossibleError,
  getSubmitAttacksNotPossibleError,
  ValidateMovesError,
  ValidateAttacksError,
} from './errors';
import {
  GameState,
  GameStateCompleted,
  GameStateInAttackPhaseWithPartialSubmission,
  GameStateInAtttackPhaseWithNoSubmission,
  GameStateInMovePhaseWithNoSubmission,
  GameStateInMovePhaseWithPartialSubmission,
} from './types';
import { toOppositeColor } from '../util/game';
import {
  executeBattlesAndApplyDamageForPairs,
  sortBattlePairsByLoserWinnerOrder,
  isGameInAttackPhase,
  isGameInAttackPhaseWithPartialSubmission,
  isGameInMovePhase,
  isGameInMovePhaseWithPartialSubmission,
  gameHistoryToShortGameHistory,
} from './helpers';
import {
  AttackOutcome,
  Color,
  ConflictResolutionType,
  GameHistory,
  PartialGameTurn,
  ShortAttack,
  ShortGameHistory,
  ShortMove,
} from '../commonTypes';
import { IdentifiablePieceState, PieceRegistry } from '../Piece/types';
import { Board } from '../Board/Board';
import { IGameReconciliator } from './IGameReconciliator';
import { IBoard } from '../Board/IBoard';
import {
  coordToAlphaNotation,
  movesAreEqual,
  moveToAlphaNotationMove,
} from '../util';

export class GameReconciliator<PR extends PieceRegistry = PieceRegistry>
  extends Game<PR>
  implements IGameReconciliator<PR>
{
  constructor(
    public override board: Board<PR>,
    protected override gameProps?: GameProps,
    // TODO: this should be part of an options object once we have more than 1
    public conflictResolutionType?: ConflictResolutionType
  ) {
    super(board, gameProps);

    if (gameProps?.history) {
      this.getFromHistory(gameHistoryToShortGameHistory(gameProps.history)).map(
        (p) => {
          // Overwrite the state properties to the calculated one
          this.board = p.board; // TODO Is this good enough or should it be duplicated?
          this.partialState = p.partialState;
        }
      );
    }
  }

  private getFromHistory = (history: ShortGameHistory) => {
    return history
      .reduce<
        Result<
          GameReconciliator<any>,
          SubmitAttacksNotPossibleError | SubmitMovesNotPossibleError
        >
      >((gameAsRes, [nextMovePhase, nextAttackPhase]) => {
        // Apply each Move and Attack one by one for each color in order from white to black
        // Fails if an attack or a move can't be applied or if the game has completed
        return gameAsRes
          .andThen((game) =>
            game
              .submitMoves({
                color: nextMovePhase[0].color,
                moves: nextMovePhase[0].moves,
              })
              .map(() => game)
          )
          .andThen((game) =>
            game
              .submitMoves({
                color: nextMovePhase[1].color,
                moves: nextMovePhase[1].moves,
              })
              .map(() => game)
          )
          .andThen<GameReconciliator, SubmitAttacksNotPossibleError>((game) => {
            if (!nextAttackPhase) {
              return new Ok(game);
            }

            return game
              .submitAttacks({
                color: nextAttackPhase[0].color,
                attacks: nextAttackPhase[0].attacks,
                withCaptures: true,
              })
              .andThen(() =>
                game.submitAttacks({
                  color: nextAttackPhase[1].color,
                  attacks: nextAttackPhase[1].attacks,
                  withCaptures: true,
                })
              )
              .map(() => game);
          });
      }, new Ok(this.createNewGame()))
      .map((game) => ({
        board: game.board,
        partialState: game.state,
      }));
  };

  protected override createNewGame() {
    return new GameReconciliator(
      this.board,
      undefined,
      this.conflictResolutionType
    );
  }

  // This function is faster than loading a game since the loadHistory can slow things down
  // Especially when needed to be called multiple times in a row like during validation!
  // TODO: Test more to ensure other or edge cases work as well!
  override clone(): GameReconciliator {
    const tempGame = this.createNewGame();

    Object.assign(tempGame, {
      partialState: { ...this.partialState },
      board: this.board.clone(),
    });

    return tempGame as unknown as GameReconciliator;
  }

  loadHistory(history: GameHistory) {
    return this.loadShortHistory(gameHistoryToShortGameHistory(history));
  }

  loadShortHistory(history: ShortGameHistory) {
    return this.getFromHistory(history).map((p) => {
      // Overwrite the state properties to the calculated one
      this.board = p.board; // TODO Is this good enough or should it be duplicated?
      this.partialState = p.partialState;

      return this;
    });
  }

  submitMoves({
    color,
    moves,
  }: {
    color: Color;
    moves: ShortMove[];
  }): Result<
    | GameStateInMovePhaseWithPartialSubmission
    | GameStateInAtttackPhaseWithNoSubmission
    | GameStateCompleted,
    SubmitMovesNotPossibleError
  > {
    if (!(this.state.state === 'pending' || isGameInMovePhase(this.state))) {
      return new Err(
        getSubmitMovesNotPossibleError(
          'GameNotInMovePhase',
          this.state,
          this.export()
        )
      );
    }

    const prevGame = this.state;
    const oppositeColor = toOppositeColor(color);

    if (
      isGameInMovePhaseWithPartialSubmission(prevGame) &&
      prevGame[color].canDraw
    ) {
      // TODO: This shouldn't have to be recasted as the canDraw check above should suffice
      //  but for some reason the compiler doesn't see it
      const oppositeColorMoves = prevGame[oppositeColor].moves as ShortMove[];

      const validateOppositeMoveRes = this.validateMoves(
        oppositeColorMoves,
        oppositeColor
      );

      if (!validateOppositeMoveRes.ok) {
        return new Err(
          getSubmitMovesNotPossibleError(
            `InvalidMoves:${oppositeColor}`,
            this.state,
            this.export(),
            {
              validationErrorType: validateOppositeMoveRes.val.type,
              validationErrorReason: validateOppositeMoveRes.val.reason,
              ...validateOppositeMoveRes.val.content,
              turn: this.state.history.length + 1, // Non Index Based
            }
          )
        );
      }

      const currentColorMoves = moves;

      const validateCurrentColorMoveRes = this.validateMoves(
        currentColorMoves,
        color
      );

      if (!validateCurrentColorMoveRes.ok) {
        return new Err(
          getSubmitMovesNotPossibleError(
            `InvalidMoves:${color}`,
            this.state,
            this.export(),
            {
              validationErrorType: validateCurrentColorMoveRes.val.type,
              validationErrorReason: validateCurrentColorMoveRes.val.reason,
              ...validateCurrentColorMoveRes.val.content,
              turn: this.state.history.length + 1, // Non Index Based
            }
          )
        );
      }

      const movesRes = this.board.applyMoves(
        [...oppositeColorMoves, ...currentColorMoves],
        ([prevMove, nextMove]) =>
          executeBattlesAndApplyDamageForPairs([[prevMove, nextMove]], this)
            .map(sortBattlePairsByLoserWinnerOrder)
            .mapErr(() => 'MovesNotPossible' as const)
            .map(([r]) => r)
      );

      if (!movesRes.ok) {
        return new Err(
          getSubmitMovesNotPossibleError(
            'MovesNotPossible',
            this.state,
            this.export()
          )
        );
      }

      const {
        [color]: currentRes = [],
        [toOppositeColor(color)]: oppositeRes = [],
      } = groupByIndex(movesRes.val, (m) => m.piece.color);

      const nextGameTurn: PartialGameTurn =
        color === 'white'
          ? [
              [
                {
                  color: 'black',
                  moves: oppositeRes,
                },
                {
                  color: 'white',
                  moves: currentRes,
                },
              ],
            ]
          : [
              [
                {
                  color: 'white',
                  moves: oppositeRes,
                },
                {
                  color: 'black',
                  moves: currentRes,
                },
              ],
            ];

      this.cleanBoardAfterSubmission();

      const winner = this.checkWinner();

      if (winner) {
        const nextState: GameStateCompleted = {
          ...prevGame,
          state: 'completed',
          history: [...prevGame.history, nextGameTurn],
          winner,
          boardState: this.board.state,

          phase: undefined,
          submissionStatus: undefined,
          white: undefined,
          black: undefined,
        };
        const { boardState, ...nextPartialState } = nextState;

        this.partialState = nextPartialState;

        return new Ok(nextState);
      }

      const nextState: GameStateInAtttackPhaseWithNoSubmission = {
        ...prevGame,
        phase: 'attack',
        submissionStatus: 'none',
        history: [...prevGame.history, nextGameTurn],
        white: {
          canDraw: true,
          attacks: undefined,
        },
        black: {
          canDraw: true,
          attacks: undefined,
        },
        boardState: this.board.state,
      };

      const { boardState, ...nextPartialState } = nextState;

      this.partialState = nextPartialState;

      return new Ok(nextState);
    }

    const nextState: GameStateInMovePhaseWithPartialSubmission = {
      ...prevGame,
      state: 'inProgress',
      phase: 'move',
      winner: undefined,
      submissionStatus: 'partial',
      ...(color === 'white'
        ? {
            white: {
              canDraw: false,
              moves,
            },
            black: {
              canDraw: true,
              moves: undefined,
            },
          }
        : {
            white: {
              canDraw: true,
              moves: undefined,
            },
            black: {
              canDraw: false,
              moves,
            },
          }),
    };

    const { boardState, ...nextPartialState } = nextState;

    this.partialState = nextPartialState;

    return new Ok(nextState);
  }

  private validateMoves(
    moves: ShortMove[],
    color: Color
  ): Result<void, ValidateMovesError> {
    const tempGame = this.clone();

    if (isGameInMovePhase(tempGame.state)) {
      tempGame.state[color].moves = [...moves];
    }

    return moves
      .reduce((accum, nextMove) => {
        if (!accum.ok) {
          return accum;
        }

        const game = accum.val;

        const piece = game.board.getPieceByCoord(nextMove.from);

        if (!piece) {
          return new Err(
            resultError('ValidateMovesError', 'MissingPiece', {
              culpritMoveStr: moveToAlphaNotationMove(nextMove),
              culpritMove: nextMove,
              color,
              info: `Missing From Piece > ${coordToAlphaNotation(
                nextMove.from
              )}`,
            })
          );
        }

        if (piece.state.color !== color) {
          return new Err(
            resultError('ValidateMovesError', 'PieceNotOfColor', {
              culpritMoveStr: moveToAlphaNotationMove(nextMove),
              culpritMove: nextMove,
              color,
            })
          );
        }

        return piece
          .evalMoveTo(game, nextMove.to, nextMove.promotion)
          .mapErr((e) =>
            resultError('ValidateMovesError', 'EvalMoveToFailed', {
              error: e,
              color,
              culpritMoveStr: moveToAlphaNotationMove(nextMove),
              culpritMove: nextMove,
            })
          )
          .andThen((moveOutcome) => {
            if (!movesAreEqual(moveOutcome, nextMove)) {
              return new Err(
                resultError('ValidateMovesError', 'InvalidMoveOutcome', {
                  culpritMove: nextMove,
                  culpritMoveStr: moveToAlphaNotationMove(nextMove),
                  color,
                  info: 'Move Outcome & Move not equal!',
                })
              );
            }

            return new Ok(game);
          });
      }, new Ok(tempGame) as Result<Game, ValidateMovesError>)
      .map(() => undefined);
  }

  submitAttacks({
    color,
    attacks,
    withCaptures = true,
  }: {
    color: Color;
    attacks: ShortAttack[];
    withCaptures?: boolean;
  }): Result<
    | GameStateInAttackPhaseWithPartialSubmission
    | GameStateInMovePhaseWithNoSubmission
    | GameStateCompleted,
    SubmitAttacksNotPossibleError
  > {
    if (!isGameInAttackPhase(this.state)) {
      return new Err(
        getSubmitAttacksNotPossibleError('GameNotInAttackPhase', {
          gameExport: this.export(),
          game: this.state,
          submission: {
            color,
            attacks,
            withCaptures,
          },
        })
      );
    }

    const prevGameState = this.state;
    const oppositeColor = toOppositeColor(color);

    const prevGameInstance = new Game(this.board, this.gameProps);

    prevGameInstance.load(prevGameState);

    if (
      isGameInAttackPhaseWithPartialSubmission(prevGameState) &&
      prevGameState[color].canDraw
    ) {
      // TODO: This shouldn't have to be recasted as the canDraw check above should suffice
      //  but for some reason the compiler doesn't see it
      const oppositeColorAttacks = prevGameState[oppositeColor]
        .attacks as ShortAttack[];
      const currentColorAttacks = attacks;

      const validatOppositeAttacksRes = this.validateAttacks(
        oppositeColorAttacks,
        oppositeColor
      );

      if (!validatOppositeAttacksRes.ok) {
        return new Err(
          getSubmitAttacksNotPossibleError(
            `InvalidAttacks:${oppositeColor}`,
            {
              gameExport: this.export(),
              game: this.state,
              submission: {
                color,
                attacks,
                withCaptures,
              },
            },
            validatOppositeAttacksRes.val.content
          )
        );
      }

      const validateCurrentAttacksRes = this.validateAttacks(
        currentColorAttacks,
        color
      );

      if (!validateCurrentAttacksRes.ok) {
        // TODO: This could be reworked a little to be composable with other errors like the validation errors
        return new Err(
          getSubmitAttacksNotPossibleError(
            `InvalidAttacks:${color}`,
            {
              gameExport: this.export(),
              game: this.state,
              submission: {
                color,
                attacks,
                withCaptures,
              },
            },
            validateCurrentAttacksRes.val.content
          )
        );
      }

      const oppositeColorAttacksRes = this.board.applyAttacks(
        oppositeColorAttacks,
        this.state
      );

      if (!oppositeColorAttacksRes.ok) {
        return new Err(
          getSubmitAttacksNotPossibleError(`InvalidAttacks:${oppositeColor}`, {
            gameExport: this.export(),
            game: this.state,
            submission: {
              color,
              attacks,
              withCaptures,
            },
          })
        );
      }

      const currentColorAttacksRes = this.board.applyAttacks(
        currentColorAttacks,
        this.state
      );

      if (!currentColorAttacksRes.ok) {
        return new Err(
          getSubmitAttacksNotPossibleError(`InvalidAttacks:${color}`, {
            gameExport: this.export(),
            game: this.state,
            submission: {
              color,
              attacks,
              withCaptures,
            },
          })
        );
      }

      // TODO: Attempted to join the attacks into 1, and do some of the cleaning logic directly on the board
      // But there are some complications with that b/c the attackOutcomes need to be matched back to current/opposite color otherwise a lot of tests are failing
      /// (at least that's why I think they fail).
      // the benefit of that would be that the pieces can be removed from the board.pieceState and then the queens don't appear anymore on berserk king when looking for all pieces
      //  but it seems like that is a small gain for all of these changes.
      // A better change would be to only get the pieces that are alive, or somehow split by alive, althought that seems more like a hack since a piece that died shouldn't be asked for anymore
      //  The reason it is asked as of now is only in attacks since the applyAttacks happens at 2 times in the board, not at one time so the board  cannot control when to clean up and when not to.
      // Another solution could be to tell it when to clean up :/. This might be a good in between until I figur out what's going on with the attack outcomes from a joined stand point.

      // const attackRes = this.board.applyAttacks(
      //   [...oppositeColorAttacks, ...currentColorAttacks],
      //   this.state
      // );

      // if (!attackRes.ok) {
      //   // return attackRes;
      //   return new Err(
      //     getSubmitAttacksNotPossibleError('InvalidAttacks', {
      //       gameExport: this.export(),
      //       game: this.state,
      //       submission: {
      //         color,
      //         attacks,
      //         withCaptures,
      //       },
      //     })
      //   );
      // }

      // const attacksOutcome = attackRes.val[0];

      // attacksOutcome.attack

      // console.group('Game Reconciliator Submit Attacks >:');
      // console.log(attacks);
      // const cleanedBoardState = this.getCleanedBoardAfterSubmission();
      // console.groupEnd();

      // if (cleanedBoardState) {
      //   this.board = new Board({
      //     load: true,
      //     pieceRegistry: this.pieceRegistry,
      //     boardState: cleanedBoardState,
      //   });
      // }

      // Deprecate in favor of the above
      if (withCaptures) {
        this.board.load(
          this.getCleanedBoardStateAfterAttackSubmission({
            oppositeColorAttacks: oppositeColorAttacksRes.val,
            currentColorAttacks: currentColorAttacksRes.val,
          })
        );

        // TODO: This should be optimized after finishing
        this.board.expensivelyCleanUpPiecesThatDied();

        this.cleanBoardAfterSubmission();

        // Optimization. Only create a new board if there is a cleaned board state
        // if (nextBoardState !== this.board.state) {
        //   // this.board = new Board({
        //   //   load: true,
        //   //   pieceRegistry: this.pieceRegistry,
        //   //   boardState: nextBoardState,
        //   // });

        //   this.board.load(nextBoardState);

        //   //  this.board
        // }
      }

      const prevPartialTurn = prevGameState.history.slice(
        -1
      )[0] as PartialGameTurn;
      const nextFullGameTurn = [
        ...prevPartialTurn,
        color === 'white'
          ? [
              {
                color: 'black',
                attacks: oppositeColorAttacksRes.val,
              },
              {
                color: 'white',
                attacks: currentColorAttacksRes.val,
              },
            ]
          : [
              {
                color: 'white',
                attacks: oppositeColorAttacksRes.val,
              },
              {
                color: 'black',
                attacks: currentColorAttacksRes.val,
              },
            ],
      ];
      const prevHistoryWithoutPartial: GameHistory =
        prevGameState.history.slice(0, -1);
      const nextHistory: GameHistory = [
        ...prevHistoryWithoutPartial,
        nextFullGameTurn,
      ] as GameHistory;

      const winner = this.checkWinner();

      if (winner) {
        const nextState: GameStateCompleted = {
          ...prevGameState,
          history: nextHistory,
          winner,
          state: 'completed',
          boardState: this.board.state,

          phase: undefined,
          submissionStatus: undefined,
          white: undefined,
          black: undefined,
        };
        const { boardState, ...nextPartialState } = nextState;

        this.partialState = nextPartialState;

        return new Ok(nextState);
      }

      const nextState: GameStateInMovePhaseWithNoSubmission = {
        ...prevGameState,
        phase: 'move',
        submissionStatus: 'none',
        history: nextHistory,
        white: {
          canDraw: true,
          moves: undefined,
        },
        black: {
          canDraw: true,
          moves: undefined,
        },
        boardState: this.board.state,
      };

      const { boardState, ...nextPartialState } = nextState;

      this.partialState = nextPartialState;

      return new Ok(nextState);
    }

    // Game In Attack Phase with No Submission
    const nextState: GameStateInAttackPhaseWithPartialSubmission = {
      ...prevGameState,
      state: 'inProgress',
      phase: 'attack',
      winner: undefined,
      submissionStatus: 'partial',
      ...(color === 'white'
        ? {
            white: {
              canDraw: false,
              attacks,
            },
            black: {
              canDraw: true,
              attacks: undefined,
            },
          }
        : {
            white: {
              canDraw: true,
              attacks: undefined,
            },
            black: {
              canDraw: false,
              attacks,
            },
          }),
    };

    const { boardState, ...nextPartialState } = nextState;

    this.partialState = nextPartialState;

    return new Ok(nextState);
  }

  private validateAttacks(
    attacks: ShortAttack[],
    color: Color
  ): Result<void, ValidateAttacksError> {
    const tempGame = this.clone();

    if (isGameInAttackPhase(tempGame.state)) {
      tempGame.state[color].attacks = [...attacks];
    }

    return attacks
      .reduce((accum, nextAttack) => {
        if (!accum.ok) {
          return accum;
        }

        const game = accum.val;
        const piece = game.board.getPieceByCoord(nextAttack.from);

        if (!piece) {
          return new Err(
            resultError('ValidateAttacksError', 'MissingPiece', {
              culpritAttackStr: moveToAlphaNotationMove(nextAttack),
              culpritAttack: nextAttack,
              info: `Missing Piece at ${coordToAlphaNotation(nextAttack.from)}`,
            })
          );
        }

        if (piece.state.color !== color) {
          return new Err(
            resultError('ValidateAttacksError', 'PieceNotOfColor', {
              culpritAttackStr: moveToAlphaNotationMove(nextAttack),
              culpritAttack: nextAttack,
            })
          );
        }

        return piece
          .evalAttackTo(game, nextAttack.to)
          .mapErr(() =>
            resultError('ValidateAttacksError', 'EvalAttackToFailed', {
              culpritAttackStr: moveToAlphaNotationMove(nextAttack),
              culpritAttack: nextAttack,
              // TODO: The returned error could be forwarded it here once it's defined
            })
          )
          .andThen((attackOutcome) => {
            if (!movesAreEqual(attackOutcome, nextAttack)) {
              return new Err(
                resultError('ValidateAttacksError', 'InvalidAttackOutcome', {
                  culpritAttack: nextAttack,
                  culpritAttackStr: moveToAlphaNotationMove(nextAttack),
                  info: 'Move Outcome & Move not equal!',
                })
              );
            }

            return new Ok(game);
          });
      }, new Ok(tempGame) as Result<Game, ValidateAttacksError>)
      .map(() => undefined);
  }

  protected checkWinner(): GameState['winner'] | undefined {
    const allPieces = this.board.getAllPieces();

    // These are pieces that when they die the game is over
    const deadCannotDiePieces = allPieces.filter(
      ({ piece }) => piece.canDie === false && piece.state.hitPoints <= 0
    );

    // If no undying pieces are dead
    if (deadCannotDiePieces.length === 0) {
      // Check if the undying are the only ones left
      const hasPiecesThatCanDie =
        allPieces.find((p) => p.piece.canDie) || false;

      // If there are no pieces that can die left the game is over
      // i.e. King vs King as last pieces
      if (!hasPiecesThatCanDie) {
        return '1/2';
      }

      return undefined;
    }

    const { white: deadWhite, black: deadBlack } = toDictIndexedBy(
      deadCannotDiePieces,
      (p) => p.piece.state.color
    );

    // if both undying pieces (i.e. kings) have just died then it's a draw
    if (deadWhite && deadBlack) {
      return '1/2';
    }

    // Otherwise the remaining side wins
    return deadWhite ? 'black' : 'white';
  }

  protected cleanBoardAfterSubmission() {
    // This just an overridable
    // return this.board.state;
  }

  protected getCleanedBoardStateAfterAttackSubmission({
    oppositeColorAttacks,
    currentColorAttacks,
  }: {
    oppositeColorAttacks: AttackOutcome[];
    currentColorAttacks: AttackOutcome[];
  }): IBoard['state'] {
    const attacksWithPiecesThatNeedToDie = [
      ...oppositeColorAttacks,
      ...currentColorAttacks,
    ]
      .filter((outcome) => {
        const victim = this.board.getPieceByCoord(outcome.attack.to);

        // Clean up only the pieces that can die!
        return victim && victim.canDie && victim.state.hitPoints <= 0;
      })
      .reduce((accum, next) => {
        const key = serializeCoord(next.attack.to);

        if (!(key in accum)) {
          return { ...accum, [key]: next };
        }
        return accum;
      }, {} as Record<SerializedCoord, AttackOutcome>);

    // Board Cleanup - Remove pieces with 0 health and move where the attack was Melee
    const cleanedPieceLayout: IBoard['state']['pieceLayoutState'] =
      matrixInsertMany(
        this.board.state.pieceLayoutState,
        Object.values(attacksWithPiecesThatNeedToDie).reduce(
          (prevAttacks, { attack }) => {
            const victim = this.board.getPieceByCoord(attack.to);
            const attacker = this.board.getPieceByCoord(attack.from);

            if (!victim || !attacker || victim.state.hitPoints > 0) {
              return prevAttacks;
            }

            if (attacker.state.hitPoints <= 0) {
              return [
                ...prevAttacks,
                {
                  index: [attack.to.row, attack.to.col],
                  nextVal: 0,
                },
                {
                  index: [attack.from.row, attack.from.col],
                  nextVal: 0,
                },
              ];
            }

            //Attacker stays put and just victim gets erased
            return [
              ...prevAttacks,
              {
                index: [attack.to.row, attack.to.col],
                nextVal: 0,
              },
            ];
          },
          [] as {
            index: MatrixIndex;
            nextVal: 0 | IdentifiablePieceState;
          }[]
        )
      );

    return {
      terrainState: this.board.state.terrainState,
      pieceLayoutState: cleanedPieceLayout,
    };
  }
}
