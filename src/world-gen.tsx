import { DIRECTION_OFFSETS } from "./constants";
import { WorldGenParams } from "./types";
import p5 from 'p5';

const generateHeightmap = (p: p5, params: WorldGenParams): number[][] => {
  const heightmap: number[][] = [];
  const centerX = params.canvasSize / 2;
  const centerY = params.canvasSize / 2;
  const maxDistance = p.dist(0, 0, centerX, centerY) * params.maxDistanceFactor;

  for (let x = 0; x < params.canvasSize; x++) {
    heightmap[x] = [];
    for (let y = 0; y < params.canvasSize; y++) {
      let noiseVal = p.noise(x * params.noiseScale, y * params.noiseScale);
      let distance = p.dist(x, y, centerX, centerY);
      let normalizedDistance = distance / maxDistance;

      let islandShape = noiseVal - normalizedDistance;
      islandShape = p.constrain(islandShape, 0, 1);

      heightmap[x][y] = islandShape < params.threshold ? 0 : islandShape;
    }
  }

  return heightmap;
};

const generateGaussianKernel = (radius: number, sigma: number): number[][] => {
  const kernelSize = 2 * radius + 1;
  const kernel: number[][] = Array(kernelSize).fill(null).map(() => Array(kernelSize).fill(0));
  const sigma2 = sigma * sigma;
  const piSigma = Math.PI * sigma2;
  const normalizationFactor = 1 / (2 * piSigma);

  let sum = 0;

  for (let x = -radius; x <= radius; x++) {
    for (let y = -radius; y <= radius; y++) {
      const exponent = -(x * x + y * y) / (2 * sigma2);
      const value = normalizationFactor * Math.exp(exponent);
      kernel[x + radius][y + radius] = value;
      sum += value;
    }
  }

  // Normalize the kernel so that the sum of all elements is 1
  for (let x = 0; x < kernelSize; x++) {
    for (let y = 0; y < kernelSize; y++) {
      kernel[x][y] /= sum;
    }
  }

  return kernel;
};

  const applyGaussianBlur = (heightmap: number[][], radius: number, sigma: number): number[][] => {
    const kernel = generateGaussianKernel(radius, sigma);

    const blurredHeightmap = heightmap.map(arr => [...arr]); // Deep copy of heightmap
    const size = heightmap.length;
  
    for (let x = radius; x < size - radius; x++) {
      for (let y = radius; y < size - radius; y++) {
        let sum = 0;
  
        for (let kx = -radius; kx <= radius; kx++) {
          for (let ky = -radius; ky <= radius; ky++) {
            const weight = kernel[kx + radius][ky + radius];
            sum += heightmap[x + kx][y + ky] * weight;
          }
        }
  
        blurredHeightmap[x][y] = sum;
      }
    }
  
    return blurredHeightmap;
  };

const blurHeightmap = (heightmap: number[][], params: WorldGenParams): number[][] => {
  let oldHeightmap = heightmap;
  let newHeightmap = heightmap;

  for (let i = 0; i < params.blurIterations; i++) {
    newHeightmap = oldHeightmap.map(arr => [...arr]); // Deep copy of heightmap

    for (let x = 1; x < params.canvasSize - 1; x++) {
      for (let y = 1; y < params.canvasSize - 1; y++) {
        // Average the current cell's value with its 8 neighbors
        newHeightmap[x][y] = (
          oldHeightmap[x][y] * 3 +
          oldHeightmap[x - 1][y] +
          oldHeightmap[x + 1][y] +
          oldHeightmap[x][y - 1] +
          oldHeightmap[x][y + 1] +
          oldHeightmap[x - 1][y - 1] +
          oldHeightmap[x - 1][y + 1] +
          oldHeightmap[x + 1][y - 1] +
          oldHeightmap[x + 1][y + 1]
        ) / 11;
        // console.log(heightmap[x][y], " -> ", blurredHeightmap[x][y]);
      }
    }
    oldHeightmap = newHeightmap
  }

  return newHeightmap;
};

