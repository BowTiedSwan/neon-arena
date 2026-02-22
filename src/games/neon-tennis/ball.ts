import type { BallState } from "./types";

export class Ball {
  private readonly initialSpeed = 5;
  private readonly maxSpeed = 12;
  private readonly radius: number;
  private x: number;
  private y: number;
  private vx = 0;
  private vy = 0;

  constructor(x: number, y: number, radius: number) {
    this.x = x;
    this.y = y;
    this.radius = radius;
  }

  public serve(direction: 1 | -1): void {
    const angle = (Math.random() * Math.PI) / 3 - Math.PI / 6;
    const speed = this.initialSpeed;
    this.vx = Math.cos(angle) * speed * direction;
    this.vy = Math.sin(angle) * speed;
  }

  public reset(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
  }

  public update(dt: number): void {
    const scale = dt * 60;
    this.x += this.vx * scale;
    this.y += this.vy * scale;
  }

  public bounceVertical(): void {
    this.vy *= -1;
  }

  public bounceHorizontal(): void {
    this.vx *= -1;
  }

  public setVelocity(vx: number, vy: number): void {
    this.vx = vx;
    this.vy = vy;
  }

  public getSpeed(): number {
    return Math.hypot(this.vx, this.vy);
  }

  public increaseSpeed(multiplier = 1.06): void {
    const nextSpeed = Math.min(this.maxSpeed, this.getSpeed() * multiplier);
    if (nextSpeed === 0) {
      return;
    }
    const angle = Math.atan2(this.vy, this.vx);
    this.vx = Math.cos(angle) * nextSpeed;
    this.vy = Math.sin(angle) * nextSpeed;
  }

  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  public getState(): BallState {
    return {
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
      radius: this.radius,
    };
  }
}
