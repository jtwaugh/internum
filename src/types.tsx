export type Point = { x: number, y: number };
export type HeightMap = number[][];
export type SlopeMap = (number | null)[][];
export type WaterAccumulationMap = number[][];
export type MapMask = boolean[][];

export interface World {
    heightmap: HeightMap;
    oceanTiles: MapMask;
    flowDirections: SlopeMap;
    waterAccumulation: WaterAccumulationMap;
    // Locations for generating the town
    townSquare: Point;
    // If the island is small enough, these structures won't generate
    temple: Point | null;
    docks: Point | null;
    templePath: Point[] | null,
    docksPath: Point[] | null
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
  erosionRate: number;
  erosionIterations: number;
}

export interface DisplayParams {
  drawTerrain: boolean;
  drawStructures: boolean;
  drawRoads: boolean;
  showStructureFlares: boolean;
  showFlowDirections: boolean;
  showWaterAccumulation: boolean;
  showTrees: boolean;
}

