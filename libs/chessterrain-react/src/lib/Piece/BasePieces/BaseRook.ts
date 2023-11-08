import { Coord } from '../../util-kit';
import { Err, Result } from 'ts-results';
import { IBoard } from '../../Board/IBoard';
import { Attack, AttackOutcome } from '../../commonTypes';
import { AttackNotPossibleError } from '../../Game/errors';
import { IGame } from '../../Game/IGame';
import { GameState } from '../../Game/types';
import { BasePiece } from '../BasePiece';
import { CastlingRole } from '../types';

// TODO: Remove this as it isn't used anymore and at this level there should be no knowing of a piece called a Rook
// @Override me!
export class BaseRook extends BasePiece {
  public movesDirections: Coord[] = [];
  public canDie: boolean = false;
  public moveRange = 0;
  public attackRange = 0;
  public attackDamage = 0;
  public override castlingRole: CastlingRole = 'castlee';

  // @Override me in extending class
  override evalAttack(game: IGame): Attack[] {
    return [];
  }

  override evalAttackTo(game: IGame, to: Coord): Result<Attack, void> {
    return Err.EMPTY;
  }

  // @Override me in extending class
  override calculateAttackOutcome(
    attack: Attack,
    board: IBoard,
    gameState: GameState
  ): Result<AttackOutcome, AttackNotPossibleError> {
    return new Err({
      type: 'AttackNotPossible',
      content: {
        reason: 'GameNotInMovePhase',
      },
    });
  }

  // @Override in extending class
  override calculateAttackBonus(
    attack: Attack,
    board: IBoard,
    gameState: GameState
  ): number {
    return 0;
  }

  // @Override in extending class
  override calculateDefenseBonus(
    attack: Attack,
    board: IBoard<{}>,
    gameState: GameState
  ): number {
    return 0;
  }
}
