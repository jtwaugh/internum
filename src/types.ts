import * as THREE from "three";

export type Point = { x: number, y: number };
export type HeightMap = number[][];
export type SlopeMap = (number | null)[][];
export type WaterAccumulationMap = number[][];
export type MapMask = boolean[][];

export enum MobType {
  SHEEP
};

export interface MobProps {
  type: MobType;
  initialLocation: THREE.Vector3;
  initialState: string;
};

export interface World {
  heightmap: HeightMap; 
  waterLevel: number; // Hack
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
  waterColor: string;
}

export interface WorldGenParams {
  noiseScale: number;
  canvasSize: number;
  threshold: number;
  waterLevel: number;
  maxDistanceFactor: number;
  blurIterations: number;
  erosionRate: number;
  erosionIterations: number;
}

export interface TerrainLayersDisplayParams {
  drawTerrain: boolean;
  drawWater: boolean;
  drawStructures: boolean;
  drawRoads: boolean;
  showStructureFlares: boolean;
  showFlowDirections: boolean;
  showWaterAccumulation: boolean;
  showTrees: boolean;

  [key: string]: boolean;
}

export interface InputState {
  moveForward: boolean;
  moveBackward: boolean;
  moveLeft: boolean;
  moveRight: boolean;
  canJump: boolean;
}

export interface GameEnvironmentLighting {
  ambientLight: THREE.AmbientLight;
  directionalLight: THREE.DirectionalLight;
}

export interface GameEnvironmentLayers {
   terrainMesh: THREE.Mesh | null;
   waterMesh: THREE.Mesh | null;
   flares: (THREE.Mesh | null)[];
   structures: THREE.Mesh[];
   roads: THREE.Line[];
   arrows: THREE.Group | null;
   waterAccumulation: THREE.Group | null;
   treesGroups: THREE.Group[];

  [key: string]: THREE.Mesh | THREE.Line | THREE.Group | (THREE.Mesh | null)[] | THREE.Mesh[] | THREE.Line[] | THREE.Group[] | null;
}

export type LayerTogglesConfig = { [name: string]:  {condition: boolean, drawFn: Function, removeFn: Function} }
export type LayerType = THREE.Mesh | THREE.Line | THREE.Group;
export type LayerObject = LayerType | (LayerType | null)[];

export enum CameraMode {
  FreeFloat,
  Walking,
  FlyHack
}