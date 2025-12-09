import { WebSocketServer, WebSocket as WS } from 'ws';
import { createServer } from 'http';
import { getGame, addPlayer, removePlayer, makeMove, resetGame, joinQueue, broadcastToRoom } from './game.service.js';

let wss: WebSocketServer | null = null;

export function createWebSocketServer(server: any) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WS, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const roomId = url.searchParams.get('room') || 'default';
    const playerId = url.searchParams.get('playerId') || `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log(`[WebSocket] Player ${playerId} connected to room ${roomId}`);

    // Add player to game
    const result = addPlayer(roomId, playerId, ws);
    
    if (!result.success) {
      ws.send(JSON.stringify({ type: 'error', message: result.error }));
      ws.close();
      return;
    }

    // Send initial game state
    const initialGame = getGame(roomId);
    if (initialGame) {
      ws.send(JSON.stringify({
        type: 'gameState',
        game: {
          board: initialGame.board,
          currentPlayer: initialGame.currentPlayer,
          winner: initialGame.winner,
          isDraw: initialGame.isDraw,
          yourSymbol: result.symbol,
          players: initialGame.players.map(p => ({ id: p.id, symbol: p.symbol })),
          queue: initialGame.queue,
        },
      }));
    }

    // Broadcast player joined to other players
    const joinGame = getGame(roomId);
    if (joinGame) {
      joinGame.players.forEach(player => {
        if (player.id !== playerId && player.ws.readyState === 1) {
          player.ws.send(JSON.stringify({
            type: 'playerJoined',
            playerId,
            symbol: result.symbol,
            game: {
              board: joinGame.board,
              currentPlayer: joinGame.currentPlayer,
              winner: joinGame.winner,
              isDraw: joinGame.isDraw,
              yourSymbol: player.symbol,
              players: joinGame.players.map(p => ({ id: p.id, symbol: p.symbol })),
              queue: joinGame.queue,
            },
          }));
        }
      });
    }

    // Handle messages
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'move':
            if (typeof message.position !== 'number' || message.position < 0 || message.position > 8) {
              ws.send(JSON.stringify({ type: 'error', message: 'Invalid position' }));
              return;
            }

            const moveResult = makeMove(roomId, playerId, message.position);
            if (!moveResult.success) {
              ws.send(JSON.stringify({ type: 'error', message: moveResult.error }));
              return;
            }

            const updatedGame = getGame(roomId);
            if (updatedGame) {
              // Broadcast current game state (with winner if game ended)
              updatedGame.players.forEach(player => {
                if (player.ws.readyState === 1) { // WebSocket.OPEN
                  player.ws.send(JSON.stringify({
                    type: 'gameState',
                    game: {
                      board: updatedGame.board,
                      currentPlayer: updatedGame.currentPlayer,
                      winner: updatedGame.winner,
                      isDraw: updatedGame.isDraw,
                      yourSymbol: player.symbol,
                      players: updatedGame.players.map(p => ({ id: p.id, symbol: p.symbol })),
                      queue: updatedGame.queue,
                    },
                  }));
                }
              });

              // Auto-start next game if there's a winner and queue
              if (moveResult.autoStartNext && updatedGame.winner && updatedGame.queue.length > 0) {
                const winner = updatedGame.winner;
                const loser = updatedGame.players.find(p => p.symbol !== winner && p.symbol !== null);
                
                if (loser) {
                  // Move loser to end of queue
                  loser.symbol = null;
                  updatedGame.queue.push(loser.id);
                  
                  // Promote next player from queue
                  const nextPlayerId = updatedGame.queue.shift();
                  if (nextPlayerId) {
                    const nextPlayer = updatedGame.players.find(p => p.id === nextPlayerId);
                    if (nextPlayer) {
                      // Reset board and assign opposite symbol to new player
                      updatedGame.board = Array(9).fill(null);
                      updatedGame.currentPlayer = 'X';
                      updatedGame.winner = null;
                      updatedGame.isDraw = false;
                      nextPlayer.symbol = winner === 'X' ? 'O' : 'X';
                      // Winner keeps their symbol, so no change needed
                      
                      // Broadcast new game state immediately
                      updatedGame.players.forEach(player => {
                        if (player.ws.readyState === 1) {
                          player.ws.send(JSON.stringify({
                            type: 'gameState',
                            game: {
                              board: updatedGame.board,
                              currentPlayer: updatedGame.currentPlayer,
                              winner: updatedGame.winner,
                              isDraw: updatedGame.isDraw,
                              yourSymbol: player.symbol,
                              players: updatedGame.players.map(p => ({ id: p.id, symbol: p.symbol })),
                              queue: updatedGame.queue,
                            },
                          }));
                        }
                      });
                    }
                  }
                }
              }
            }
            break;

          case 'reset':
            resetGame(roomId, playerId);
            const resetGameState = getGame(roomId);
            if (resetGameState) {
              // Broadcast to all players with their individual symbols
              resetGameState.players.forEach(player => {
                if (player.ws.readyState === 1) { // WebSocket.OPEN
                  player.ws.send(JSON.stringify({
                    type: 'gameState',
                    game: {
                      board: resetGameState.board,
                      currentPlayer: resetGameState.currentPlayer,
                      winner: resetGameState.winner,
                      isDraw: resetGameState.isDraw,
                      yourSymbol: player.symbol,
                      players: resetGameState.players.map(p => ({ id: p.id, symbol: p.symbol })),
                      queue: resetGameState.queue,
                    },
                  }));
                }
              });
            }
            break;

          case 'joinQueue':
            const joinResult = joinQueue(roomId, playerId);
            if (!joinResult.success) {
              ws.send(JSON.stringify({ type: 'error', message: joinResult.error }));
              return;
            }
            const queueGameState = getGame(roomId);
            if (queueGameState) {
              // Broadcast updated game state to all players
              queueGameState.players.forEach(player => {
                if (player.ws.readyState === 1) { // WebSocket.OPEN
                  player.ws.send(JSON.stringify({
                    type: 'gameState',
                    game: {
                      board: queueGameState.board,
                      currentPlayer: queueGameState.currentPlayer,
                      winner: queueGameState.winner,
                      isDraw: queueGameState.isDraw,
                      yourSymbol: player.symbol,
                      players: queueGameState.players.map(p => ({ id: p.id, symbol: p.symbol })),
                      queue: queueGameState.queue,
                    },
                  }));
                }
              });
            }
            break;

          default:
            ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
        }
      } catch (error) {
        console.error('[WebSocket] Error handling message:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    // Handle disconnect
    ws.on('close', () => {
      console.log(`[WebSocket] Player ${playerId} disconnected from room ${roomId}`);
      removePlayer(roomId, playerId);
      
      const game = getGame(roomId);
      if (game) {
        // Broadcast to all remaining players with their individual symbols
        game.players.forEach(player => {
          if (player.ws.readyState === 1) { // WebSocket.OPEN
            player.ws.send(JSON.stringify({
              type: 'playerLeft',
              playerId,
              game: {
                board: game.board,
                currentPlayer: game.currentPlayer,
                winner: game.winner,
                isDraw: game.isDraw,
                yourSymbol: player.symbol,
                players: game.players.map(p => ({ id: p.id, symbol: p.symbol })),
                queue: game.queue,
              },
            }));
          }
        });
      }
    });

    ws.on('error', (error) => {
      console.error(`[WebSocket] Error for player ${playerId}:`, error);
    });
  });

  console.log('✅ WebSocket server started on /ws');
}

export function getWebSocketServer(): WebSocketServer | null {
  return wss;
}
