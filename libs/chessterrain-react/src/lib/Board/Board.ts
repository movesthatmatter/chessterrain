import { Err, Ok, Result } from 'ts-results';
import {
  AttackNotPossibleError,
  getAttackNotPossibleError,
} from '../Game/errors';
import { Piece } from '../Piece/Piece';
import { Terrain } from '../Terrain';
import {
  BoardConfigurator,
  BoardState,
  PieceMetaMappedById,
  PiecesState,
} from './types';
import { IBoard } from './IBoard';
import {
  IdentifiablePieceState,
  PieceDynamicProps,
  PieceId,
  PieceRegistry,
} from '../Piece/types';
import { GameState } from '../Game/types';

import {
  boardStateToBoardConfigurator,
  getRefFromPieceId,
  toPieceId,
} from './util';
import { isPieceRef } from '../Piece/util';
import { coordToMatrixIndex, movesAreEqual } from '../util';
import {
  AttackOutcome,
  Move,
  MoveOutcome,
  ShortAttack,
  ShortMove,
} from '../commonTypes';
import {
  Coord,
  MatrixIndex,
  SerializedCoord,
  checkAllArrayItemsExist,
  matrixCreate,
  matrixGet,
  matrixGetDimensions,
  matrixInsert,
  matrixInsertMany,
  matrixMap,
  matrixReduce,
  objectKeys,
  serializeCoord,
  toDictIndexedBy,
} from '../util-kit';

type AttackZip = { attack: ShortAttack; attacker: Piece; victim: Piece };

export class Board<PR extends PieceRegistry> implements IBoard<PR> {
  public pieceRegistry: PR;

  private terrain: Terrain;

  private piecesState: PiecesState<PR>;

  private _cachedState?: BoardState;

  // This could be public if needed
  private boardConfigurator: BoardConfigurator<PR>;

  constructor(
    p:
      | {
          load?: false;
          pieceRegistry: PR;
          configurator: BoardConfigurator<PR>;
          boardState?: undefined;
        }
      | {
          load: true;
          pieceRegistry: PR;
          boardState: BoardState;
          configurator?: undefined;
        }
  ) {
    this.pieceRegistry = p.pieceRegistry;

    // this.boardConfigurator = {
    //   terrain: p.terrain,
    // }

    // Start a board from an given state!
    if (p.load) {
      const { piecesState, terrain } = this.readBoardState(p.boardState);

      this.terrain = terrain;
      this.piecesState = piecesState;

      this.boardConfigurator = boardStateToBoardConfigurator(p.boardState);

      return;
    }

    const boardConfigurator = {
      terrain: p.configurator.terrain,
      pieceLayout: p.configurator.pieceLayout,
    };

    this.boardConfigurator = boardConfigurator;

    this.terrain = new Terrain({
      load: false,
      props: boardConfigurator.terrain,
    });

    this.piecesState = this.readPieceLayoutFromConfigurator(boardConfigurator);
  }

  get configurator() {
    return this.boardConfigurator;
  }

  protected readBoardState(boardState: BoardState) {
    const terrain = new Terrain({
      load: true,
      state: boardState.terrainState,
    });

    const [layoutMatrixRows, layoutMatrixCols] = matrixGetDimensions(
      boardState.pieceLayoutState
    );

    const piecesState = matrixReduce(
      boardState.pieceLayoutState,
      (accum, next, [row, col]) => {
        if (next === 0) {
          return accum;
        }

        // TODO: This doesn't handle adding a new piece to the layout (i.e. promotion) yet!
        // The id gets created by the original Coord, but this is open to change!
        const ref = getRefFromPieceId(next.id).ref;
        const piece = this.createPieceWithRef(ref, next.id, next);

        return {
          layoutMatrix: matrixInsert(accum.layoutMatrix, [row, col], next.id),
          pieceById: {
            ...accum.pieceById,
            [next.id]: {
              ref,
              piece,
              coord: { row, col },
            },
          },
        };
      },
      {
        layoutMatrix: matrixCreate(layoutMatrixRows, layoutMatrixCols, 0),
        pieceById: {},
      } as PiecesState<PR>
    );

    return { terrain, piecesState };
  }

