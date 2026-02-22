'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { use } from 'react';
import { isValidGame, getGame } from '@/lib/game-registry';
import NameEntry from '@/components/NameEntry';
import GameLobby from '@/components/GameLobby';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import dynamic from 'next/dynamic';

const RetroRaceGame = dynamic(() => import('@/games/retro-race/RetroRaceGame'), { ssr: false });
const NeonTennisGame = dynamic(() => import('@/games/neon-tennis/NeonTennisGame'), { ssr: false });

interface GameRoomPageProps {
  params: Promise<{
    game: string;
    roomId: string;
  }>;
}

export default function GameRoomPage({ params }: GameRoomPageProps) {
  const { game: gameSlug, roomId } = use(params);
  const [playerName, setPlayerName] = useState<string | null>(null);
  
  const game = getGame(gameSlug);
  const isValid = isValidGame(gameSlug);

  const multiplayer = useMultiplayer({ roomId, autoConnect: true, localPlayerName: playerName || 'Player' });

  const handleNameSubmit = (name: string) => {
    setPlayerName(name);
  };



  if (!isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="neon-border rounded-lg p-8 bg-[#0d0221] text-center">
          <h1 className="text-3xl font-bold neon-text-pink mb-4">Game Not Found</h1>
          <p className="text-gray-400 mb-6">The game "{gameSlug}" doesn&apos;t exist.</p>
          <a href="/" className="glow-button inline-block">Back to Hub</a>
        </div>
      </div>
    );
  }

  if (!playerName) {
    return <NameEntry isOpen={true} onSubmit={handleNameSubmit} />;
  }

  const playerCount = multiplayer.players.length;
  const allReady = multiplayer.players.length >= 2 && multiplayer.players.every(p => p.ready);
  const isHost = multiplayer.isHost;

  if (playerCount < 2) {
    return (
      <GameLobby
        roomId={roomId}
        playerName={playerName}
        isHost={isHost}
        playerCount={playerCount}
      />
    );
  }

  if (!allReady && playerCount >= 2) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="neon-border rounded-lg p-8 max-w-lg w-full bg-[#0d0221] text-center">
          <h1 className="text-3xl font-bold neon-text mb-4">{game?.name}</h1>
          <p className="text-gray-400 mb-6">Both players connected!</p>
          <div className="mb-6">
            <p className="text-lg mb-2">Players:</p>
            {multiplayer.players.map((p, i) => (
              <p key={i} className={`font-bold ${p.ready ? 'text-[#a7f070]' : 'text-gray-400'}`}>
                {p.name} {p.ready ? '✓ Ready' : '...waiting'}
              </p>
            ))}
          </div>
          <p className="text-[#05d9e8] animate-pulse">Game starting...</p>
        </div>
      </div>
    );
  }

  const myIndex = multiplayer.players.findIndex(p => p.name === playerName);
  const playerIdNum = myIndex >= 0 ? myIndex : (isHost ? 0 : 1);

  if (gameSlug === 'retro-race') {
    return (
      <RetroRaceGame
        roomId={roomId}
        playerId={String(playerIdNum)}
        playerName={playerName}
        isHost={isHost}
      />
    );
  }

  if (gameSlug === 'neon-tennis') {
    return (
      <NeonTennisGame
        roomId={roomId}
        playerId={playerIdNum}
        playerName={playerName}
        isHost={isHost}
      />
    );
  }

  return null;
}