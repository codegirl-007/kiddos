import type { GameHandler } from './base/game-handler.interface.js';

class GameManager {
  private handlers = new Map<string, GameHandler>();

  register(gameType: string, handler: GameHandler): void {
    this.handlers.set(gameType, handler);
    console.log(`✅ Registered game handler: ${gameType}`);
  }

  getHandler(gameType: string): GameHandler {
    const handler = this.handlers.get(gameType);
    if (!handler) {
      throw new Error(`Unknown game type: ${gameType}`);
    }
    return handler;
  }

  hasHandler(gameType: string): boolean {
    return this.handlers.has(gameType);
  }

  getAllGameTypes(): string[] {
    return Array.from(this.handlers.keys());
  }
}

export const gameManager = new GameManager();