  protected parseNotation(
    n: unknown
  ):
    | { ref: 0; props?: undefined }
    | { ref: keyof PR; props?: Partial<PieceDynamicProps> } {
    if (!isPieceRef(this.pieceRegistry, n)) {
      return { ref: 0 };
    }

    return { ref: n };
  }

  protected toNotation(pId: PieceId) {
    return getRefFromPieceId(pId).ref;
  }

  // TODO: Refactor the above to use this function as well.
  protected readPieceLayoutFromConfigurator(
    boardConfigurator: BoardConfigurator<PR>
  ) {
    return matrixReduce(
      boardConfigurator.pieceLayout,
      (prev, nextUnparsedNotation, [row, col]) => {
        const next = this.parseNotation(nextUnparsedNotation);

        if (next.ref === 0) {
          return prev;
        }

        // The id gets created by the original Coord, but this is open to change!
        const id = toPieceId(next.ref, { row, col });
        const piece = this.createPieceWithRef(next.ref, id, next.props);

        const nextLayoutMatrix = matrixInsert(
          prev.layoutMatrix,
          [row, col],
          id
        );

        return {
          pieceById: {
            ...prev.pieceById,
            [id]: {
              ref: next.ref,
              piece,
              coord: { row, col },
            },
          },
          layoutMatrix: nextLayoutMatrix,
        };
      },
      {
        layoutMatrix: matrixCreate(
          boardConfigurator.terrain.height || boardConfigurator.terrain.width,
          boardConfigurator.terrain.width,
          0
        ),
        pieceById: {},
      } as PiecesState<PR>
    );
  }

  load(boardState: BoardState) {
    const { piecesState, terrain } = this.readBoardState(boardState);

    this.terrain = terrain;
    this.piecesState = piecesState;

    this.resetCache();

    // Here could return boolean
  }

  protected createPieceWithRef(
    ref: keyof PR,
    id: PieceId,
    dynamicProps?: Partial<PieceDynamicProps>
  ) {
    return this.pieceRegistry[ref](id, dynamicProps);
  }

  private clonePieceById(id: keyof PieceMetaMappedById<PR>) {
    const prev = this.piecesState.pieceById[id];
    return this.createPieceWithRef(prev.ref, id, prev.piece.state);
  }

  isPieceOfClass(pieceId: PieceId, PieceClass: Function) {
    return this.piecesState.pieceById[pieceId]?.piece instanceof PieceClass;
  }

  isPieceAtCoordOfClass(coord: Coord, PieceClass: Function) {
    const id = this.getPieceByCoord(coord)?.state.id;

    if (!id) {
      return false;
    }

    return this.isPieceOfClass(id, PieceClass);
  }

  getAllPieces() {
    return Object.values(this.piecesState.pieceById);
  }

  getAllPiecesOfClass(PieceClass: Function) {
    return this.getAllPieces().filter((p) => p.piece instanceof PieceClass);
  }

  getPieceByCoord(coord: Coord): Piece | undefined {
    const row = this.piecesState.layoutMatrix[coord.row];

    if (!row) {
      return undefined;
    }

    const squareOrPieceId = row[coord.col];

    if (squareOrPieceId === 0) {
      return undefined;
    }

    return this.getPieceById(squareOrPieceId);
  }

  getPieceById(pieceId: PieceId): Piece | undefined {
    return this.piecesState.pieceById[pieceId]?.piece;
  }

  getPieceCoordById(pieceId: PieceId): Coord | undefined {
    return this.piecesState.pieceById[pieceId]?.coord;
  }

  updatePieceById<P extends Partial<IdentifiablePieceState>>(
    pieceId: PieceId,
    getNextState:
      | P
      | ((prev: IdentifiablePieceState) => Partial<IdentifiablePieceState>)
  ): Result<IdentifiablePieceState, void> {
    const piece = this.getPieceById(pieceId);

    if (!piece) {
      return Err.EMPTY;
    }

    piece.state = piece.calculateNextState(getNextState);

    // TODO Maybe his should take itself out from the piecesById if it died?

    return new Ok(piece.state);
  }

