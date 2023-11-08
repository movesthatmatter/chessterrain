import {
  calculateDistanceBetween2Coords,
  Coord,
  coordsAreEqual,
  range,
  RelativeCoord,
  serializeCoord,
  toDictIndexedBy,
} from '../util-kit';
import { Err, Ok, Result } from 'ts-results';
import { IBoard } from '../Board/IBoard';
import {
  Attack,
  AttackAbility,
  AttackOutcome,
  Move,
  MoveDirection,
  ShortMove,
} from '../commonTypes';
import { AttackNotPossibleError } from '../Game/errors';
import { getLastTurnMovesForColor, isGameInMovePhase } from '../Game/helpers';
import { IGame } from '../Game/IGame';
import { GameState } from '../Game/types';
import { isMeleeAttack } from '../util';
import { Piece } from './Piece';
import {
  CastlingRole,
  IdentifiablePieceState,
  PieceRegistry,
  PieceState,
} from './types';
import {
  checkForMoveOnDest,
  checkIfMovesAreOnExactlyOppositeDeltas,
  checkIfMovesAreOnSameDelta,
  getMoveDelta,
} from './util';

// TODO: Don't default the L here - it must be given from outside
export abstract class BasePiece<L extends string = string> implements Piece<L> {
  public state: IdentifiablePieceState;

  public abstract movesDirections: MoveDirection[];

  public abstract canDie: boolean; // If a canDie=false piece runs out of life, game ends!

  public abstract moveRange: number;

  public abstract attackDamage: number;

  public abstract attackRange: number;

  public castlingRole: CastlingRole = 'none';

  constructor(id: IdentifiablePieceState['id'], props: PieceState<L>) {
    this.state = { ...props, id };
  }

  calculateNextState<P extends Partial<IdentifiablePieceState>>(
    getNextState:
      | P
      | ((prev: IdentifiablePieceState) => Partial<IdentifiablePieceState>)
  ): IdentifiablePieceState {
    const nextState =
      typeof getNextState === 'function'
        ? getNextState(this.state)
        : getNextState;

    return {
      ...this.state,
      ...nextState,
    };
  }

  evalMove(game: IGame): Move[] {
    const from = game.board.getPieceCoordById(this.state.id);

    if (!from) {
      return [];
    }

    const drawnMoves = isGameInMovePhase(game.state)
      ? game.state[this.state.color].moves || []
      : [];

    const drawnMovesIndexedByDest = toDictIndexedBy(drawnMoves, (move) =>
      serializeCoord(move.to)
    );

    return this.movesDirections.reduce((moves, dir) => {
      const totalMovesOnDirection = range(this.moveRange, 1).reduce(
        (accum, r) => {
          //Short circuit it if it bumps into a piece
          if (accum.obstacle) {
            return accum;
          }

          const to: Coord = {
            row: from.row + dir.row * r,
            col: from.col + dir.col * r,
          };

          if (
            to.row >= game.board.state.pieceLayoutState.length ||
            to.col >= game.board.state.pieceLayoutState[0].length ||
            to.row < 0 ||
            to.col < 0
          ) {
            return { ...accum, obstacle: true };
          }

          const result = this.evalMoveTo(game, to);

          if (result.ok) {
            const move = result.val;
            return {
              moves: [...accum.moves, move],
              obstacle: false,
            };
          }

          if (serializeCoord(to) in drawnMovesIndexedByDest) {
            if (
              checkIfMovesAreOnSameDelta(
                { from, to },
                drawnMovesIndexedByDest[serializeCoord(to)]
              ) ||
              checkIfMovesAreOnExactlyOppositeDeltas(
                { from, to },
                drawnMovesIndexedByDest[serializeCoord(to)]
              )
            ) {
              return { ...accum, obstacle: true };
            }
            return accum;
          }
          return accum;
        },
        { moves: [], obstacle: false } as { moves: Move[]; obstacle: boolean }
      );
      return [...moves, ...totalMovesOnDirection.moves];
    }, [] as Move[]);
  }

