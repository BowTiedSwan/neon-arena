import { getCheckpoint, isOnTrack, retroRaceTrack } from "./track";
import type { Car, GameState, InputState } from "./types";

const TARGET_LAPS = 3;
const ACCELERATION_PER_FRAME = 0.5;
const BRAKE_PER_FRAME = 0.35;
const MAX_FORWARD_SPEED = 8;
const MAX_REVERSE_SPEED = -4;
const FRICTION_PER_FRAME = 0.98;
const STEERING_PER_FRAME_DEG = 3;
const DRIFT_FACTOR = 0.12;
const COLLISION_RADIUS = 14;

const EMPTY_INPUT: InputState = {
  up: false,
  down: false,
  left: false,
  right: false,
};

function createCar(id: number): Car {
  const spawn = retroRaceTrack.startPositions[id] ?? retroRaceTrack.startPositions[0];

  return {
    id,
    x: spawn.x,
    y: spawn.y,
    angle: spawn.angle,
    velocity: 0,
    acceleration: 0,
    rotation: 0,
    lap: 0,
    checkpoints: [],
  };
}

export class GameEngine {
  private state: GameState;

  private readonly inputs = new Map<number, InputState>();

  constructor() {
    this.state = {
      cars: [createCar(0), createCar(1)],
      track: retroRaceTrack,
      winner: null,
      status: "waiting",
    };
  }

  handleInput(playerId: number, input: InputState): void {
    this.inputs.set(playerId, { ...input });

    if (this.state.status === "waiting") {
      this.state.status = "running";
    }
  }

  update(dt: number): void {
    if (this.state.status !== "running") {
      return;
    }

    const frameScale = dt * 60;

    for (const car of this.state.cars) {
      this.updateCar(car, this.inputs.get(car.id) ?? EMPTY_INPUT, frameScale);
      this.updateCheckpointProgress(car);
      if (car.lap >= TARGET_LAPS && this.state.winner === null) {
        this.state.winner = car.id;
        this.state.status = "finished";
      }
    }

    this.resolveCarCollisions();
  }

  reset(): void {
    this.state = {
      cars: [createCar(0), createCar(1)],
      track: retroRaceTrack,
      winner: null,
      status: "waiting",
    };
    this.inputs.clear();
  }

  getState(): GameState {
    return this.state;
  }

  private updateCar(car: Car, input: InputState, frameScale: number): void {
    const steeringRadians = (STEERING_PER_FRAME_DEG * Math.PI) / 180;
    const speedRatio = Math.min(1, Math.abs(car.velocity) / MAX_FORWARD_SPEED);
    const steerStrength = steeringRadians * frameScale * (0.35 + (speedRatio * 0.65));

    let turn = 0;
    if (input.left) {
      turn -= 1;
    }
    if (input.right) {
      turn += 1;
    }

    if (input.up) {
      car.acceleration = ACCELERATION_PER_FRAME * frameScale;
    } else if (input.down) {
      car.acceleration = -BRAKE_PER_FRAME * frameScale;
    } else {
      car.acceleration = 0;
    }

    car.velocity += car.acceleration;
    car.velocity *= Math.pow(FRICTION_PER_FRAME, frameScale);
    car.velocity = Math.max(MAX_REVERSE_SPEED, Math.min(MAX_FORWARD_SPEED, car.velocity));

    car.rotation = turn * steerStrength;
    if (Math.abs(car.velocity) > 0.08) {
      car.angle += car.rotation;
    }

    const headingX = Math.cos(car.angle);
    const headingY = Math.sin(car.angle);
    const driftAngle = car.angle + (car.rotation * 3.5);
    const driftScale = Math.min(1, Math.abs(car.velocity) / MAX_FORWARD_SPEED) * DRIFT_FACTOR;
    const driftX = Math.cos(driftAngle) * driftScale * car.velocity;
    const driftY = Math.sin(driftAngle) * driftScale * car.velocity;

    const nextX = car.x + (headingX * car.velocity) + driftX;
    const nextY = car.y + (headingY * car.velocity) + driftY;

    if (isOnTrack(nextX, nextY)) {
      car.x = nextX;
      car.y = nextY;
      return;
    }

    car.velocity *= -0.35;
  }

  private updateCheckpointProgress(car: Car): void {
    for (const checkpoint of this.state.track.checkpoints) {
      const dx = checkpoint.x - car.x;
      const dy = checkpoint.y - car.y;
      const distanceSq = (dx * dx) + (dy * dy);
      const radiusSq = checkpoint.radius * checkpoint.radius;

      if (distanceSq > radiusSq) {
        continue;
      }

      const visitedCount = car.checkpoints.length;
      const checkpointIndex = checkpoint.index;

      if (visitedCount === 0 && checkpointIndex === 0) {
        car.checkpoints.push(0);
        break;
      }

      if (visitedCount > 0 && checkpointIndex === visitedCount) {
        car.checkpoints.push(checkpointIndex);
        break;
      }

      if (visitedCount === this.state.track.checkpoints.length && checkpointIndex === 0) {
        car.lap += 1;
        car.checkpoints = [0];
        break;
      }

      break;
    }
  }

  private resolveCarCollisions(): void {
    const [carA, carB] = this.state.cars;
    const dx = carB.x - carA.x;
    const dy = carB.y - carA.y;
    const distance = Math.hypot(dx, dy);
    const minDistance = COLLISION_RADIUS * 2;

    if (distance >= minDistance || distance === 0) {
      return;
    }

    const overlap = minDistance - distance;
    const nx = dx / distance;
    const ny = dy / distance;

    carA.x -= nx * overlap * 0.5;
    carA.y -= ny * overlap * 0.5;
    carB.x += nx * overlap * 0.5;
    carB.y += ny * overlap * 0.5;

    const tempVelocity = carA.velocity;
    carA.velocity = carB.velocity * 0.7;
    carB.velocity = tempVelocity * 0.7;
  }

  public getCurrentCheckpoint(playerId: number): number {
    const car = this.state.cars[playerId];
    if (!car) {
      return 0;
    }

    const next = car.checkpoints.length;
    return getCheckpoint(next).index;
  }
}

export const createInitialInputState = (): InputState => ({
  up: false,
  down: false,
  left: false,
  right: false,
});