  updatePieceByCoord<P extends Partial<IdentifiablePieceState>>(
    coord: Coord,
    getNextState:
      | P
      | ((prev: IdentifiablePieceState) => Partial<IdentifiablePieceState>)
  ): Result<IdentifiablePieceState, void> {
    const piece = this.getPieceByCoord(coord);

    if (!piece) {
      return Err.EMPTY;
    }

    return this.updatePieceById(piece.state.id, getNextState);
  }

  updatePieceByIdWithCoords<P extends Partial<IdentifiablePieceState>>(
    pieceId: PieceId,
    coord: Coord,
    getNextState:
      | P
      | ((prev: IdentifiablePieceState) => Partial<IdentifiablePieceState>)
  ): Result<IdentifiablePieceState, void> {
    return this.updatePieceById(pieceId, getNextState).map((piece) => {
      // Update the coords as a side effect!
      this.piecesState.pieceById[piece.id].coord = coord;

      return piece;
    });
  }

  // This simply inserts another piece at the given coord
  // Good for promotion or Piece Upgrades/Changes throughout a game
  replacePieceById(
    pieceId: PieceId,
    nextRef: keyof PR,
    dynamicProps?: PieceDynamicProps
  ) {
    const coord = this.getPieceCoordById(pieceId);

    if (!coord) {
      return Err.EMPTY;
    }

    return this.replacePieceByCoord(coord, nextRef, dynamicProps);
  }

  // This simply inserts another piece at the given coord
  replacePieceByCoord(
    coord: Coord,
    nextRef: keyof PR,
    dynamicProps?: PieceDynamicProps
  ) {
    const piece = this.getPieceByCoord(coord);

    if (!piece) {
      return Err.EMPTY;
    }

    // The id gets created by the original Coord, but this is open to change!
    const nextId = toPieceId(nextRef, coord);

    const nextPiece = this.createPieceWithRef(nextRef, nextId, dynamicProps);

    const { [piece.state.id]: removed, ...piecesByIdWithoutReplacedId } =
      this.piecesState.pieceById;

    const nextPieceMeta: PieceMetaMappedById<PR>[PieceId] = {
      coord,
      ref: nextRef,
      piece: nextPiece,
    };

    this.piecesState = {
      pieceById: {
        // ...this.piecesState.pieceById,
        ...piecesByIdWithoutReplacedId,
        [nextId]: nextPieceMeta,
      },
      layoutMatrix: matrixInsert(
        this.piecesState.layoutMatrix,
        coordToMatrixIndex(coord),
        nextPiece.state.id
      ),
    };

    this.resetCache();

    // layoutMatrix: matrixInsert(accum.layoutMatrix, [row, col], next.id),
    //         pieceById: {
    //           ...accum.pieceById,
    //           [next.id]: {
    //             ref,
    //             piece,
    //             coord: { row, col },
    //           },
    //         },

    return new Ok(nextPiece);
  }

  // This is done so there are no external updates
  get state(): BoardState {
    if (this._cachedState) {
      return this._cachedState;
    }

    const next: BoardState = {
      terrainState: this.terrain.state,
      pieceLayoutState: matrixMap(this.piecesState.layoutMatrix, (p) =>
        p === undefined || p === 0
          ? 0
          : this.piecesState.pieceById[p]?.piece.state || 0
      ),
    };

    this._cachedState = next;

    return next;
  }

