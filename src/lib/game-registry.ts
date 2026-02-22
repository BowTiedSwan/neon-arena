export interface GameDefinition {
  slug: string;
  name: string;
  description: string;
  icon: string;
  minPlayers: number;
  maxPlayers: number;
}

export const games: Record<string, GameDefinition> = {
  'retro-race': {
    slug: 'retro-race',
    name: 'Retro Race',
    description: 'Race through a pixelated circuit in this retro-inspired racing game. Outmaneuver your opponent on the track!',
    icon: '🏎️',
    minPlayers: 2,
    maxPlayers: 2,
  },
  'neon-tennis': {
    slug: 'neon-tennis',
    name: 'Neon Tennis',
    description: 'Classic Pong reimagined with neon cyberpunk aesthetics. First to 7 wins!',
    icon: '🎾',
    minPlayers: 2,
    maxPlayers: 2,
  },
};

export function isValidGame(slug: string): boolean {
  return slug in games;
}

export function getGame(slug: string): GameDefinition | null {
  return games[slug] || null;
}