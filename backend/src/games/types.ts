export type GameType = 'tic-tac-toe' | 'connect-four' | 'checkers';

export interface GameMessage {
  type: 'move' | 'reset' | 'joinQueue' | 'init';
  gameType?: GameType;
  [key: string]: any;
}
