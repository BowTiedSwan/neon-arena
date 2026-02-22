'use client';

import { useState } from 'react';

interface GameLobbyProps {
  roomId: string;
  playerName: string;
  isHost: boolean;
  playerCount: number;
}

export default function GameLobby({ roomId, playerName, isHost, playerCount }: GameLobbyProps) {
  const [copied, setCopied] = useState(false);

  const roomUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}`
    : '';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Failed to copy');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="neon-border rounded-lg p-8 max-w-lg w-full bg-[#0d0221]">
        <h1 className="text-3xl font-bold neon-text mb-2 text-center">
          Game Lobby
        </h1>
        <p className="text-center text-gray-400 mb-6">
          {isHost ? 'Waiting for opponent...' : 'Connecting to host...'}
        </p>
        
        <div className="bg-[#1a1c2c] rounded p-4 mb-4">
          <p className="text-sm text-gray-400 mb-2">Your name:</p>
          <p className="text-lg font-bold text-[#05d9e8]">{playerName}</p>
        </div>

        <div className="bg-[#1a1c2c] rounded p-4 mb-4">
          <p className="text-sm text-gray-400 mb-2">Players joined:</p>
          <p className="text-2xl font-bold">{playerCount} / 2</p>
        </div>

        {isHost && (
          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-2">Share this link:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={roomUrl}
                readOnly
                className="flex-1 p-2 bg-[#29366f] border border-[#05d9e8] rounded text-sm text-gray-300"
              />
              <button
                onClick={copyLink}
                className="glow-button px-4 py-2 text-sm"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-center">
          <div className="animate-pulse flex gap-1">
            <span className="w-3 h-3 bg-[#05d9e8] rounded-full"></span>
            <span className="w-3 h-3 bg-[#05d9e8] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
            <span className="w-3 h-3 bg-[#05d9e8] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
          </div>
        </div>
      </div>
    </div>
  );
}