  applyMoves(
    moves: ShortMove[],
    conflictResolution?: (
      conflictingMoves: [ShortMove, ShortMove]
    ) => Result<
      [loserMove: MoveOutcome, winnerMove: MoveOutcome],
      'MovesNotPossible'
    >
  ): Result<Move[], 'MovesNotPossible'> {
    // TODO: Ensure the moves are valid!
    const affectedPieces = moves.map((m) =>
      this.getPieceById(
        matrixGet(this.piecesState.layoutMatrix, [m.from.row, m.from.col]) ||
          ('' as PieceId)
      )
    );

    const absentPiece = affectedPieces.find((p) => !p);

    if (absentPiece) {
      return new Err('MovesNotPossible');
    }

    const processedMoves = moves.reduce((prev, nextShortMove, i) => {
      const piece = affectedPieces[i];

      if (!piece) {
        return prev;
      }

      const nextSerializedDestCoord = serializeCoord(nextShortMove.to);

      const prevMoveAtSameCoord = prev[nextSerializedDestCoord];

      if (prevMoveAtSameCoord && conflictResolution) {
        return conflictResolution([prevMoveAtSameCoord.move, nextShortMove])
          .map(([looserMove, winnerMove]) => {
            // In case of same pieces battle (ex Pawn vs Pawn), they should both die so both moves get 'reject' flag
            if (
              winnerMove.piece.hitPoints === 0 &&
              looserMove.piece.hitPoints === 0
            ) {
              // we check move order so we don't mess the index
              if (movesAreEqual(winnerMove, nextShortMove)) {
                return {
                  ...prev,
                  [nextSerializedDestCoord]: {
                    ...prev[nextSerializedDestCoord],
                    move: {
                      ...prev[nextSerializedDestCoord].move,
                      piece: looserMove.piece,
                    },
                    flag: 'reject',
                  },
                  [`${nextSerializedDestCoord}-2`]: {
                    move: {
                      ...winnerMove,
                      piece: {
                        ...winnerMove.piece,
                        pieceHasMoved: true,
                      },
                    },
                    flag: 'reject',
                    index: i,
                  },
                };
              }

              return {
                ...prev,
                [nextSerializedDestCoord]: {
                  ...prev[nextSerializedDestCoord],
                  move: {
                    ...prev[nextSerializedDestCoord].move,
                    piece: {
                      ...winnerMove.piece,
                      pieceHasMoved: true,
                    },
                  },
                  flag: 'reject',
                },
                [`${nextSerializedDestCoord}-2`]: {
                  move: looserMove,
                  flag: 'reject',
                  index: i,
                },
              };
            }
            // If there is a battle result, meaning 1 piece will occupy the square at the end
            // Again check to see which order, preserve the index
            if (movesAreEqual(winnerMove, nextShortMove)) {
              return {
                ...prev,
                [nextSerializedDestCoord]: {
                  ...prev[nextSerializedDestCoord],
                  move: {
                    ...prev[nextSerializedDestCoord].move,
                    piece: looserMove.piece,
                  },
                  flag: 'reject',
                },
                [`${nextSerializedDestCoord}-2`]: {
                  move: {
                    ...winnerMove,
                    piece: {
                      ...winnerMove.piece,
                      pieceHasMoved: true,
                    },
                  },
                  flag: 'apply',
                  index: i,
                },
              };
            }

            return {
              ...prev,
              [nextSerializedDestCoord]: {
                ...prev[nextSerializedDestCoord],
                move: {
                  ...prev[nextSerializedDestCoord].move,
                  piece: {
                    ...winnerMove.piece,
                    pieceHasMoved: true,
                  },
                },
              },
              [`${nextSerializedDestCoord}-2`]: {
                move: looserMove,
                flag: 'reject',
                index: i,
              },
            };
          })
          .mapErr(() => prev).val;
      }

      return {
        ...prev,
        [nextSerializedDestCoord]: {
          move: {
            ...nextShortMove,
            piece: {
              ...piece.state,
              pieceHasMoved: true,
            },
          },
          flag: 'apply',
          index: i,
        },
      };
    }, {} as { [k: SerializedCoord]: { move: MoveOutcome; flag: 'apply' | 'reject'; index: number } });

    const orderedProcessedMoves = Object.values(processedMoves).sort(
      (a, b) => a.index - b.index
    );

    const boardChanges = orderedProcessedMoves.reduce((prev, next) => {
      if (next.flag === 'reject') {
        return [
          ...prev,
          {
            index: [next.move.from.row, next.move.from.col] as MatrixIndex,
            nextVal: 0 as const,
          },
        ];
      }
      const { move } = next;

      const castlingPieceFrom =
        move.castle && this.getPieceByCoord(move.castle.from);

      const castleMove =
        move.castle && castlingPieceFrom
          ? [
              {
                index: [
                  move.castle.from.row,
                  move.castle.from.col,
                ] as MatrixIndex,
                nextVal: 0 as const,
              },
              {
                index: [move.castle.to.row, move.castle.to.col] as MatrixIndex,
                nextVal: castlingPieceFrom.state.id,
              },
            ]
          : [];

      return [
        ...prev,
        {
          index: [move.to.row, move.to.col] as MatrixIndex,
          nextVal: move.promotion
            ? this.buildPromotedPiece(move.promotion, move.to).state.id
            : move.piece.id,
        },
        {
          index: [move.from.row, move.from.col] as MatrixIndex,
          nextVal: 0 as const,
        },
        ...castleMove,
      ];
    }, [] as { index: MatrixIndex; nextVal: IdentifiablePieceState['id'] | 0 }[]);

    // Update the layout matrix
    this.piecesState.layoutMatrix = matrixInsertMany(
      this.piecesState.layoutMatrix,
      boardChanges
    );

    // Remove the rejected pieces from the pieceLayout
    // But keep the ones taht cannot die and update them with the new state
    orderedProcessedMoves
      .filter((move) => move.flag === 'reject')
      .forEach((m) => {
        const piece = this.getPieceById(m.move.piece.id);

        // If the Piece cannot die, don't take it out (Kings mostly)
        if (piece && piece.canDie === false) {
          // But set the new state
          this.updatePieceById(piece.state.id, m.move.piece);

          return;
        }

        const { [m.move.piece.id]: removed, ...remainingPiecesById } =
          this.piecesState.pieceById;

        this.piecesState.pieceById = remainingPiecesById;
      });

    // Update the Remaining Pieces state
    orderedProcessedMoves
      .filter((move) => move.flag === 'apply')
      .map((m) => m.move)
      .forEach((move) => {
        this.updatePieceByIdWithCoords(move.piece.id, move.to, {
          hitPoints: move.piece.hitPoints,
          pieceHasMoved: true,
        });
      });

    this.resetCache();

    return new Ok(orderedProcessedMoves.map((m) => m.move));
  }

