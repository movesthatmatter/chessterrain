// TODO: Think of a better naming between Short & Move|Attack
//  b/c what really needs to happen here is the disinction between input (Plan or Draw Move|Attack)
//  and the output (The Move or Attack's outcome);
import { AbsoluteCoord, Coord, RelativeCoord } from './util-kit';
import { IdentifiablePieceState, PieceRegistry } from './Piece/types';

export type BoardVector = {
  from: RelativeCoord;
  to: RelativeCoord;
};

export type LineVector = {
  from: AbsoluteCoord;
  to: AbsoluteCoord;
};

export type ConflictResolutionType = 'powerLevel' | 'submitOrder';

export type WhiteColor = 'white';
export type BlackColor = 'black';
export type Color = WhiteColor | BlackColor;

export type ShortWhiteColor = 'w';
export type ShortBlackColor = 'b';
export type ShortColor = ShortWhiteColor | ShortBlackColor;

export type MoveDirection = Coord;

// TODO: Rename this Move
export type ShortMove = {
  from: Coord;
  to: Coord;
  promotion?: keyof PieceRegistry;
  castle?: ShortMove; // Rook Move
};

export type MoveOutcome = ShortMove & {
  piece: IdentifiablePieceState;
};

// TODO: Rename this MoveOutcome so it uses the same standard as Attack
// @depreacate this in favor of MoveOutcome
export type Move = MoveOutcome;

// @depracate in favor of it beocmging Attack (in comparison with AttackOutcome)
export type ShortAttack = {
  from: Coord;
  to: Coord;

  // @deprecate as it's not used
  // type: 'range' | 'melee';
};

// TODO: This for now is just a an Alias for ShortAttack
export type ShortHeal = ShortAttack & {
  // isHeal: true;
};

// TODO: This is actuall just the ShortAttack as the SpecialAttacks aren't needed here!
// TODO: Take the SpecialAttacks out as they aren't needed in the Attack
export type Attack = ShortAttack & SpecialAttacks;

export type SpecialAttacks = {
  // heal?: boolean;
  // crit?: boolean;
  // attackBonus?: boolean;
  // defenseBonus?: boolean;
  // defensePenalty?: boolean;
  // movementAttackBonus?: boolean;
  aoe?: Coord[];
};

export type AttackOutcome = {
  attack: ShortAttack;
  damage: number;
  // TODO: Add the special/bonus here once we need it
  // special
  willTake: boolean;
  special?: SpecialAttacks;
};

// export type HealOutcome = AttackOutcome & {
//   // isHeal: true;
// };

export type AttackAbility = {
  melee: boolean;
  range?: boolean;
};

export type PartialGameTurnMovePhase = [
  {
    color: Color;
    moves: MoveOutcome[];
  },
  {
    color: Color;
    moves: MoveOutcome[];
  }
];
export type PartialGameTurn = [PartialGameTurnMovePhase];

export type PartialGameTurnAttackPhase = [
  {
    color: Color;
    attacks: AttackOutcome[];
  },
  {
    color: Color;
    attacks: AttackOutcome[];
  }
];
export type FullGameTurn = [
  PartialGameTurnMovePhase,
  PartialGameTurnAttackPhase
];

export type GameTurn = PartialGameTurn | FullGameTurn;
// TODO: The reconciliation for a whole history could become to costly
//  so in that case we will need to optimize it (caching, memoizine, save the pieceLayout at each step, etc..)
//  but for now we leave it as is, b/c this is the most raw data!
// export type GameHistory = FullGameTurn[] | [...FullGameTurn[], PartialGameTurn];
export type GameHistory = GameTurn[];

// Short Game History - For MPGN Notation, w/o the Move or Attach Outcome

export type PartialShortGameTurnMovePhase = [
  {
    color: Color;
    moves: ShortMove[];
  },
  {
    color: Color;
    moves: ShortMove[];
  }
];
export type PartialShortGameTurn = [PartialShortGameTurnMovePhase];

export type PartialShortGameTurnAttackPhase = [
  {
    color: Color;
    attacks: ShortAttack[];
  },
  {
    color: Color;
    attacks: ShortAttack[];
  }
];

export type FullShortGameTurn = [
  PartialShortGameTurnMovePhase,
  PartialShortGameTurnAttackPhase
];

export type ShortGameTurn = PartialShortGameTurn | FullShortGameTurn;

export type ShortGameHistory = ShortGameTurn[];
