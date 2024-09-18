import { Point, HeightMap, MapMask } from "./types";

class PriorityQueue<T> {
  private elements: { item: T, priority: number }[] = [];

  isEmpty(): boolean {
    return this.elements.length === 0;
  }

  put(item: T, priority: number): void {
    this.elements.push({ item, priority });
    this.elements.sort((a, b) => a.priority - b.priority); // Sort by priority (lower first)
  }

  get(): T {
    return this.elements.shift()?.item as T; // Return item with the lowest priority
  }
}


// Pathfind to the nearest ocean tile using a boolean array of ocean tiles
export function pathfindToOcean(
    start: Point,
    oceanMap: MapMask,
    heightmap: HeightMap,
    maxSlope: number
  ): Point[] | null {
    const openList = new PriorityQueue<Point>();
    openList.put(start, 0);
  
    const cameFrom: Map<string, Point | null> = new Map();
    const costSoFar: Map<string, number> = new Map();
  
    const startKey = pointToString(start);
    cameFrom.set(startKey, null);
    costSoFar.set(startKey, 0);
  
    while (!openList.isEmpty()) {
      const current = openList.get();
  
      // Check if the current tile is an ocean tile
      if (heightmap[current.x][current.y] < 0.0001) {
        console.log(current, " is an ocean tile");
        return reconstructPath(cameFrom, start, current);
      }
  
      const neighbors = getNeighbors(current, heightmap);
  
      for (const neighbor of neighbors) {
        const d_xy = euclideanDistance(current, neighbor);
        const d_z = heightmap[neighbor.y][neighbor.x] - heightmap[current.y][current.x];
        const slope = Math.abs(d_z / d_xy);
  
        // Skip neighbors that exceed the max slope or are non-walkable
        //if (Math.abs(slope) > maxSlope || heightmap[neighbor.y][neighbor.x] < 0.0001) continue;
  
        const newCost = (costSoFar.get(pointToString(current)) || 0) + movementCost(current, neighbor, heightmap);
  
        const neighborKey = pointToString(neighbor);
        if (!costSoFar.has(neighborKey) || newCost < (costSoFar.get(neighborKey) || Infinity)) {
          costSoFar.set(neighborKey, newCost);
          const priority = newCost + closestOceanHeuristic(neighbor, oceanMap);
          openList.put(neighbor, priority);
          cameFrom.set(neighborKey, current);
        }
      }
    }
  
    return null; // No path found
  }

// Heuristic to calculate the distance to the nearest ocean tile
function closestOceanHeuristic(point: Point, oceanMap: boolean[][]): number {
    let minDistance = Infinity;
    for (let y = 0; y < oceanMap.length; y++) {
      for (let x = 0; x < oceanMap[0].length; x++) {
        if (oceanMap[y][x]) {
          const distance = euclideanDistance(point, { x, y });
          if (distance < minDistance) {
            minDistance = distance;
          }
        }
      }
    }
    return minDistance;
  }

export function aStarWithSlopeConstraint(
  start: Point,
  goal: Point,
  heightmap: HeightMap,
  maxSlope: number
): Point[] | null {
  const openList = new PriorityQueue<Point>();
  openList.put(start, 0);

  const cameFrom: Map<string, Point | null> = new Map();
  const costSoFar: Map<string, number> = new Map();

  const startKey = pointToString(start);
  const goalKey = pointToString(goal);

  cameFrom.set(startKey, null);
  costSoFar.set(startKey, 0);

  while (!openList.isEmpty()) {
    const current = openList.get();

    if (pointEquals(current, goal)) {
      return reconstructPath(cameFrom, start, goal);
    }

    const neighbors = getNeighbors(current, heightmap);

    for (const neighbor of neighbors) {
      const d_xy = euclideanDistance(current, neighbor);
      const d_z = heightmap[neighbor.y][neighbor.x] - heightmap[current.y][current.x];
      const slope = Math.abs(d_z / d_xy);

      if (Math.abs(slope) > maxSlope) continue; // Skip neighbors with too steep a slope

      if (heightmap[neighbor.y][neighbor.x] < 0.0001) {
        console.log("Neighbor ", neighbor, " is a sea tile; can't place road");
      }

      const newCost = (costSoFar.get(pointToString(current)) || 0) + movementCost(current, neighbor, heightmap);

      const neighborKey = pointToString(neighbor);
      if (!costSoFar.has(neighborKey) || newCost < (costSoFar.get(neighborKey) || Infinity)) {
        costSoFar.set(neighborKey, newCost);
        const priority = newCost + heuristic(neighbor, goal);
        openList.put(neighbor, priority);
        cameFrom.set(neighborKey, current);
      }
    }
  }

  return null; // No path found
}

function getNeighbors(point: Point, heightmap: HeightMap): Point[] {
  const neighbors: Point[] = [];
  const { x, y } = point;

  const directions = [
    { x: 0, y: 1 },  { x: 1, y: 0 },
    { x: 0, y: -1 }, { x: -1, y: 0 },
    { x: 1, y: 1 },  { x: 1, y: -1 },
    { x: -1, y: 1 }, { x: -1, y: -1 },
  ];

  for (const dir of directions) {
    const newX = x + dir.x;
    const newY = y + dir.y;

    if (newX >= 0 && newY >= 0 && newX < heightmap[0].length && newY < heightmap.length) {
      neighbors.push({ x: newX, y: newY });
    }
  }

  return neighbors;
}

function movementCost(current: Point, neighbor: Point, heightmap: HeightMap): number {
  const d_xy = euclideanDistance(current, neighbor);
  const d_z = heightmap[neighbor.y][neighbor.x] - heightmap[current.y][current.x];
  return d_xy + Math.abs(d_z); // You can adjust this based on your cost model
}

function heuristic(point: Point, goal: Point): number {
  return euclideanDistance(point, goal);
}

function euclideanDistance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function pointEquals(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

function pointToString(point: Point): string {
  return `${point.x},${point.y}`;
}

function reconstructPath(cameFrom: Map<string, Point | null>, start: Point, goal: Point): Point[] {
  let current: Point | null = goal;
  const path: Point[] = [];

  while (current && !pointEquals(current, start)) {
    path.push(current);
    current = cameFrom.get(pointToString(current)) || null;
  }

  path.push(start); // Add the start point
  const ret = path.reverse(); // Reverse the path to get it from start to goal
  console.log(ret);
  return ret;
}