const floodFillOcean = (heightmap: number[][], params: WorldGenParams): boolean[][] => {
  const size = params.canvasSize;
  const ocean = Array(size).fill(null).map(() => Array(size).fill(false));
  const queue = [{ x: size - 1, y: 0 }]; // Start from the top-right corner

  while (queue.length > 0) {
    const { x, y } = queue.shift()!;
    if (ocean[x][y] || heightmap[x][y] > 0.001) continue;

    ocean[x][y] = true;

    // Check the 4-connected neighbors (up, down, left, right)
    const neighbors = [
      { x: x - 1, y }, { x: x + 1, y },
      { x, y: y - 1 }, { x, y: y + 1 }
    ];

    for (const neighbor of neighbors) {
      if (neighbor.x >= 0 && neighbor.x < size && neighbor.y >= 0 && neighbor.y < size) {
        queue.push(neighbor);
      }
    }
  }

  return ocean;
};

// Section for town generation

const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const getRandomLandTile = (heightmap: number[][], params: WorldGenParams): { x: number; y: number } => {
  const size = heightmap.length;
  const landTiles: Array<{ x: number; y: number }> = [];

  // Gather all land tiles (tiles that are not underwater)
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      if (heightmap[x][y] > params.threshold) {
        landTiles.push({ x, y });
      }
    }
  }

  // If there are no land tiles, return null or handle the edge case
  if (landTiles.length === 0) {
    throw new Error("No land tiles available to place the town square.");
  }

  // Pick a random land tile
  const randomIndex = getRandomInt(0, landTiles.length - 1);

  const townSquareTile = landTiles[randomIndex];

  return townSquareTile;
};

export const findHighestPoint = (heightmap: number[][], center: { x: number; y: number }, minRadius: number, maxRadius: number): { x: number; y: number } => {
  const size = heightmap.length;
  let highestPoint = center;
  let maxHeight = heightmap[center.x][center.y];

  for (let dx = -maxRadius; dx <= maxRadius; dx++) {
    if (dx > -minRadius && dx < minRadius) continue;
    for (let dy = -maxRadius; dy <= maxRadius; dy++) {
      if (dy > -minRadius && dy < minRadius) continue;
      const x = center.x + dx;
      const y = center.y + dy;
      if (x >= 0 && y >= 0 && x < size && y < size) {
        if (heightmap[x][y] > maxHeight) {
          maxHeight = heightmap[x][y];
          highestPoint = { x, y };
        }
      }
    }
  }

  return highestPoint;
};

export const findClosestWaterBorder = (heightmap: number[][], center: { x: number; y: number }, params: WorldGenParams): { x: number; y: number } => {
  const oceanTiles = floodFillOcean(heightmap, params);
  
  const size = heightmap.length;
  let closestPoint = null;
  let minDistance = Infinity;

  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      if (oceanTiles[x][y]) {
        const distance = Math.abs(x - center.x) + Math.abs(y - center.y); // Manhattan distance
        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = { x, y };
        }
      }
    }
  }

  return closestPoint!;
};

export const generateWorldTerrain = (params: WorldGenParams): number[][] => {
  const p5Instance = new p5((p: p5) => {});

  const heightmap = generateHeightmap(p5Instance, params);
  return blurHeightmap(heightmap, params);
}

