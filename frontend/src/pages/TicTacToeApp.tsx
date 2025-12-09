import { useState, useEffect, useRef } from 'react';

interface GameState {
  board: (string | null)[];
  currentPlayer: 'X' | 'O';
  winner: string | null;
  isDraw: boolean;
  yourSymbol: 'X' | 'O' | null;
  players: Array<{ id: string; symbol: 'X' | 'O' | null }>;
  queue: string[];
}

export function TicTacToeApp() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const playerIdRef = useRef<string>(`player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    // Get WebSocket URL - connect to backend server
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const wsProtocol = apiUrl.startsWith('https') ? 'wss:' : 'ws:';
    const wsHost = apiUrl.replace(/^https?:\/\//, '').replace('/api', '');
    const wsUrl = `${wsProtocol}//${wsHost}/api/ws?room=default&playerId=${playerIdRef.current}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'gameState') {
          setGameState(message.game);
        } else if (message.type === 'playerJoined' && message.game) {
          // Update game state when player joins
          setGameState(message.game);
        } else if (message.type === 'playerLeft' && message.game) {
          // Update game state when player leaves
          setGameState(message.game);
        } else if (message.type === 'error') {
          setError(message.message);
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      setError('Connection error. Please refresh the page.');
      setConnected(false);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleCellClick = (index: number) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError('Not connected to server');
      return;
    }

    if (!gameState) return;
    if (gameState.winner || gameState.isDraw) return;
    if (gameState.yourSymbol !== gameState.currentPlayer) return;
    if (gameState.board[index] !== null) return;

    wsRef.current.send(JSON.stringify({
      type: 'move',
      position: index,
    }));
  };

  const handleReset = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'reset' }));
  };

  const handleJoinQueue = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'joinQueue' }));
  };

  const getStatusMessage = () => {
    if (!gameState) return 'Connecting...';
    if (gameState.winner) {
      const winnerSymbol = gameState.winner;
      if (gameState.yourSymbol === winnerSymbol) {
        return '🎉 You won!';
      } else {
        return `Player ${winnerSymbol} won!`;
      }
    }
    if (gameState.isDraw) {
      return "It's a draw!";
    }
    if (gameState.yourSymbol === null) {
      return `Waiting in queue (${gameState.queue.indexOf(playerIdRef.current) + 1} of ${gameState.queue.length + gameState.players.filter(p => p.symbol !== null).length})...`;
    }
    if (gameState.currentPlayer === gameState.yourSymbol) {
      return `Your turn (${gameState.yourSymbol})`;
    }
    return `Waiting for ${gameState.currentPlayer}...`;
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Tic Tac Toe</h1>
          <p className="text-muted-foreground">Multiplayer game - play with friends!</p>
        </div>

        {!connected && (
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <p className="text-muted-foreground">Connecting to game server...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-800 text-sm">
            {error}
          </div>
        )}

        {connected && gameState && (
          <>
            <div className="bg-card border-4 border-primary rounded-3xl p-6 mb-6 shadow-lg">
              <div className="text-center mb-6">
                <p className={`text-lg font-bold ${
                  gameState.winner && gameState.yourSymbol === gameState.winner
                    ? 'text-green-600'
                    : gameState.winner
                    ? 'text-red-600'
                    : gameState.yourSymbol === gameState.currentPlayer
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}>
                  {getStatusMessage()}
                </p>
                
                {gameState.yourSymbol && (
                  <p className="text-sm text-muted-foreground mt-2">
                    You are playing as <span className="font-bold text-primary">{gameState.yourSymbol}</span>
                  </p>
                )}

                {gameState.players.length > 2 && (
                  <div className="mt-4 text-sm text-muted-foreground">
                    <p>Players: {gameState.players.filter(p => p.symbol !== null).length} playing, {gameState.queue.length} waiting</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                {gameState.board.map((cell, index) => (
                  <button
                    key={index}
                    onClick={() => handleCellClick(index)}
                    disabled={
                      !gameState.yourSymbol ||
                      gameState.yourSymbol !== gameState.currentPlayer ||
                      cell !== null ||
                      gameState.winner !== null ||
                      gameState.isDraw
                    }
                    className={`
                      aspect-square text-4xl font-bold rounded-xl transition-all
                      ${cell === null 
                        ? 'bg-muted hover:bg-muted/80 border-2 border-border' 
                        : 'bg-card border-2 border-primary'
                      }
                      ${gameState.yourSymbol === gameState.currentPlayer && cell === null && !gameState.winner && !gameState.isDraw
                        ? 'cursor-pointer hover:scale-105 active:scale-95'
                        : 'cursor-not-allowed opacity-60'
                      }
                      ${cell === 'X' ? 'text-primary' : cell === 'O' ? 'text-secondary' : ''}
                    `}
                  >
                    {cell || ''}
                  </button>
                ))}
              </div>

              {(gameState.winner || gameState.isDraw) && (
                <div className="mt-6 text-center">
                  {(() => {
                    const isWinner = gameState.yourSymbol === gameState.winner;
                    const isLoser = gameState.yourSymbol !== null && gameState.yourSymbol !== gameState.winner && !gameState.isDraw;
                    const hasQueue = gameState.queue.length > 0;
                    const isInQueue = gameState.queue.includes(playerIdRef.current);
                    
                    // If winner and queue exists, game auto-started - show nothing or a message
                    if (isWinner && hasQueue) {
                      return (
                        <p className="text-sm text-primary font-semibold">
                          New game started! Next player joined.
                        </p>
                      );
                    }
                    
                    // Winner with no queue: can play again
                    if (isWinner && !hasQueue) {
                      return (
                        <button
                          onClick={handleReset}
                          className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 transition-all active:scale-95 shadow-md"
                        >
                          Play Again
                        </button>
                      );
                    }
                    
                    // Loser: automatically in queue if there was a queue, show "Get in line" if not already
                    if (isLoser) {
                      if (isInQueue) {
                        return (
                          <p className="text-sm text-muted-foreground">
                            You're in line to play again (position {gameState.queue.indexOf(playerIdRef.current) + 1})
                          </p>
                        );
                      } else if (hasQueue) {
                        return (
                          <button
                            onClick={handleJoinQueue}
                            className="px-6 py-3 bg-secondary text-primary-foreground rounded-full font-semibold hover:bg-secondary/90 transition-all active:scale-95 shadow-md"
                          >
                            Get in line to play again
                          </button>
                        );
                      } else {
                        return (
                          <button
                            onClick={handleReset}
                            className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 transition-all active:scale-95 shadow-md"
                          >
                            Play Again
                          </button>
                        );
                      }
                    }
                    
                    // Draw: rematch happens automatically, show message
                    if (gameState.isDraw) {
                      return (
                        <p className="text-sm text-primary font-semibold">
                          It's a draw! Rematch starting...
                        </p>
                      );
                    }
                    
                    return null;
                  })()}
                </div>
              )}
            </div>

            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-bold text-foreground mb-3">Players</h3>
              <div className="space-y-2">
                {gameState.players.map((player, idx) => (
                  <div key={player.id} className="flex items-center justify-between text-sm">
                    <span className={player.id === playerIdRef.current ? 'font-bold text-primary' : 'text-foreground'}>
                      {player.id === playerIdRef.current ? 'You' : `Player ${idx + 1}`}
                    </span>
                    <span className="text-muted-foreground">
                      {player.symbol ? `Playing as ${player.symbol}` : 'Waiting in queue'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
