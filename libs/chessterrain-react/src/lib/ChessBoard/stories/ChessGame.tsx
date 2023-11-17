import React from 'react';
import type { Meta, StoryObj, StoryFn } from '@storybook/react';
import { GameConfigurator } from '../../Game/types';
import { Terrain } from '../../Terrain';
// import { chessBoardToPieceLayout } from '../util/chess';
import { dark } from '../../assets/pieces';

// import chess from 'chess';
import { Chess, Move, Piece, Square, SQUARES } from 'chess.js';
import { useCallbackIf } from '../../hooks/useCallbackIf';
import { useState } from 'react';
import { Color, ShortColor } from '../../commonTypes';
import { AbsoluteCoord, keyInObject } from '../../util-kit';
import {
  ChessBoardAsClass,
  ChessBoardAsClassProps,
} from '../ChessBoardAsClass';
import { toLongColor } from '../../util';
import { ChessTerrainProps } from '../../ChessTerrain';
import { ChessFEN, ChessMove, ChessPGN } from '../type';
import { chessBoardToPieceLayout, FENToChessBoard } from '../util';

export const shiftColor = (c: ShortColor) => (c === 'b' ? 'w' : 'b');

export const getNewChessGame = (pgn?: ChessPGN) => {
  const instance = new Chess();

  if (pgn) {
    instance.loadPgn(pgn);
  }

  return instance;
};

export type ChessGameProps = Pick<
  ChessBoardAsClassProps,
  'showAnnotations' | 'playingColor' | 'sizePx'
> & {
  // id: GameRecord['id'];
  // pgn: GameRecord['pgn'];
  // displayable?: {
  //   fen: ChessFEN;
  //   pgn: ChessPGN;
  //   history: ChessHistory;
  // };
  // // type: ChessBoardType;
  // // config?: ChessBoardConfig;
  // sizePx: number;
  // playingColor?: Color;
  pgn?: ChessPGN; // This contains the whole game state not just the current position
  playable?: boolean;
  orientation?: Color;
  canInteract?: boolean;

  // fen: ChessFen

  // This speeds up rendering as it doesn't wait for the
  //  move to be saved first
  autoCommitMove?: boolean;
  onMove: (p: { move: ChessMove }) => void;
  onPreMove?: (m: ChessMove) => void;

  promotionalMove?: ChessMove & { color: Color; isPreMove: boolean };
};

// export type ChessGameState = {
//   // pgn: string;
//   fen: ChessFEN;
//   history: Move[];

//   turn: Color;
//   // inCheck: boolean;
//   // isPreMovable: boolean;
//   // movable: ChessgroundProps['movable'];

//   // displayable: {
//   //   fen: ChessFEN;
//   //   lastMoveFromTo: [ChessMove['from'], ChessMove['to']] | undefined;
//   // };
// };

type State = {
  board: {
    fen: ChessFEN;
    turn: ShortColor;
  };
  // current: ChessBoardGameState;
  // uncommited?: ChessBoardGameState;
  // preMove?: ChessMove | undefined;
  // pendingPromotionalMove?: ChessGameProps['promotionalMove'];
};

type ChessHistory = Move[];

type CalcMovableProps = {
  playableColor?: Color;
  canInteract?: boolean;
  playable?: boolean;
  // config?: ChessBoardConfig;
  displayable?: {
    fen: ChessFEN;
    pgn: ChessPGN;
    history: ChessHistory;
  };
};

// I'm thinking this should be returned by the Chess library (both on the server and on client)
//  after an action like move (or any other), with a checksum type of identifier (probably fen)
//  to easily compare. It will be generated on the client upon move, saved and displayed right away
//  and when it eventually comes back from the server there's no more need to update because the
//  fens will be the same! This can't be done by reference, which then means it either needs to be
//  compared at the moment of receive on the client by checking the history, thus being expensive or,
//  just reupdated, which triggers another render (thus being again expensive)
//  There might be an even easier way to do it – based on some trust, that if a move was made then it
//  must be right, but I don't know yet if that suffices.
//
// I like the idea that if a gameUpdated is received, jsut checking one checksum (fen) aginst the client
//  will be enough to decide wether the update is really needed or not!
//
// TODO: scheduled for @deprecation for the above reasons
// export const getCurrentChessBoardGameState = (
//   props: CalcMovableProps,
//   chess: Chess,
//   prev: ChessBoardGameState | undefined
// ): ChessBoardGameState => {
//   const pgn = chess.pgn();

//   // Offer a way to exit asap if nothing changed
//   if (pgn === prev?.pgn && props.displayable?.fen === prev.displayable?.fen) {
//     return prev;
//   }

//   const history = chess.history({ verbose: true });
//   const fen = chess.fen();

//   return {
//     pgn,
//     fen,
//     history,
//     displayable: getDisplayableState(
//       {
//         history,
//         fen,
//       },
//       props.displayable
//     ),
//     turn: toLongColor(chess.turn()),
//     inCheck: chess.inCheck(),
//     isPreMovable:
//       history.length === 0
//         ? true
//         : history[history.length - 1].color !== chess.turn(),

