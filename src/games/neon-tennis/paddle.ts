import type { InputState, PaddleState } from "./types";

export class Paddle {
  private readonly speed = 6;
  private readonly width: number;
  private readonly height: number;
  private x: number;
  private y: number;
  private score = 0;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  public setY(y: number): void {
    this.y = y;
  }

  public addPoint(): void {
    this.score += 1;
  }

  public setScore(score: number): void {
    this.score = score;
  }

  public update(input: InputState, canvasHeight: number, dt: number): void {
    const scale = dt * 60;
    if (input.up) {
      this.y -= this.speed * scale;
    }
    if (input.down) {
      this.y += this.speed * scale;
    }

    if (this.y < 0) {
      this.y = 0;
    }

    const maxY = canvasHeight - this.height;
    if (this.y > maxY) {
      this.y = maxY;
    }
  }

  public getState(): PaddleState {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      score: this.score,
    };
  }
}
