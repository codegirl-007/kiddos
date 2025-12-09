import { WebSocketServer, WebSocket as WS } from 'ws';
import { createServer } from 'http';
import { gameManager } from '../games/game-manager.js';
import { TicTacToeHandler } from '../games/tic-tac-toe/tic-tac-toe.handler.js';
import type { GameType } from '../games/types.js';

let wss: WebSocketServer | null = null;

// Register game handlers
gameManager.register('tic-tac-toe', new TicTacToeHandler());

export function createWebSocketServer(server: any) {
  wss = new WebSocketServer({ server, path: '/api/ws' });

  wss.on('connection', (ws: WS, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const gameType = (url.searchParams.get('gameType') || 'tic-tac-toe') as GameType;
    const roomId = url.searchParams.get('room') || 'default';
    const playerId = url.searchParams.get('playerId') || `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log(`[WebSocket] Player ${playerId} connected to room ${roomId} (game: ${gameType})`);

    // Get game handler
    let gameHandler;
    try {
      gameHandler = gameManager.getHandler(gameType);
    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', message: `Unknown game type: ${gameType}` }));
      ws.close();
      return;
    }

    // Add player to game
    const result = gameHandler.addPlayer(roomId, playerId, ws);
    
    if (!result.success) {
      ws.send(JSON.stringify({ type: 'error', message: result.error }));
      ws.close();
      return;
    }

    // Send initial game state
    if (result.gameState) {
      ws.send(JSON.stringify({
        type: 'gameState',
        game: result.gameState,
      }));
    }

    // Handler will broadcast player joined internally

    // Handle messages
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Route message to game handler
        gameHandler.handleMessage(roomId, playerId, message, ws);
      } catch (error) {
        console.error('[WebSocket] Error handling message:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    // Handle disconnect
    ws.on('close', () => {
      console.log(`[WebSocket] Player ${playerId} disconnected from room ${roomId}`);
      gameHandler.removePlayer(roomId, playerId);
      // Handler will broadcast player left internally
    });

    ws.on('error', (error) => {
      console.error(`[WebSocket] Error for player ${playerId}:`, error);
    });
  });

  console.log('✅ WebSocket server started on /api/ws');
}

export function getWebSocketServer(): WebSocketServer | null {
  return wss;
}
