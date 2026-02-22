'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PeerManager } from '@/lib/multiplayer/peer';
import { StateSynchronizer } from '@/lib/multiplayer/sync';
import {
  type ConnectionStatus,
  type GameMessage,
  type GameState,
  type Player,
  type VersionedState,
} from '@/lib/multiplayer/types';

export interface UseMultiplayerOptions {
  roomId?: string;
  autoConnect?: boolean;
  localPlayerName?: string;
}

export interface UseMultiplayerResult {
  isConnected: boolean;
  isHost: boolean;
  players: Player[];
  sendMessage: (message: GameMessage) => void;
  syncState: <TState extends GameState>(state: TState) => VersionedState<TState>;
  status: ConnectionStatus;
}

export function useMultiplayer(options: UseMultiplayerOptions = {}): UseMultiplayerResult {
  const {
    roomId,
    autoConnect = true,
    localPlayerName = 'Player',
  } = options;

  const peerManagerRef = useRef<PeerManager | null>(null);
  const synchronizerRef = useRef(new StateSynchronizer());
  const initializedRef = useRef(false);

  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [players, setPlayers] = useState<Player[]>([]);
  const [isHost, setIsHost] = useState<boolean>(false);

  const upsertPlayer = useCallback((nextPlayer: Player): void => {
    setPlayers((currentPlayers) => {
      const index = currentPlayers.findIndex((player) => player.id === nextPlayer.id);
      if (index === -1) {
        return [...currentPlayers, nextPlayer];
      }
      const updated = [...currentPlayers];
      updated[index] = { ...updated[index], ...nextPlayer };
      return updated;
    });
  }, []);

  const removePlayer = useCallback((playerId: string): void => {
    setPlayers((currentPlayers) => currentPlayers.filter((player) => player.id !== playerId));
  }, []);

  const sendMessage = useCallback((message: GameMessage): void => {
    const manager = peerManagerRef.current;
    if (!manager) return;
    if (!isGameMessage(message)) return;
    manager.send(message);
  }, []);

  const syncState = useCallback(
    <TState extends GameState>(state: TState): VersionedState<TState> => {
      const versioned = new StateSynchronizer<TState>().syncState(state);
      synchronizerRef.current.syncState(state);
      peerManagerRef.current?.send({
        type: 'state-sync',
        payload: versioned,
        timestamp: versioned.timestamp,
      } as GameMessage<VersionedState<TState>>);
      return versioned;
    },
    [],
  );

  useEffect(() => {
    if (initializedRef.current || !autoConnect || !roomId) return;
    initializedRef.current = true;

    const manager = new PeerManager();
    peerManagerRef.current = manager;

    const unsubscribeConnection = manager.onConnection((event) => {
      setStatus(event.status);

      if (event.localPeerId) {
        upsertPlayer({
          id: event.localPeerId,
          name: localPlayerName,
          isHost: event.status === 'connected' ? manager.isHost : false,
          ready: true,
        });
      }

      if (event.peerId && event.status === 'connected') {
        upsertPlayer({
          id: event.peerId,
          name: `Player-${event.peerId.slice(0, 6)}`,
          isHost: false,
          ready: true,
        });
      }
    });

    const unsubscribeMessage = manager.onMessage((rawData) => {
      if (!isGameMessage(rawData)) return;
      if (rawData.type === 'state-sync' && isVersionedState(rawData.payload)) {
        synchronizerRef.current.receiveState(rawData.payload);
      }
    });

    const connect = async (): Promise<void> => {
      try {
        // Try to join as guest first
        await manager.joinRoom(roomId);
        setIsHost(false);
      } catch {
        // If join fails, create room as host
        try {
          await manager.createRoom(roomId);
          setIsHost(true);
        } catch (err) {
          console.error('Failed to connect:', err);
          setStatus('error');
        }
      }
    };

    connect();

    return () => {
      unsubscribeConnection();
      unsubscribeMessage();
      manager.disconnect();
      peerManagerRef.current = null;
      initializedRef.current = false;
      setPlayers([]);
    };
  }, [autoConnect, localPlayerName, roomId, upsertPlayer]);

  const isConnected = useMemo(() => status === 'connected', [status]);

  return {
    isConnected,
    isHost,
    players,
    sendMessage,
    syncState,
    status,
  };
}

function isGameMessage(value: unknown): value is GameMessage {
  if (!value || typeof value !== 'object') return false;
  const typed = value as Partial<GameMessage>;
  const validTypes = new Set(['state-sync', 'player-input', 'game-event']);
  return (
    typeof typed.type === 'string' &&
    validTypes.has(typed.type) &&
    'payload' in typed &&
    typeof typed.timestamp === 'number'
  );
}

function isVersionedState(value: unknown): value is VersionedState {
  if (!value || typeof value !== 'object') return false;
  const typed = value as Partial<VersionedState>;
  return 'state' in typed && typeof typed.timestamp === 'number';
}