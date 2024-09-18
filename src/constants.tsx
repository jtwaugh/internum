export const TEMPLE_MIN_RADIUS = 5;
export const TEMPLE_MAX_RADIUS = 10;

export const MESH_THICKNESS = 10;

export const DEFAULT_GRADIENT = ["#0000ff", "#aaff00", "#00ff00", "#ffffff"];

export const DEFAULT_AMBIENT_LIGHT_COLOR = "#ffffff";
export const DEFAULT_DIRECTIONAL_LIGHT_COLOR = "#ffffff";

export const DEFAULT_NOISE_SCALE = 0.1;
export const DEFAULT_CANVAS_SIZE = 400;
export const DEFAULT_THRESHOLD = 0.5;
export const DEFAULT_MAX_DISTANCE_FACTOR = 1;
export const DEFAULT_BLUR_ITERATIONS = 1;
export const DEFAULT_EROSION_RATE = 0.5;
export const DEFAULT_EROSION_ITERATIONS = 2;

export const DEFAULT_FOV = 75;
export const DEFAULT_ASPECT = 1.5;
export const DEFAULT_NEAR = 0.1;
export const DEFAULT_FAR = 1000;

// 1   2   3
//   ↖ ↑ ↗
// 8 ←   → 4
//   ↙ ↓ ↘
// 7   6   5
export const DIRECTION_OFFSETS = [
    [-1, -1], [0, -1], [1, -1],  // 1, 2, 3 (top row)
    [1, 0], [1, 1], [0, 1],     // 4, 5, 6 (right side and bottom row)
    [-1, 1], [-1, 0]            // 7, 8 (left side)
  ];