// 1   2   3
//   ↖ ↑ ↗
// 8 ←   → 4
//   ↙ ↓ ↘
// 7   6   5
export const computeFlowDirection = (heightmap: number[][]): (number | null)[][] => {
  // New params
  const slopeTolerance = 0.000001;
  
  const isLand = (num: number) => {return num > 0.0001}
  
  const height = heightmap.length;
  const width = heightmap[0].length;
  const flowDirection: (number | null)[][] = Array.from({ length: height }, () => Array(width).fill(null));

  for (let x = 0; x < height; x++) {
    for (let y = 0; y < width; y++) {
      if (!isLand(heightmap[x][y])) continue; // Skip non-land tiles

      let maxSlope = -Infinity;
      let bestDirectionIndex: number | null = null;


      // Check all 8 neighboring directions
      for (let i = 0; i < DIRECTION_OFFSETS.length; i++) {
        const [dx, dy] = DIRECTION_OFFSETS[i];
        const nx = x + dx;
        const ny = y + dy;

        // Ensure neighbor is within bounds
        if (nx >= 0 && nx < height && ny >= 0 && ny < width) {
          // Prioritize going into the sea
          const slope = (heightmap[nx][ny] > 0.0001 ? heightmap[x][y] - heightmap[nx][ny] : 1);
          console.log("Slope from (", x, ", ", y, ") to (", nx, ", ", ny, "): ", slope);


          if (slope > maxSlope) {
            //console.log("Slope ", slope, " is steeper than the max ", maxSlope);
            maxSlope = slope;
            bestDirectionIndex = i; // Direction index from 1 to 8
            //console.log("Best direction is ", bestDirectionIndex);
          }
          else {
            console.log("Slope ", slope, " is not steeper the max ", maxSlope);
          }
        }
      }

      if (!(bestDirectionIndex === null)) {
        const [finalDx, finalDy] = DIRECTION_OFFSETS[bestDirectionIndex];

        console.log("Best direction is ", bestDirectionIndex," i.e. water will flow from (", x, ", ", y, ") to (", x + finalDx, ", ", y + finalDy, ")");

        if (heightmap[x + finalDx][y + finalDy] > heightmap[x][y]) {
          console.error("BIG ERROR");
         }
        //console.log("Max slope is ", maxSlope, " in direction ", bestDirectionIndex);
        if (maxSlope < slopeTolerance) {
          // We found a basin
          console.log("Basin!")
          flowDirection[x][y] = null;
        } else {
          console.log("Winner! ", bestDirectionIndex);
          flowDirection[x][y] = bestDirectionIndex;
        }
      }

      if (heightmap[x][y] > 0.0001 && (flowDirection[x][y] === null)) {
        //console.log("Fail at ", x, ", ", y);
        //console.log("Best index is ", bestDirectionIndex);
        //console.log("Flow direction is ", flowDirection[x][y]);
      }
       
    }
  }
  return flowDirection;
}

export const accumulateWater = (flowDirection: (number | null)[][], heightmap: number[][]): number[][] => {
  const height = flowDirection.length;
  const width = flowDirection[0].length;
  
  // Initialize water accumulation map
  const waterAccumulation: number[][] = Array.from({ length: height }, () => Array(width).fill(0));

  for (let x = 0; x < height; x++) {
    for (let y = 0; y < width; y++) {
      if (flowDirection[x][y] === null) continue;
      
      let currentX = x;
      let currentY = y;

      while (true) {
        const direction = flowDirection[currentX][currentY];

        if (direction === null) {
          break;
        }

        // Get the neighbor offset for the flow direction
        const [dx, dy] = DIRECTION_OFFSETS[direction]; // Direction index is 1-8, adjust to 0-based
        
        const nextX = currentX + dx;
        const nextY = currentY + dy;

        console.log("Direction from (", currentX, ", ", currentY, ") is ", direction, " i.e. water will flow to (", nextX, ", ", nextY, ")");

        // Check bounds to ensure we're within the grid
        if (nextX < 0 || nextX >= height || nextY < 0 || nextY >= width) {
          break; // Flow goes out of bounds
        }

        if (heightmap[nextX][nextY] > heightmap[currentX][currentY]) {
          console.error("BIG ERROR");
         }

        // Accumulate water in the next cell
        waterAccumulation[nextX][nextY] += 1;

        console.log("Starting from rainfall on cell (", x, ", ", y, ") accumulated 1 water unit from cell (", currentX, ", ", currentY, ") (height ", heightmap[currentX][currentY], ") to cell (", nextX, ", ", nextY, ") (height ", heightmap[nextX][nextY], ")");

        // Move to the next cell
        currentX = nextX;
        currentY = nextY;        
      }
    }
  }

  console.log(waterAccumulation);

  return waterAccumulation;
};
