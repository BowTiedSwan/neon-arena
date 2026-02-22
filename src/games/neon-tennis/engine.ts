import { Ball } from "./ball";
import { Paddle } from "./paddle";
import type { GameState, InputState } from "./types";

const WIN_SCORE = 7;

const DEFAULT_INPUT: InputState = {
  up: false,
  down: false,
};

export class GameEngine {
  private readonly width: number;
  private readonly height: number;
  private paddles: [Paddle, Paddle];
  private readonly ball: Ball;
  private inputs: [InputState, InputState] = [{ ...DEFAULT_INPUT }, { ...DEFAULT_INPUT }];
  private scores: [number, number] = [0, 0];
  private status: GameState["status"] = "waiting";
  private winner: number | null = null;

  constructor(width = 960, height = 540) {
    this.width = width;
    this.height = height;

    const paddleHeight = 88;
    const paddleWidth = 14;
    const paddleY = this.height / 2 - paddleHeight / 2;

    this.paddles = [
      new Paddle(28, paddleY, paddleWidth, paddleHeight),
      new Paddle(this.width - 28 - paddleWidth, paddleY, paddleWidth, paddleHeight),
    ];
    this.ball = new Ball(this.width / 2, this.height / 2, 9);
  }

  public handleInput(playerId: number, input: InputState): void {
    if (playerId !== 0 && playerId !== 1) {
      return;
    }
    this.inputs[playerId] = input;
  }

  public serve(direction?: 1 | -1): void {
    this.ball.reset(this.width / 2, this.height / 2);
    const serveDirection = direction ?? (Math.random() > 0.5 ? 1 : -1);
    this.ball.serve(serveDirection);
    this.status = "playing";
  }

  public reset(): void {
    this.scores = [0, 0];
    this.winner = null;
    this.status = "serving";

    const left = this.paddles[0].getState();
    const right = this.paddles[1].getState();
    this.paddles[0].setY(this.height / 2 - left.height / 2);
    this.paddles[1].setY(this.height / 2 - right.height / 2);
    this.paddles[0].setScore(0);
    this.paddles[1].setScore(0);

    this.inputs = [{ ...DEFAULT_INPUT }, { ...DEFAULT_INPUT }];
    this.serve();
  }

  public update(dt: number): void {
    if (this.status === "finished") {
      return;
    }

    this.paddles[0].update(this.inputs[0], this.height, dt);
    this.paddles[1].update(this.inputs[1], this.height, dt);

    if (this.status !== "playing") {
      return;
    }

    this.ball.update(dt);
    this.handleWallBounce();
    this.handlePaddleCollisions();
    this.handleScoring();
  }

  public getState(): GameState {
    const paddles = [this.paddles[0].getState(), this.paddles[1].getState()];
    return {
      paddles,
      ball: this.ball.getState(),
      scores: [...this.scores],
      status: this.status,
      winner: this.winner,
    };
  }

  private handleWallBounce(): void {
    const ball = this.ball.getState();
    if (ball.y - ball.radius <= 0) {
      this.ball.setPosition(ball.x, ball.radius);
      this.ball.bounceVertical();
      return;
    }

    if (ball.y + ball.radius >= this.height) {
      this.ball.setPosition(ball.x, this.height - ball.radius);
      this.ball.bounceVertical();
    }
  }

  private handlePaddleCollisions(): void {
    const ball = this.ball.getState();
    const left = this.paddles[0].getState();
    const right = this.paddles[1].getState();

    const leftHit =
      ball.vx < 0 &&
      ball.x - ball.radius <= left.x + left.width &&
      ball.y >= left.y &&
      ball.y <= left.y + left.height;

    if (leftHit) {
      this.ball.setPosition(left.x + left.width + ball.radius, ball.y);
      this.reflectFromPaddle(left, 1);
      return;
    }

    const rightHit =
      ball.vx > 0 &&
      ball.x + ball.radius >= right.x &&
      ball.y >= right.y &&
      ball.y <= right.y + right.height;

    if (rightHit) {
      this.ball.setPosition(right.x - ball.radius, ball.y);
      this.reflectFromPaddle(right, -1);
    }
  }

  private reflectFromPaddle(
    paddle: ReturnType<Paddle["getState"]>,
    horizontalDirection: 1 | -1,
  ): void {
    const ball = this.ball.getState();
    const offset = (ball.y - (paddle.y + paddle.height / 2)) / (paddle.height / 2);
    const clampedOffset = Math.max(-1, Math.min(1, offset));

    const currentSpeed = Math.max(5, this.ball.getSpeed());
    const bounceAngle = clampedOffset * (Math.PI / 3);

    const vx = Math.cos(bounceAngle) * currentSpeed * horizontalDirection;
    const vy = Math.sin(bounceAngle) * currentSpeed;

    this.ball.setVelocity(vx, vy);
    this.ball.increaseSpeed();
  }

  private handleScoring(): void {
    const ball = this.ball.getState();

    if (ball.x + ball.radius < 0) {
      this.awardPoint(1);
      return;
    }

    if (ball.x - ball.radius > this.width) {
      this.awardPoint(0);
    }
  }

  private awardPoint(player: 0 | 1): void {
    this.scores[player] += 1;
    this.paddles[player].addPoint();

    if (this.scores[player] >= WIN_SCORE) {
      this.status = "finished";
      this.winner = player;
      this.ball.reset(this.width / 2, this.height / 2);
      return;
    }

    const nextServeDirection: 1 | -1 = player === 0 ? 1 : -1;
    this.status = "serving";
    this.serve(nextServeDirection);
  }
}
