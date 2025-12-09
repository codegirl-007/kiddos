import type { WebSocket as WS } from 'ws';

type Player = {
  id: string;
  ws: WS;
  symbol: 'X' | 'O' | null;
};

type GameState = {
  board: (string | null)[];
  currentPlayer: 'X' | 'O';
  winner: string | null;
  isDraw: boolean;
  players: Player[];
  queue: string[]; // Player IDs waiting to play
};

const games = new Map<string, GameState>();

function createGame(roomId: string): GameState {
  const game: GameState = {
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

function getGame(roomId: string): GameState | undefined {
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

function makeMove(roomId: string, playerId: string, position: number): { success: boolean; error?: string; autoStartNext?: boolean } {
  const game = games.get(roomId);
  if (!game) {
    return { success: false, error: 'Game not found' };
  }

  const player = game.players.find(p => p.id === playerId);
  if (!player || !player.symbol) {
    return { success: false, error: 'Player not in game' };
  }

  if (game.winner || game.isDraw) {
    return { success: false, error: 'Game is over' };
  }

  if (game.currentPlayer !== player.symbol) {
    return { success: false, error: 'Not your turn' };
  }

  if (game.board[position] !== null) {
    return { success: false, error: 'Position already taken' };
  }

  game.board[position] = player.symbol;
  
  const winner = checkWinner(game.board);
  const isDraw = checkDraw(game.board);

  if (winner) {
    game.winner = winner;
    // Auto-start next game if there's a queue
    // Note: We set winner first, then the websocket handler will broadcast
    // After broadcast, if there's a queue, we'll auto-start the next game
  } else if (isDraw) {
    game.isDraw = true;
  } else {
    game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';
  }

  return { success: true, autoStartNext: winner !== null && game.queue.length > 0 };
}

function addPlayer(roomId: string, playerId: string, ws: WS): { success: boolean; error?: string; symbol?: 'X' | 'O' | null } {
  let game = games.get(roomId);
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
    const player: Player = { id: playerId, ws, symbol: null };
    game.players.push(player);
    return { success: true, symbol: null };
  }

  // Assign symbol (X or O)
  const symbol = activePlayers.length === 0 ? 'X' : 'O';
  const player: Player = { id: playerId, ws, symbol };
  game.players.push(player);

  return { success: true, symbol };
}

function removePlayer(roomId: string, playerId: string): void {
  const game = games.get(roomId);
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
      // Assign the symbol of the player who left
      nextPlayer.symbol = player.symbol;
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
}

function resetGame(roomId: string, resettingPlayerId?: string): void {
  const game = games.get(roomId);
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

  // If there's a previous winner and others in queue, winner stays, loser goes to queue
  if (previousWinner && hasQueue && previousLoser) {
    // Winner stays with their symbol (no change needed)
    
    // Loser goes to end of queue
    previousLoser.symbol = null;
    game.queue.push(previousLoser.id);

    // Promote next player from queue to play against winner
    const nextPlayerId = game.queue.shift();
    if (nextPlayerId) {
      const nextPlayer = game.players.find(p => p.id === nextPlayerId);
      if (nextPlayer) {
        // Assign the opposite symbol of the winner
        nextPlayer.symbol = previousWinner === 'X' ? 'O' : 'X';
      }
    }
  } else if (wasDraw && hasQueue && activePlayers.length === 2) {
    // If it was a draw and there's a queue, both players go to queue
    activePlayers.forEach(p => {
      p.symbol = null;
      game.queue.push(p.id);
    });

    // Promote next 2 from queue
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
  } else if (activePlayers.length > 2) {
    // If no winner or no queue, rotate all players
    activePlayers.forEach(p => {
      p.symbol = null;
      game.queue.push(p.id);
    });

    // Promote next 2 from queue
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
}

function joinQueue(roomId: string, playerId: string): { success: boolean; error?: string } {
  const game = games.get(roomId);
  if (!game) {
    return { success: false, error: 'Game not found' };
  }

  const player = game.players.find(p => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // If player is already in queue, do nothing
  if (game.queue.includes(playerId)) {
    return { success: true };
  }

  // If player is currently playing, they can't join queue
  if (player.symbol !== null) {
    return { success: false, error: 'Cannot join queue while playing' };
  }

  // Add to queue
  game.queue.push(playerId);
  return { success: true };
}

function broadcastToRoom(roomId: string, message: any, excludePlayerId?: string): void {
  const game = games.get(roomId);
  if (!game) return;

  const messageStr = JSON.stringify(message);
  game.players.forEach(player => {
    if (player.id !== excludePlayerId && player.ws.readyState === 1) { // WebSocket.OPEN
      player.ws.send(messageStr);
    }
  });
}

export {
  createGame,
  getGame,
  makeMove,
  addPlayer,
  removePlayer,
  resetGame,
  joinQueue,
  broadcastToRoom,
  type GameState,
  type Player,
};
