export interface World {
    heightmap: number[][];
    // Locations for generating the town
    townSquare: { x: number; y: number };
    temple: { x: number; y: number };
    docks: { x: number; y: number };
  }