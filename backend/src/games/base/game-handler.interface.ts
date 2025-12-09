import type { WebSocket as WS } from 'ws';
import type { GameType } from '../types.js';

export interface Player {
  id: string;
  ws: WS;
  symbol: string | null;
  [key: string]: any; // Allow game-specific player properties
}

export interface GameState {
  board?: any;
  currentPlayer?: string;
  winner?: string | null;
  isDraw?: boolean;
  players: Array<{ id: string; symbol: string | null; [key: string]: any }>;
  queue: string[];
  [key: string]: any; // Allow game-specific state properties
}

export interface AddPlayerResult {
  success: boolean;
  error?: string;
  gameState?: GameState;
  [key: string]: any; // Allow game-specific return properties
}

export interface GameHandler {
  // Handle incoming messages
  handleMessage(
    roomId: string,
    playerId: string,
    message: any,
    ws: WS
  ): void;
  
  // Add player to game
  addPlayer(
    roomId: string,
    playerId: string,
    ws: WS
  ): AddPlayerResult;
  
  // Remove player
  removePlayer(roomId: string, playerId: string): void;
  
  // Get current game state for a player
  getGameState(roomId: string, playerId: string): GameState | null;
  
  // Get game type
  getGameType(): string;
}