  private buildPromotedPiece(ref: string, coord: Coord) {
    const id = toPieceId(ref, coord);
    const piece = this.pieceRegistry[ref as keyof PieceRegistry](id);

    piece.state = piece.calculateNextState({ pieceHasMoved: true });

    this.piecesState.pieceById = {
      ...this.piecesState.pieceById,
      [id]: { ref, piece, coord },
    };
    return piece;
  }

  applyAttacks(
    attacks: ShortAttack[],
    gameState: GameState,
    withCleanup = false
  ): Result<AttackOutcome[], AttackNotPossibleError> {
    return (
      Result.all(
        checkAllArrayItemsExist(
          attacks.map((a) =>
            this.getPieceById(
              matrixGet(this.piecesState.layoutMatrix, [
                a.from.row,
                a.from.col,
              ]) || ('' as PieceId)
            )
          )
        ).mapErr(() => getAttackNotPossibleError('AttackerPieceNotExistent')),
        checkAllArrayItemsExist(
          attacks.map((a) =>
            this.getPieceById(
              matrixGet(this.piecesState.layoutMatrix, [a.to.row, a.to.col]) ||
                ('' as PieceId)
            )
          )
        ).mapErr(() => getAttackNotPossibleError('VictimPieceNotExistent'))
      )
        .map(([attackerPieces, victimPieces]) =>
          attacks.map((attack, i) => ({
            attack,
            attacker: attackerPieces[i],
            victim: victimPieces[i]!,
          }))
        )
        .andThen((attacksWithAtackerAndVictimPieces) =>
          attacksWithAtackerAndVictimPieces.reduce(
            (accumRes, next) =>
              accumRes.andThen((accum) => {
                if (!next.attacker) {
                  return new Err(
                    getAttackNotPossibleError('AttackerPieceNotExistent')
                  );
                }

                const { board: tempBoard } = accum;

                return next.attacker
                  .calculateAttackOutcome(next.attack, tempBoard, gameState)
                  .andThen((outcome) => {
                    const pieceAtDest = tempBoard.getPieceByCoord(
                      next.attack.to
                    );

                    if (!pieceAtDest) {
                      return new Err(
                        getAttackNotPossibleError('VictimPieceNotExistent')
                      );
                    }

                    // Apply the damage for the subsequent pieces to be calculated corrected
                    return tempBoard
                      .updatePieceById(pieceAtDest.state.id, (prev) => ({
                        hitPoints: prev.hitPoints - outcome.damage,
                      }))
                      .mapErr(() =>
                        getAttackNotPossibleError('VictimPieceNotExistent')
                      )
                      .map(() => ({
                        ...accum,
                        attacks: [
                          ...accum.attacks,
                          {
                            outcome,
                            zip: next,
                          },
                        ],
                      }));

                    // TODO: This isn't needed as the update alreaedy does it
                    // tempBoard.resetCache();

                    // return new Ok({
                    //   ...accum,
                    //   attacks: [
                    //     ...accum.attacks,
                    //     {
                    //       outcome,
                    //       zip: next,
                    //     },
                    //   ],
                    // });
                  });
              }),
            new Ok({ board: this.clone(), attacks: [] } as {
              board: IBoard;
              attacks: { outcome: AttackOutcome; zip: AttackZip }[];
            }) as Result<
              {
                board: IBoard;
                attacks: { outcome: AttackOutcome; zip: AttackZip }[];
              },
              AttackNotPossibleError
            >
          )
        )
        .map(({ attacks: outcomesAndZip }) =>
          outcomesAndZip.map(({ outcome, zip }) => ({
            ...zip,
            ...outcome,
          }))
        )
        // Cleanup Side Effects
        .map((outcomes) => {
          // TODO: This could be more functional or at least declerative!

          const directVictimStatesById: Record<
            PieceId,
            IdentifiablePieceState
          > = toDictIndexedBy(
            outcomes.map((o) => o.victim.state),
            (v) => v.id
          );

          const nextDirectlyAttackedVictimStatesById = outcomes.reduce(
            (accum, next) => {
              const prev = accum[next.victim.state.id] || next.victim.state;

              return {
                ...accum,
                [next.victim.state.id]: {
                  ...prev,
                  hitPoints: prev.hitPoints - next.damage,
                },
              };
            },
            directVictimStatesById
          );

          // Apply the Direct Attack Damage
          Object.values(nextDirectlyAttackedVictimStatesById).forEach(
            ({ id, ...nextVictimState }) =>
              this.updatePieceById(id, nextVictimState)
          );

          // Apply AOE Damage
          outcomes.forEach((o) => {
            o.special?.aoe?.map((coords) =>
              this.updatePieceByCoord(coords, (prev) => ({
                hitPoints: prev.hitPoints - 1, // TODO: This value should come from the Attack Special or somewhere
              })).map((p) => p.id)
            );
          });

          // Result.all(
          //   ...outcomes.reduce((accum, o) => {
          //     // Update the Victim Pieces State

          //     // Apply Direct Attack Damage
          //     // const updatedVictimsFromDirectAttack = this.updatePieceById(
          //     //   o.victim.state.id,
          //     //   (prev) => ({
          //     //     hitPoints: prev.hitPoints - o.damage,
          //     //   })
          //     // );
          //     // Object.values(nextVictimStatesById).map(() => {});

          //     // Apply AOE Damage
          //     const updatedVictimsFromAOEAttack = o.special?.aoe?.map(
          //       (coords) =>
          //         this.updatePieceByCoord(coords, (prev) => ({
          //           hitPoints: prev.hitPoints - 1, // TODO: This value should come from the Attack Special or somewhere
          //         })).map((p) => p.id)
          //     );

          //     return [
          //       ...accum,
          //       // updatedVictimsFromDirectAttack,

          //       ...(updatedVictimsFromAOEAttack || []),
          //     ];
          //   }, [] as Result<PieceId, any>[])
          // ).map((updatedVictimIds) => {
          // if (withCleanup) {
          // objectKeys(directVictimStatesById).forEach((updatedVictimId) => {
          //   const victim = this.getPieceById(updatedVictimId);

          //   if (victim && victim.state.hitPoints <= 0 && victim.canDie) {
          //     const { [victim.state.id]: removed, ...remainingPiecesById } =
          //       this.piecesState.pieceById;
          //     // this.piecesState.pieceById = remainingPiecesById;
          //   }
          // });
          // }

          // const updatedVictimIds = Object.keys(
          //   toDictIndexedBy(updatedVictims, (p) => p.id)
          // ) as IdentifiablePieceState['id'][];

          // Remove the dead pieces from the pieceById
          // objectKeys(directVictimStatesById).forEach((updatedVictimId) => {
          //   const victim = this.getPieceById(updatedVictimId);

          //   if (victim && victim.state.hitPoints <= 0 && victim.canDie) {
          //     const { [victim.state.id]: removed, ...remainingPiecesById } =
          //       this.piecesState.pieceById;
          //     this.piecesState.pieceById = remainingPiecesById;
          //   }
          // });
          // updatedVictims.map((s) => s[0].)
          // Remove the dead pieces from the pieceById
          // });

          // updatedVictims.forEach();

          // The cache must refreshed!
          this.resetCache();

          return outcomes;
        })
        .map((outcomes) =>
          outcomes.map(({ attack, damage, willTake, special }) => ({
            attack,
            damage,
            willTake,
            ...(special && {
              special,
            }),
          }))
        )
    );
  }

