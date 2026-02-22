import type { GameState } from "./types";

const COLORS = {
  background: "#0d0221",
  neonPink: "#ff2a6d",
  neonCyan: "#05d9e8",
  neonWhite: "#d1f7ff",
  neonDeep: "#005678",
};

export class CanvasRenderer {
  public render(gameState: GameState, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.drawBackground(canvas, ctx);
    this.drawCenterLine(canvas, ctx);
    this.drawPaddles(gameState, ctx);
    this.drawBall(gameState, ctx);
    this.drawScores(gameState, canvas, ctx);
    this.drawWinner(gameState, canvas, ctx);
  }

  private drawBackground(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, COLORS.background);
    gradient.addColorStop(1, "#140636");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  private drawCenterLine(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
    const x = canvas.width / 2;
    ctx.save();
    ctx.strokeStyle = COLORS.neonDeep;
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 10]);
    ctx.shadowBlur = 14;
    ctx.shadowColor = COLORS.neonCyan;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
    ctx.restore();
  }

  private drawPaddles(gameState: GameState, ctx: CanvasRenderingContext2D): void {
    gameState.paddles.forEach((paddle, index) => {
      const color = index === 0 ? COLORS.neonPink : COLORS.neonCyan;

      ctx.save();
      ctx.fillStyle = color;
      ctx.shadowBlur = 20;
      ctx.shadowColor = color;
      ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

      ctx.strokeStyle = COLORS.neonWhite;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 12;
      ctx.shadowColor = COLORS.neonWhite;
      ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);
      ctx.restore();
    });
  }

  private drawBall(gameState: GameState, ctx: CanvasRenderingContext2D): void {
    const { x, y, radius } = gameState.ball;
    ctx.save();
    ctx.fillStyle = COLORS.neonWhite;
    ctx.shadowBlur = 20;
    ctx.shadowColor = COLORS.neonCyan;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawScores(
    gameState: GameState,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
  ): void {
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "700 56px 'Orbitron', 'Trebuchet MS', sans-serif";
    ctx.fillStyle = COLORS.neonWhite;
    ctx.shadowBlur = 16;
    ctx.shadowColor = COLORS.neonCyan;
    ctx.fillText(String(gameState.scores[0]), canvas.width * 0.25, 74);

    ctx.shadowColor = COLORS.neonPink;
    ctx.fillText(String(gameState.scores[1]), canvas.width * 0.75, 74);
    ctx.restore();
  }

  private drawWinner(
    gameState: GameState,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
  ): void {
    if (gameState.status !== "finished" || gameState.winner === null) {
      return;
    }

    const winnerName = gameState.winner === 0 ? "PLAYER 1" : "PLAYER 2";
    ctx.save();
    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.neonWhite;
    ctx.font = "700 34px 'Orbitron', 'Trebuchet MS', sans-serif";
    ctx.shadowBlur = 22;
    ctx.shadowColor = COLORS.neonPink;
    ctx.fillText(`${winnerName} WINS`, canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = "500 20px 'Orbitron', 'Trebuchet MS', sans-serif";
    ctx.shadowBlur = 14;
    ctx.shadowColor = COLORS.neonCyan;
    ctx.fillText("Press R to restart", canvas.width / 2, canvas.height / 2 + 30);
    ctx.restore();
  }
}
