import type { Car, GameState } from "./types";

const palette = {
  bg: "#1a1c2c",
  white: "#f4f4f4",
  yellow: "#ffcd75",
  lightGreen: "#a7f070",
  green: "#38b764",
  teal: "#257179",
  blue: "#29366f",
};

export class CanvasRenderer {
  render(gameState: GameState, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
    ctx.imageSmoothingEnabled = false;
    canvas.style.imageRendering = "pixelated";

    this.drawBackground(ctx, canvas.width, canvas.height);
    this.drawTrack(ctx, gameState);
    this.drawCars(ctx, gameState.cars);
    this.drawHud(ctx, gameState);
  }

  private drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, width, height);
  }

  private drawTrack(ctx: CanvasRenderingContext2D, gameState: GameState): void {
    const outer = gameState.track.boundaries.find((boundary) => boundary.kind === "outer");
    const inner = gameState.track.boundaries.find((boundary) => boundary.kind === "inner");

    if (!outer || !inner) {
      return;
    }

    ctx.fillStyle = palette.teal;
    ctx.beginPath();
    ctx.ellipse(outer.x, outer.y, outer.radiusX, outer.radiusY, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = palette.blue;
    ctx.beginPath();
    ctx.ellipse(inner.x, inner.y, inner.radiusX, inner.radiusY, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = palette.white;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(
      (outer.x + inner.x) / 2,
      (outer.y + inner.y) / 2,
      (outer.radiusX + inner.radiusX) / 2,
      (outer.radiusY + inner.radiusY) / 2,
      0,
      0,
      Math.PI * 2,
    );
    ctx.setLineDash([10, 14]);
    ctx.stroke();
    ctx.setLineDash([]);

    for (const checkpoint of gameState.track.checkpoints) {
      ctx.strokeStyle = palette.lightGreen;
      ctx.globalAlpha = 0.25;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(checkpoint.x, checkpoint.y, checkpoint.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    const start = gameState.track.checkpoints[0];
    if (start) {
      ctx.fillStyle = palette.white;
      const stripeWidth = 8;
      const stripeHeight = 40;
      for (let row = 0; row < 2; row += 1) {
        for (let col = 0; col < 8; col += 1) {
          if ((row + col) % 2 !== 0) {
            continue;
          }

          ctx.fillRect(
            start.x - 32 + (col * stripeWidth),
            start.y - (stripeHeight / 2) + (row * (stripeHeight / 2)),
            stripeWidth,
            stripeHeight / 2,
          );
        }
      }
    }
  }

  private drawCars(ctx: CanvasRenderingContext2D, cars: Car[]): void {
    cars.forEach((car, index) => {
      ctx.save();
      ctx.translate(Math.round(car.x), Math.round(car.y));
      ctx.rotate(car.angle + (Math.PI / 2));

      const bodyColor = index === 0 ? palette.yellow : palette.lightGreen;
      const detailColor = index === 0 ? palette.green : palette.blue;

      ctx.fillStyle = bodyColor;
      ctx.fillRect(-8, -14, 16, 28);

      ctx.fillStyle = detailColor;
      ctx.fillRect(-6, -10, 12, 14);

      ctx.fillStyle = palette.white;
      ctx.fillRect(-4, -12, 8, 2);

      ctx.fillStyle = palette.bg;
      ctx.fillRect(-8, -12, 2, 6);
      ctx.fillRect(6, -12, 2, 6);
      ctx.fillRect(-8, 6, 2, 6);
      ctx.fillRect(6, 6, 2, 6);

      ctx.restore();
    });
  }

  private drawHud(ctx: CanvasRenderingContext2D, gameState: GameState): void {
    ctx.fillStyle = palette.bg;
    ctx.fillRect(12, 12, 255, 68);

    ctx.strokeStyle = palette.yellow;
    ctx.lineWidth = 2;
    ctx.strokeRect(12, 12, 255, 68);

    ctx.fillStyle = palette.white;
    ctx.font = "16px monospace";
    ctx.fillText(`P1 Lap: ${gameState.cars[0]?.lap ?? 0}/3`, 22, 36);
    ctx.fillText(`P2 Lap: ${gameState.cars[1]?.lap ?? 0}/3`, 22, 58);

    if (gameState.status === "finished" && gameState.winner !== null) {
      ctx.fillStyle = palette.yellow;
      ctx.font = "24px monospace";
      ctx.fillText(`PLAYER ${gameState.winner + 1} WINS!`, 250, 52);
      ctx.font = "14px monospace";
      ctx.fillStyle = palette.white;
      ctx.fillText("Press R to restart", 320, 74);
    }
  }
}