  // This function needs to alway stay up to date with the Board Props
  // TODO: Test
  clone(): Board<PR> {
    const clone: Pick<Board<PR>, 'pieceRegistry'> & {
      piecesState: PiecesState<PR>;
      terrain: Terrain;
    } = {
      pieceRegistry: this.pieceRegistry,
      piecesState: {
        // This doesn't need to be duplicated b/c it is immutable.
        // Any operation on the actual matrix happen via immutable
        //   util functions which always return a new one
        layoutMatrix: this.piecesState.layoutMatrix,
        pieceById: objectKeys(this.piecesState.pieceById).reduce(
          (accum, nextId) => {
            const pieceAndCoordToDuplicate = this.piecesState.pieceById[nextId];

            return {
              ...accum,
              [nextId]: {
                coord: pieceAndCoordToDuplicate.coord,
                piece: this.clonePieceById(
                  pieceAndCoordToDuplicate.piece.state.id
                ),
              },
            };
          },
          {} as PieceMetaMappedById<PR>
        ),
      },
      terrain: new Terrain({ load: true, state: this.terrain.state }),
    };
    Object.setPrototypeOf(clone, Board.prototype);

    return clone as unknown as Board<PR>;
  }

  createNewBoard() {
    return new Board({
      load: false,
      pieceRegistry: this.pieceRegistry,
      configurator: this.boardConfigurator,
    });
  }