//     // TODO: add this back
//     // movable: calcMovable(props, toDests(chess)),
//   };
// };

// const getDisplayableState = (
//   current: {
//     history: Move[];
//     fen: string;
//   },
//   displayable?: CalcMovableProps['displayable']
// ): ChessBoardGameState['displayable'] => {
//   // If there are no displayable or they are exactly the same then just show the current
//   if (!displayable || current.fen === displayable.fen) {
//     const lastMove = current.history[current.history.length - 1] as ChessMove;

//     return {
//       fen: current.fen,
//       lastMoveFromTo: lastMove ? [lastMove.from, lastMove.to] : undefined,
//     };
//   }

//   const displayableLastMove = displayable.history[
//     displayable.history.length - 1
//   ] as ChessMove;

//   return {
//     fen: displayable.fen,
//     lastMoveFromTo: displayableLastMove
//       ? [displayableLastMove.from, displayableLastMove.to]
//       : undefined,
//   };
// };

// const bPromotableSquares =

// export const isPromotableMove = (piece: Piece, { to }: ChessMove) => {
//   if (piece.type !== 'p') {
//     return false;
//   }

//   return (
//     (piece.color === 'b' &&
//       keyInObject(
//         {
//           a1: true,
//           b1: true,
//           c1: true,
//           d1: true,
//           e1: true,
//           f1: true,
//           g1: true,
//           h1: true,
//         },
//         to
//       )) ||
//     (piece.color === 'w' &&
//       keyInObject(
//         {
//           a8: true,
//           b8: true,
//           c8: true,
//           d8: true,
//           e8: true,
//           f8: true,
//           g8: true,
//           h8: true,
//         },
//         to
//       ))
//   );
// };

// export type ChessDests = Map<Square, Square[]>;

// export function toDests(chess: Chess): ChessDests {
//   const dests = new Map();
//   SQUARES.forEach((s) => {
//     const ms = chess.moves({ square: s, verbose: true });
//     if (ms.length)
//       dests.set(
//         s,
//         ms.map((m) => m.to)
//       );
//   });
//   return dests;
// }

const calcBoardState = (chess: Chess): State['board'] => {
  return {
    fen: chess.fen(),
    turn: chess.turn(),
  };
};

export class ChessGame extends React.PureComponent<ChessGameProps, State> {
  private chess = getNewChessGame();

  constructor(props: ChessGameProps) {
    super(props);

    if (this.props.pgn) {
      this.chess.loadPgn(this.props.pgn);
    }

    this.state = {
      board: calcBoardState(this.chess),
    };

    console.log('constructor', props, this.props);

    // this.onMove = this.onMove.bind(this);
    // this.onPreMove = this.onPreMove.bind(this);
    // this.onPreMoveCanceled = this.onPreMoveCanceled.bind(this);
  }

  // Keeps the Component State and the Chess Instance in sync
  private commit() {
    if (!this.props.pgn) {
      this.chess.reset();

      // const nextChessState = getCurrentChessBoardGameState(
      //   this.props,
      //   this.chess,
      //   this.state.current
      // );

      this.setState({
        board: calcBoardState(this.chess),
        // current: nextChessState,
        // uncommited: undefined,
      });
    } else {
      // This will throw if not working correctly! so will need to catch and solve that issue :)
      this.chess.loadPgn(this.props.pgn);

      // const nextChessState = getCurrentChessBoardGameState(
      //   this.props,
      //   this.chess,
      //   this.state.current
      // );

      // this.setState({
      //   current: nextChessState,
      //   uncommited: undefined,
      // });

      this.setState({
        board: calcBoardState(this.chess),
        // current: nextChessState,
        // uncommited: undefined,
      });
    }
  }

  componentDidUpdate(prevProps: ChessGameProps) {
    // const chessState = getCurrentChessBoardGameState(
    //   this.props,
    //   this.chess,
    //   this.state.current
    // );
    // const { playingColor } = this.props;
    // if (this.state.preMove && chessState.turn === playingColor) {
    //   this.applyPreMove(this.state.preMove);
    // }
    // // If there are changes in the pgn, uncommited moves or displayable commit them now!
    // if (
    //   (prevProps.pgn !== this.props.pgn &&
    //     this.state.current.pgn !== this.state.uncommited?.pgn) ||
    //   prevProps.displayable?.fen !== this.props.displayable?.fen
    // ) {
    //   // Make sure the PromotionalMode is getting reset when the PGN changes
    //   this.setState({ pendingPromotionalMove: undefined });
    //   // Commit the changes
    //   this.commit();
    // }
  }

  // private applyPreMove(preMove: ChessMove) {
  //   this.onMove({ move: preMove });

  //   this.setState({ preMove: undefined });
  // }

  // private onPreMove(nextPreMove: ChessMove) {
  //   if (!this.props.canInteract) {
  //     return;
  //   }

  //   const movedPiece = this.chess.get(nextPreMove.from);

