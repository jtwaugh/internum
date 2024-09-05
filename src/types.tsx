export interface World {
    heightmap: number[][];
    flowDirections: (number | null)[][];
    waterAccumulation: number[][];
    // Locations for generating the town
    townSquare: { x: number; y: number };
    temple: { x: number; y: number };
    docks: { x: number; y: number };
  }

export interface ColorsConfig {
  terrainGradient: string[];
  ambientLight: string;
  directionalLight: string;
}

export interface WorldGenParams {
  noiseScale: number;
  canvasSize: number;
  threshold: number;
  maxDistanceFactor: number;
  blurIterations: number;
}

export interface DisplayParams {
  drawTerrain: boolean;
  drawStructures: boolean;
  showStructureFlares: boolean;
  showFlowDirections: boolean;
  showWaterAccumulation: boolean;
}