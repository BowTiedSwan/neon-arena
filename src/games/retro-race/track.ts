import type { Checkpoint, Track } from "./types";

const TRACK_WIDTH = 100;
const CENTER_X = 400;
const CENTER_Y = 300;
const OUTER_RADIUS_X = 320;
const OUTER_RADIUS_Y = 230;
const INNER_RADIUS_X = OUTER_RADIUS_X - TRACK_WIDTH;
const INNER_RADIUS_Y = OUTER_RADIUS_Y - TRACK_WIDTH;

const checkpoints: Checkpoint[] = [
  { index: 0, x: CENTER_X, y: CENTER_Y + ((OUTER_RADIUS_Y + INNER_RADIUS_Y) / 2), radius: 26 },
  { index: 1, x: CENTER_X + ((OUTER_RADIUS_X + INNER_RADIUS_X) / 2), y: CENTER_Y, radius: 26 },
  { index: 2, x: CENTER_X, y: CENTER_Y - ((OUTER_RADIUS_Y + INNER_RADIUS_Y) / 2), radius: 26 },
  { index: 3, x: CENTER_X - ((OUTER_RADIUS_X + INNER_RADIUS_X) / 2), y: CENTER_Y, radius: 26 },
];

export const retroRaceTrack: Track = {
  width: 800,
  height: 600,
  boundaries: [
    {
      x: CENTER_X,
      y: CENTER_Y,
      radiusX: OUTER_RADIUS_X,
      radiusY: OUTER_RADIUS_Y,
      kind: "outer",
    },
    {
      x: CENTER_X,
      y: CENTER_Y,
      radiusX: INNER_RADIUS_X,
      radiusY: INNER_RADIUS_Y,
      kind: "inner",
    },
  ],
  checkpoints,
  startPositions: [
    { x: CENTER_X - 26, y: CENTER_Y + ((OUTER_RADIUS_Y + INNER_RADIUS_Y) / 2), angle: -Math.PI / 2 },
    { x: CENTER_X + 26, y: CENTER_Y + ((OUTER_RADIUS_Y + INNER_RADIUS_Y) / 2), angle: -Math.PI / 2 },
  ],
};

function inEllipse(
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
): boolean {
  const normalizedX = (x - centerX) / radiusX;
  const normalizedY = (y - centerY) / radiusY;
  return (normalizedX * normalizedX) + (normalizedY * normalizedY) <= 1;
}

export function isOnTrack(x: number, y: number): boolean {
  const outer = retroRaceTrack.boundaries.find((boundary) => boundary.kind === "outer");
  const inner = retroRaceTrack.boundaries.find((boundary) => boundary.kind === "inner");

  if (!outer || !inner) {
    return false;
  }

  const insideOuter = inEllipse(x, y, outer.x, outer.y, outer.radiusX, outer.radiusY);
  const insideInner = inEllipse(x, y, inner.x, inner.y, inner.radiusX, inner.radiusY);

  return insideOuter && !insideInner;
}

export function getCheckpoint(index: number): Checkpoint {
  const safeIndex = ((index % checkpoints.length) + checkpoints.length) % checkpoints.length;
  return checkpoints[safeIndex];
}