  //Override where piece has peculiar rules
  evalMoveTo(game: IGame, to: Coord): Result<Move, void> {
    const from = game.board.getPieceCoordById(this.state.id);

    if (!from) {
      return Err.EMPTY;
    }

    const moveDelta = getMoveDelta({ from, to });

    const dist = calculateDistanceBetween2Coords(from, to);

    const actualRange =
      this.moveRange *
      Math.max(Math.abs(moveDelta.col), Math.abs(moveDelta.row));

    if (
      dist > actualRange ||
      !this.movesDirections.find((c) => coordsAreEqual(c, moveDelta))
    ) {
      return Err.EMPTY;
    }

    const res = checkForMoveOnDest({
      game,
      to,
      from,
      piece: this,
      dir: moveDelta,
    });

    return res ? new Ok(res) : Err.EMPTY;
  }

  //Override where piece has peculiar rules - ex: Rook
  evalAttack(game: IGame): Attack[] {
    const from = game.board.getPieceCoordById(this.state.id);

    if (!from) {
      return [];
    }

    return this.movesDirections.reduce((total, dir) => {
      const attackOnDir = range(this.attackRange, 1).reduce(
        (accum, r) => {
          if (accum.obstacle) {
            return accum;
          }

          const to: Coord = {
            row: from.row + dir.row * r,
            col: from.col + dir.col * r,
          };

          if (
            to.row >= game.board.state.pieceLayoutState.length ||
            to.col >= game.board.state.pieceLayoutState[0].length ||
            to.row < 0 ||
            to.col < 0
          ) {
            return { ...accum, obstacle: true };
          }

          const targetSq = game.board.getPieceByCoord(to);

          if (!targetSq) {
            return accum;
          }

          const result = this.evalAttackTo(game, to); //TODO optimize by only checking from last checked point

          if (result.ok) {
            return { attack: result.val, obstacle: true };
          }

          return { ...accum, obstacle: true };
        },
        { attack: undefined, obstacle: false } as {
          attack: Attack | undefined;
          obstacle: boolean;
        }
      );

      if (attackOnDir.attack) {
        return [...total, attackOnDir.attack];
      }
      return total;
    }, [] as Attack[]);
  }

  //@Override per piece with specific
  evalAttackTo(
    game: IGame<PieceRegistry>,
    to: RelativeCoord
  ): Result<Attack, void> {
    return Err.EMPTY;
  }

  //@Override per piece with specific when needed else return default 0
  calculateAttackBonus(
    _: Attack,
    __: IBoard<{}>,
    ___: GameState
  ): number {
    return 0;
  }

  //@Override per piece with specific where needed else return default 0
  calculateDefenseBonus(
    attack: Attack,
    board: IBoard<{}>,
    gameState: GameState
  ): number {
    return 0;
  }

  // @Override where specific rules apply, otherwise return default
  calculateAttackOutcome(
    attack: Attack,
    board: IBoard,
    gameState: GameState
  ): Result<AttackOutcome, AttackNotPossibleError> {
    const targetPiece = board.getPieceByCoord(attack.to);

    if (!targetPiece) {
      return new Err({
        type: 'AttackNotPossible',
        content: {
          reason: 'AttackerPieceNotExistent',
        },
      });
    }

    const damage =
      this.attackDamage +
      this.calculateAttackBonus(attack, board, gameState) -
      targetPiece.calculateDefenseBonus(attack, board, gameState);

    return Ok({
      attack,
      willTake:
        // TODO: This should probably not matter at this level since the Piece doesn't know ab the other pieces
        // But it's ok for now as it's pretty straightforward, if the state is already < 0 (meaning the piece died)
        //  don't take it, buuuut I would say it shouldn't even get here in that case. Need to look into it more!
        targetPiece.state.hitPoints <= 0
          ? false
          : isMeleeAttack(attack) && targetPiece.state.hitPoints - damage <= 0,
      damage,
    });
  }

  checkMoveThisTurn(gameState: GameState): Result<ShortMove, void> {
    const moves = getLastTurnMovesForColor(gameState, this.state.color);
    const movesByPieceId = toDictIndexedBy(
      moves || [],
      (move) => move.piece.id
    );
    return this.state.id in movesByPieceId
      ? new Ok(movesByPieceId[this.state.id])
      : Err.EMPTY;
  }

  canAttackThisTurn(game: IGame): AttackAbility {
    const attacksThisTurn = this.evalAttack(game);
    return {
      melee: attacksThisTurn.length > 0,
    };
  }

  serialize() {
    return {
      ...this.state,
      movesDirections: this.movesDirections,
      canDie: this.canDie,
      moveRange: this.moveRange,
      attackDamage: this.attackDamage,
      attackRange: this.attackRange,
    } as const;
  }
}
