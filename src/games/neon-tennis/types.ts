export type GameStatus = "waiting" | "serving" | "playing" | "finished";

export interface PaddleState {
  x: number;
  y: number;
  width: number;
  height: number;
  score: number;
}

export interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export interface InputState {
  up: boolean;
  down: boolean;
}

export interface GameState {
  paddles: PaddleState[];
  ball: BallState;
  scores: number[];
  status: GameStatus;
  winner: number | null;
}