  resetCache() {
    this._cachedState = undefined;
  }

  export() {
    return matrixMap(this.piecesState.layoutMatrix, (p) =>
      p === 0 ? p : this.toNotation(p)
    );
  }

  expensivelyCleanUpPiecesThatDied() {
    const alivePieceIds = matrixReduce(
      this.piecesState.layoutMatrix,
      (prev, next) => {
        if (next === 0) {
          return prev;
        }

        return { ...prev, [next]: null };
      },
      {} as Record<PieceId, null>
    );

    // objectKeys(remainingPieceIds).forEach(() => {
    //   this.piecesState.pieceById

    // });
    const deadPiecesId = objectKeys(this.piecesState.pieceById).reduce(
      (prev, nextId) => {
        if (nextId in alivePieceIds) {
          return prev;
        }

        return [...prev, nextId];
      },
      [] as PieceId[]
    );

    // console.log('before cleanup', Object.keys(this.piecesState.pieceById).length, deadPiecesId.length);

    deadPiecesId.forEach((deadPieceId) => {
      const { [deadPieceId]: removed, ...remaining } =
        this.piecesState.pieceById;

      this.piecesState.pieceById = remaining;
    });

    // console.log('after cleanup', Object.keys(this.piecesState.pieceById).length,  this.piecesState.pieceById);

    this.resetCache();
  }
}
