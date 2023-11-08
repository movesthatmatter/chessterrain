import { Coord } from '../../util-kit';
import { Err, Result } from 'ts-results';
import { IBoard } from '../../Board/IBoard';
import { Attack } from '../../commonTypes';
import { IGame } from '../../Game/IGame';
import { GameState } from '../../Game/types';
import { BasePiece } from '../BasePiece';
import { CastlingRole } from '../types';

// TODO: Consider renaming this as UndyingPiece or something, not a king, so it's more generic
//  A King or any other piece at a higher level will extend this, and internall at this level the instance of the Undying Piece
//  will be used to check various requirements. Like if the game is ended
// @Override me!
export class BaseKing extends BasePiece {
  public movesDirections: Coord[] = [];
  public canDie: boolean = false;
  public moveRange = 0;
  public attackRange = 0;
  public attackDamage = 0;
  public override castlingRole: CastlingRole = 'castler';

  override evalAttackTo(game: IGame, to: Coord): Result<Attack, void> {
    return Err.EMPTY;
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
