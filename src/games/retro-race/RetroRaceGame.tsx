"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { CanvasRenderer } from "./renderer";
import { GameEngine, createInitialInputState } from "./engine";
import type { InputState } from "./types";

const FIXED_TIMESTEP = 1 / 60;

type RetroRaceGameProps = {
  roomId: string;
  playerId: string;
  playerName: string;
  isHost: boolean;
  remoteInputs?: Partial<Record<number, InputState>>;
  onInputSerializedAction?: (payload: string) => void;
  onGameEndAction?: (winnerPlayerId: number) => void;
};

export function RetroRaceGame({
  roomId,
  playerId,
  playerName,
  isHost,
  remoteInputs,
  onInputSerializedAction,
  onGameEndAction,
}: RetroRaceGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const rafRef = useRef<number | null>(null);
  const accumulatorRef = useRef(0);
  const lastTimeRef = useRef(0);

  const p1InputRef = useRef<InputState>(createInitialInputState());
  const p2InputRef = useRef<InputState>(createInitialInputState());
  const endedRef = useRef(false);

  const [restartVersion, setRestartVersion] = useState(0);

  const localPlayerIndex = useMemo(() => {
    const parsed = Number.parseInt(playerId, 10);
    if (Number.isFinite(parsed) && (parsed === 0 || parsed === 1)) {
      return parsed;
    }
    return isHost ? 0 : 1;
  }, [isHost, playerId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const engine = new GameEngine();
    const renderer = new CanvasRenderer();
    engineRef.current = engine;
    rendererRef.current = renderer;
    endedRef.current = false;

    ctx.imageSmoothingEnabled = false;

    const tick = (time: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = time;
      }

      let delta = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      if (delta > 0.25) {
        delta = 0.25;
      }

      accumulatorRef.current += delta;

      while (accumulatorRef.current >= FIXED_TIMESTEP) {
        const p1Input = remoteInputs?.[0] ?? p1InputRef.current;
        const p2Input = remoteInputs?.[1] ?? p2InputRef.current;

        engine.handleInput(0, p1Input);
        engine.handleInput(1, p2Input);
        engine.update(FIXED_TIMESTEP);

        accumulatorRef.current -= FIXED_TIMESTEP;
      }

      const gameState = engine.getState();
      renderer.render(gameState, canvas, ctx);

      if (gameState.status === "finished" && gameState.winner !== null && !endedRef.current) {
        endedRef.current = true;
        onGameEndAction?.(gameState.winner);
      }

      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = null;
      accumulatorRef.current = 0;
      lastTimeRef.current = 0;
    };
  }, [onGameEndAction, remoteInputs, restartVersion]);

  useEffect(() => {
    const updateInput = (code: string, pressed: boolean): boolean => {
      switch (code) {
        case "KeyW":
          p1InputRef.current.up = pressed;
          return true;
        case "KeyS":
          p1InputRef.current.down = pressed;
          return true;
        case "KeyA":
          p1InputRef.current.left = pressed;
          return true;
        case "KeyD":
          p1InputRef.current.right = pressed;
          return true;
        case "ArrowUp":
          p2InputRef.current.up = pressed;
          return true;
        case "ArrowDown":
          p2InputRef.current.down = pressed;
          return true;
        case "ArrowLeft":
          p2InputRef.current.left = pressed;
          return true;
        case "ArrowRight":
          p2InputRef.current.right = pressed;
          return true;
        default:
          return false;
      }
    };

    const serializeLocalInput = () => {
      const input = localPlayerIndex === 0 ? p1InputRef.current : p2InputRef.current;
      onInputSerializedAction?.(
        JSON.stringify({
          roomId,
          playerId,
          playerName,
          input,
          timestamp: Date.now(),
        }),
      );
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "KeyR") {
        const state = engineRef.current?.getState();
        if (state?.status === "finished") {
          engineRef.current?.reset();
          p1InputRef.current = createInitialInputState();
          p2InputRef.current = createInitialInputState();
          endedRef.current = false;
        }
        return;
      }

      const changed = updateInput(event.code, true);
      if (!changed) {
        return;
      }

      event.preventDefault();
      serializeLocalInput();
    };

    const onKeyUp = (event: KeyboardEvent) => {
      const changed = updateInput(event.code, false);
      if (!changed) {
        return;
      }

      event.preventDefault();
      serializeLocalInput();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [localPlayerIndex, onInputSerializedAction, playerId, playerName, roomId]);

  return (
    <div
      style={{
        display: "grid",
        gap: "0.75rem",
        justifyItems: "center",
        color: "#f4f4f4",
        fontFamily: "monospace",
      }}
    >
      <div style={{ fontSize: "0.95rem", color: "#ffcd75" }}>
        Room {roomId} | {playerName} ({isHost ? "Host" : "Guest"})
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{
          width: "100%",
          maxWidth: 800,
          aspectRatio: "4 / 3",
          border: "4px solid #29366f",
          background: "#1a1c2c",
          imageRendering: "pixelated",
        }}
      />
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
        <span>P1: WASD</span>
        <span>P2: Arrows</span>
        <button
          type="button"
          onClick={() => {
            engineRef.current?.reset();
            p1InputRef.current = createInitialInputState();
            p2InputRef.current = createInitialInputState();
            endedRef.current = false;
            setRestartVersion((value) => value + 1);
          }}
          style={{
            border: "2px solid #38b764",
            background: "#257179",
            color: "#f4f4f4",
            padding: "0.3rem 0.8rem",
            cursor: "pointer",
            fontFamily: "monospace",
          }}
        >
          Restart
        </button>
      </div>
    </div>
  );
}

export default RetroRaceGame;
