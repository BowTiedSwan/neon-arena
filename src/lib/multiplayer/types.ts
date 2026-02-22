export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  ready: boolean;
}

export type RoomStatus = "waiting" | "playing" | "finished";

export interface RoomState {
  roomId: string;
  players: Player[];
  status: RoomStatus;
}

export interface GameState {
  [key: string]: unknown;
}

export type GameMessageType = "state-sync" | "player-input" | "game-event";

export interface GameMessage<TPayload = unknown> {
  type: GameMessageType;
  payload: TPayload;
  timestamp: number;
}

export interface VersionedState<TState = GameState> {
  state: TState;
  timestamp: number;
}
