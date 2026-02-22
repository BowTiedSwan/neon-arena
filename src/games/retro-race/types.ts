export type InputState = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
};

export type Car = {
  id: number;
  x: number;
  y: number;
  angle: number;
  velocity: number;
  acceleration: number;
  rotation: number;
  lap: number;
  checkpoints: number[];
};

export type Boundary = {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  kind: "outer" | "inner";
};

export type Checkpoint = {
  index: number;
  x: number;
  y: number;
  radius: number;
};

export type StartPosition = {
  x: number;
  y: number;
  angle: number;
};

export type Track = {
  width: number;
  height: number;
  boundaries: Boundary[];
  checkpoints: Checkpoint[];
  startPositions: StartPosition[];
};

export type GameStatus = "waiting" | "running" | "finished";

export type GameState = {
  cars: Car[];
  track: Track;
  winner: number | null;
  status: GameStatus;
};
