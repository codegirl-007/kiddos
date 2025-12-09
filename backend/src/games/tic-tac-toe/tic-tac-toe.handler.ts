import type { WebSocket as WS } from 'ws';
import type { GameHandler, Player, GameState, AddPlayerResult } from '../base/game-handler.interface.js';

type TicTacToePlayer = Player & {
  symbol: 'X' | 'O' | null;
};

type TicTacToeGameState = GameState & {
  board: (string | null)[];
  currentPlayer: 'X' | 'O';
  winner: string | null;
  isDraw: boolean;
};

const games = new Map<string, TicTacToeGameState>();

function createGame(roomId: string): TicTacToeGameState {
  const game: TicTacToeGameState = {
    board: Array(9).fill(null),
    currentPlayer: 'X',
    winner: null,
    isDraw: false,
    players: [],
    queue: [],
  };
  games.set(roomId, game);
  return game;
}

function getGame(roomId: string): TicTacToeGameState | undefined {
  return games.get(roomId);
}

function checkWinner(board: (string | null)[]): string | null {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6], // diagonals
  ];

  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

function checkDraw(board: (string | null)[]): boolean {
  return board.every(cell => cell !== null) && !checkWinner(board);
}

function broadcastState(roomId: string, excludePlayerId?: string): void {
  const game = games.get(roomId);
  if (!game) return;

  game.players.forEach(player => {
    if (player.id !== excludePlayerId && player.ws.readyState === 1) {
      player.ws.send(JSON.stringify({
        type: 'gameState',
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

export class TicTacToeHandler implements GameHandler {
  getGameType(): string {
    return 'tic-tac-toe';
  }

  addPlayer(roomId: string, playerId: string, ws: WS): AddPlayerResult {
    let game = getGame(roomId);
    if (!game) {
      game = createGame(roomId);
    }

    // Check if player already in game
    if (game.players.find(p => p.id === playerId)) {
      return { success: false, error: 'Player already in game' };
    }

    // If 2 players already playing, add to queue
    const activePlayers = game.players.filter(p => p.symbol !== null);
    if (activePlayers.length >= 2) {
      game.queue.push(playerId);
      const player: TicTacToePlayer = { id: playerId, ws, symbol: null };
      game.players.push(player);
      
      // Broadcast to other players
      this.broadcastPlayerJoined(roomId, playerId, null);
      
      return { success: true, gameState: this.getGameState(roomId, playerId)! };
    }

    // Assign symbol (X or O)
    const symbol = activePlayers.length === 0 ? 'X' : 'O';
    const player: TicTacToePlayer = { id: playerId, ws, symbol };
    game.players.push(player);

    // Broadcast to other players
    this.broadcastPlayerJoined(roomId, playerId, symbol);

    return { success: true, gameState: this.getGameState(roomId, playerId)! };
  }

  private broadcastPlayerJoined(roomId: string, newPlayerId: string, symbol: 'X' | 'O' | null): void {
    const game = getGame(roomId);
    if (!game) return;

    game.players.forEach(player => {
      if (player.id !== newPlayerId && player.ws.readyState === 1) {
        const gameState = this.getGameState(roomId, player.id);
        if (gameState) {
          player.ws.send(JSON.stringify({
            type: 'playerJoined',
            playerId: newPlayerId,
            symbol,
            game: gameState,
          }));
        }
      }
    });
  }

  removePlayer(roomId: string, playerId: string): void {
    const game = getGame(roomId);
    if (!game) return;

    const playerIndex = game.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return;

    const player = game.players[playerIndex];
    const wasActive = player.symbol !== null;

    // Remove from players
    game.players.splice(playerIndex, 1);

    // Remove from queue if there
    const queueIndex = game.queue.indexOf(playerId);
    if (queueIndex !== -1) {
      game.queue.splice(queueIndex, 1);
    }

    // If an active player left, promote next in queue
    if (wasActive && game.queue.length > 0) {
      const nextPlayerId = game.queue.shift()!;
      const nextPlayer = game.players.find(p => p.id === nextPlayerId);
      if (nextPlayer) {
        nextPlayer.symbol = player.symbol as 'X' | 'O' | null;
      }
    }

    // If no players left, delete game
    if (game.players.length === 0) {
      games.delete(roomId);
    } else if (game.players.filter(p => p.symbol !== null).length < 2 && !game.winner && !game.isDraw) {
      // Reset game if not enough players
      game.board = Array(9).fill(null);
      game.currentPlayer = 'X';
      game.winner = null;
      game.isDraw = false;
    }

    // Broadcast player left
    this.broadcastPlayerLeft(roomId, playerId);
  }

  private broadcastPlayerLeft(roomId: string, leftPlayerId: string): void {
    const game = getGame(roomId);
    if (!game) return;

    game.players.forEach(player => {
      if (player.ws.readyState === 1) {
        const gameState = this.getGameState(roomId, player.id);
        if (gameState) {
          player.ws.send(JSON.stringify({
            type: 'playerLeft',
            playerId: leftPlayerId,
            game: gameState,
          }));
        }
      }
    });
  }

  getGameState(roomId: string, playerId: string): GameState | null {
    const game = getGame(roomId);
    if (!game) return null;

    const player = game.players.find(p => p.id === playerId);
    return {
      board: game.board,
      currentPlayer: game.currentPlayer,
      winner: game.winner,
      isDraw: game.isDraw,
      yourSymbol: player?.symbol || null,
      players: game.players.map(p => ({ id: p.id, symbol: p.symbol })),
      queue: game.queue,
    };
  }

  handleMessage(roomId: string, playerId: string, message: any, ws: WS): void {
    switch (message.type) {
      case 'move':
        this.handleMove(roomId, playerId, message.position);
        break;
      case 'reset':
        this.handleReset(roomId, playerId);
        break;
      case 'joinQueue':
        this.handleJoinQueue(roomId, playerId);
        break;
      default:
        ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
    }
  }

  private handleMove(roomId: string, playerId: string, position: number): void {
    const game = getGame(roomId);
    if (!game) return;

    const player = game.players.find(p => p.id === playerId);
    if (!player || !player.symbol) {
      const ws = player?.ws;
      if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({ type: 'error', message: 'Player not in game' }));
      }
      return;
    }

    if (game.winner || game.isDraw) {
      const ws = player.ws;
      if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({ type: 'error', message: 'Game is over' }));
      }
      return;
    }

    if (game.currentPlayer !== player.symbol) {
      const ws = player.ws;
      if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({ type: 'error', message: 'Not your turn' }));
      }
      return;
    }

    if (game.board[position] !== null) {
      const ws = player.ws;
      if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({ type: 'error', message: 'Position already taken' }));
      }
      return;
    }

    game.board[position] = player.symbol;
    
    const winner = checkWinner(game.board);
    const isDraw = checkDraw(game.board);

    if (winner) {
      game.winner = winner;
    } else if (isDraw) {
      game.isDraw = true;
    } else {
      game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';
    }

    // Broadcast current state
    this.broadcastGameState(roomId);

    // Auto-start next game if there's a winner and queue
    if (winner && game.queue.length > 0) {
      setTimeout(() => {
        const currentGame = getGame(roomId);
        if (!currentGame) return;
        
        const loser = currentGame.players.find(p => p.symbol !== winner && p.symbol !== null);
        if (loser) {
          loser.symbol = null;
          currentGame.queue.push(loser.id);
          
          const nextPlayerId = currentGame.queue.shift();
          if (nextPlayerId) {
            const nextPlayer = currentGame.players.find(p => p.id === nextPlayerId);
            if (nextPlayer) {
              currentGame.board = Array(9).fill(null);
              currentGame.currentPlayer = 'X';
              currentGame.winner = null;
              currentGame.isDraw = false;
              nextPlayer.symbol = winner === 'X' ? 'O' : 'X';
              
              this.broadcastGameState(roomId);
            }
          }
        }
      }, 100);
    }
    // Auto-rematch on draw
    else if (isDraw) {
      setTimeout(() => {
        const currentGame = getGame(roomId);
        if (!currentGame) return;
        
        currentGame.board = Array(9).fill(null);
        currentGame.currentPlayer = 'X';
        currentGame.winner = null;
        currentGame.isDraw = false;
        
        this.broadcastGameState(roomId);
      }, 1500);
    }
  }

  private handleReset(roomId: string, resettingPlayerId: string): void {
    const game = getGame(roomId);
    if (!game) return;

    const activePlayers = game.players.filter(p => p.symbol !== null);
    const previousWinner = game.winner;
    const wasDraw = game.isDraw;
    const previousLoser = previousWinner ? activePlayers.find(p => p.symbol !== previousWinner && p.symbol !== null) : null;
    const hasQueue = game.queue.length > 0;

    game.board = Array(9).fill(null);
    game.currentPlayer = 'X';
    game.winner = null;
    game.isDraw = false;

    if (previousWinner && hasQueue && previousLoser) {
      previousLoser.symbol = null;
      game.queue.push(previousLoser.id);

      const nextPlayerId = game.queue.shift();
      if (nextPlayerId) {
        const nextPlayer = game.players.find(p => p.id === nextPlayerId);
        if (nextPlayer) {
          nextPlayer.symbol = previousWinner === 'X' ? 'O' : 'X';
        }
      }
    } else if (wasDraw && activePlayers.length === 2) {
      // Rematch - players keep their symbols
    } else if (activePlayers.length > 2) {
      activePlayers.forEach(p => {
        p.symbol = null;
        game.queue.push(p.id);
      });

      const newPlayer1 = game.queue.shift();
      const newPlayer2 = game.queue.shift();
      
      if (newPlayer1) {
        const p1 = game.players.find(p => p.id === newPlayer1);
        if (p1) p1.symbol = 'X';
      }
      if (newPlayer2) {
        const p2 = game.players.find(p => p.id === newPlayer2);
        if (p2) p2.symbol = 'O';
      }
    }

    this.broadcastGameState(roomId);
  }

  private handleJoinQueue(roomId: string, playerId: string): void {
    const game = getGame(roomId);
    if (!game) return;

    const player = game.players.find(p => p.id === playerId);
    if (!player) return;

    if (game.queue.includes(playerId)) {
      return;
    }

    if (player.symbol !== null) {
      const ws = player.ws;
      if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({ type: 'error', message: 'Cannot join queue while playing' }));
      }
      return;
    }

    game.queue.push(playerId);
    this.broadcastGameState(roomId);
  }

  private broadcastGameState(roomId: string): void {
    const game = getGame(roomId);
    if (!game) return;

    game.players.forEach(player => {
      if (player.ws.readyState === 1) {
        player.ws.send(JSON.stringify({
          type: 'gameState',
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
}
