"use client";

import { useEffect, useRef, useState } from "react";

import { GameEngine } from "./engine";
import { CanvasRenderer } from "./renderer";
import type { GameState, InputState } from "./types";

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;

type PlayerId = 0 | 1;

export interface NeonTennisGameProps {
  roomId: string;
  playerId: number;
  playerName: string;
  isHost: boolean;
  onInputChange?: (playerId: number, input: InputState) => void;
  onStateChange?: (state: GameState) => void;
  onGameEnd?: (winner: number) => void;
}

export function NeonTennisGame({
  roomId,
  playerId,
  playerName,
  isHost,
  onInputChange,
  onStateChange,
  onGameEnd,
}: NeonTennisGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const frameIdRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number>(0);
  const finishedRef = useRef(false);

  const inputRef = useRef<Record<PlayerId, InputState>>({
    0: { up: false, down: false },
    1: { up: false, down: false },
  });

  const [gameState, setGameState] = useState<GameState | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const engine = new GameEngine(CANVAS_WIDTH, CANVAS_HEIGHT);
    const renderer = new CanvasRenderer();

    engineRef.current = engine;
    rendererRef.current = renderer;
    engine.reset();
    const initial = engine.getState();
    setGameState(initial);
    renderer.render(initial, canvas, ctx);

    const animate = (timestamp: number) => {
      const previous = previousTimeRef.current || timestamp;
      const dt = Math.min((timestamp - previous) / 1000, 0.05);
      previousTimeRef.current = timestamp;

      engine.update(dt);
      const nextState = engine.getState();

      if (nextState.status === "finished" && !finishedRef.current && nextState.winner !== null) {
        finishedRef.current = true;
        onGameEnd?.(nextState.winner);
      }

      setGameState(nextState);
      onStateChange?.(nextState);
      renderer.render(nextState, canvas, ctx);
      frameIdRef.current = window.requestAnimationFrame(animate);
    };

    frameIdRef.current = window.requestAnimationFrame(animate);

    const updateInput = (targetPlayer: PlayerId, input: InputState) => {
      inputRef.current[targetPlayer] = input;
      engine.handleInput(targetPlayer, input);
      onInputChange?.(targetPlayer, input);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "w" || event.key === "W") {
        const current = inputRef.current[0];
        updateInput(0, { ...current, up: true });
      }

      if (event.key === "s" || event.key === "S") {
        const current = inputRef.current[0];
        updateInput(0, { ...current, down: true });
      }

      if (event.key === "ArrowUp") {
        const current = inputRef.current[1];
        updateInput(1, { ...current, up: true });
      }

      if (event.key === "ArrowDown") {
        const current = inputRef.current[1];
        updateInput(1, { ...current, down: true });
      }

      if ((event.key === "r" || event.key === "R") && engine.getState().status === "finished") {
        finishedRef.current = false;
        engine.reset();
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === "w" || event.key === "W") {
        const current = inputRef.current[0];
        updateInput(0, { ...current, up: false });
      }

      if (event.key === "s" || event.key === "S") {
        const current = inputRef.current[0];
        updateInput(0, { ...current, down: false });
      }

      if (event.key === "ArrowUp") {
        const current = inputRef.current[1];
        updateInput(1, { ...current, up: false });
      }

      if (event.key === "ArrowDown") {
        const current = inputRef.current[1];
        updateInput(1, { ...current, down: false });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      if (frameIdRef.current !== null) {
        window.cancelAnimationFrame(frameIdRef.current);
      }
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      previousTimeRef.current = 0;
      finishedRef.current = false;
    };
  }, [onGameEnd, onInputChange, onStateChange]);

  return (
    <section
      style={{
        width: "100%",
        minHeight: "100%",
        padding: "24px 16px",
        background: "radial-gradient(circle at 50% 0%, #23104f 0%, #0d0221 52%, #090017 100%)",
        color: "#d1f7ff",
        fontFamily: "'Orbitron', 'Trebuchet MS', sans-serif",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          margin: "0 auto",
          width: "min(100%, 1024px)",
          display: "grid",
          gap: "14px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p style={{ margin: 0, color: "#05d9e8", letterSpacing: "0.08em" }}>ROOM {roomId}</p>
            <h2 style={{ margin: "6px 0 0", fontSize: "1.2rem" }}>Neon Tennis: Cyber Clash</h2>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, color: "#ff2a6d" }}>
              {playerName} · P{playerId + 1} · {isHost ? "HOST" : "GUEST"}
            </p>
            <p style={{ margin: "6px 0 0", color: "#8fd7ff", fontSize: "0.9rem" }}>
              P1: W/S · P2: Arrow Up/Down · R: Restart
            </p>
          </div>
        </div>

        <div
          style={{
            border: "1px solid #005678",
            borderRadius: "14px",
            overflow: "hidden",
            boxShadow: "0 0 24px rgba(5, 217, 232, 0.3), 0 0 44px rgba(255, 42, 109, 0.2)",
            background: "#0d0221",
          }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{
              display: "block",
              width: "100%",
              maxWidth: "100%",
              height: "auto",
              aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}`,
              background: "#0d0221",
            }}
          />
        </div>

        <div style={{ color: "#8fd7ff", minHeight: "22px", fontSize: "0.92rem" }}>
          {gameState?.status === "finished" && gameState.winner !== null
            ? `Winner: Player ${gameState.winner + 1}. Press R to restart.`
            : "First to 7 points wins."}
        </div>
      </div>
    </section>
  );
}

export default NeonTennisGame;