  //   if (movedPiece && this.isPromotable(nextPreMove)) {
  //     // If the premove is a promotional move:
  //     //  - show the Promotional Dialog inside the ChessBoard
  //     //  - and wait for the player to select the Piece to promote before applying it
  //     this.setState({
  //       pendingPromotionalMove: {
  //         ...nextPreMove,
  //         color: toLongColor(movedPiece.color),
  //         isPreMove: true,
  //       },
  //     });

  //     return;
  //   }

  //   this.setState({
  //     preMove: nextPreMove,
  //     pendingPromotionalMove: undefined,
  //   });
  // }

  // private onPreMoveCanceled() {
  //   this.setState({ preMove: undefined });
  // }

  // private isPromotable(m: ChessMove) {
  //   const movedPiece = this.chess.get(m.from);

  //   // return !m.promotion && movedPiece && isPromotableMove(movedPiece, m);
  //   // TODO: Took this out for now
  //   return false;
  // }

  private onMove = (next: { move: ChessMove }) => {
    console.log('on move', next.move, this.props);

    if (!this.props.canInteract) {
      return;
    }

    console.log('can interact');

    // this.setState({
    //   pendingPromotionalMove: undefined,
    // });

    // If the move is a promotional move:
    //  - save a temporary chess state
    //  - show the Promotional Dialog inside the ChessBoard
    //  - and wait for the player to select the Piece to promote
    // if (this.isPromotable(next.move)) {
    //   const uncommitableChess = getNewChessGame(this.state.current.pgn);

    //   const valid = uncommitableChess.move({
    //     ...next.move,
    //     promotion: 'q',
    //   });

    //   if (!valid) {
    //     return;
    //   }

    //   this.setState({
    //     pendingPromotionalMove: {
    //       ...next.move,
    //       color: toLongColor(shiftColor(uncommitableChess.turn())),
    //       isPreMove: false,
    //     },
    //     uncommited: {
    //       ...getCurrentChessBoardGameState(
    //         this.props,
    //         uncommitableChess,
    //         this.state.uncommited
    //       ),
    //       // This is needed since, as a workaround not to revert the promoting move until
    //       //  the player makes a selection, the temporarily promoted piece is a Queen,
    //       //  and sometimes it can give a check - which of course is incorrect therefore
    //       //  it must not show
    //       inCheck: false,
    //     },
    //   });

    //   return;
    // }
    
    try {
      this.chess.move(next.move);

      this.setState({
        board: calcBoardState(this.chess),
        // current: nextChessState,
        // uncommited: undefined,
      }, () => {
        console.log('new staet after move', this.state)
      });
      
      console.log('yes is valid');
    } catch (e) {
      console.warn('Cannot move', e, next.move);
    }



    

    // const { displayable, ...propsWithoutDisplayable } = this.props;

    // const uncommitedChessState = getCurrentChessBoardGameState(
    //   // Here I took the displayable out so it doesn't interfere with creating the new
    //   //  lastMove from scratch!
    //   propsWithoutDisplayable,
    //   this.chess,
    //   this.state.current
    // );

    // const nextHistoryMove =
    //   uncommitedChessState.history[uncommitedChessState.history.length - 1];

    // this.setState({ uncommited: uncommitedChessState });

    // this.props.onMove({
    //   move: {
    //     ...(nextHistoryMove as ChessMove),
    //     // color: toChessColor(nextHistoryMove.color),
    //     // san: nextHistoryMove.san,
    //   },
    //   // fen: uncommitedChessState.fen,
    //   // pgn: uncommitedChessState.pgn,
    // });
  }

  render() {
    const {
      // id,
      playable,
      orientation,
      playingColor,
      canInteract = false,
      onMove,
      // viewOnly,
      ...boardProps
    } = this.props;

    // TODO: Move this from here in the state so it doesn't get calculated on each render
    // const chessState = chessBoardToPieceLayout(
    //   FENToChessBoard(this.state.uncommited?.fen || this.state.current.fen)
    // );

    const chessState = chessBoardToPieceLayout(
      FENToChessBoard(this.state.board.fen)
    );

    console.log('chessState', chessState);

    return (
      <ChessBoardAsClass
        // Reset the Board anytime the game changes
        // key={id}
        playingColor={this.props.playingColor || 'white'}
        onMove={this.onMove}
        pieceLayoutState={chessState}
        {...boardProps}
        // disableContextMenu
        // preMoveEnabled={
        //   this.props.canInteract && this.state.current.isPreMovable
        // }
        // viewOnly={viewOnly}
        // fen={chessState.displayable.fen}
        // lastMove={chessState.displayable.lastMoveFromTo}
        // turnColor={chessState.turn}
        // check={chessState.inCheck}
        // resizable
        // movable={chessState.movable}
        // orientation={orientation || playableColor}
        // onPreMoveCanceled={this.onPreMoveCanceled}
        // onPreMove={this.onPreMove}
        // onMove={this.onMove}
        // promotionalMove={this.state.pendingPromotionalMove}
      />
    );
  }
}
