import * as THREE from 'three';

import { ColorsConfig, World } from '@/types';
import { MESH_THICKNESS, DIRECTION_OFFSETS } from '@/constants';


const createThickLine = (start: THREE.Vector3, end: THREE.Vector3, color: number): THREE.Mesh => {
    const height = start.distanceTo(end);
    const geometry = new THREE.CylinderGeometry(0.5, 0.5, height, 32); // Adjust the radius for thickness
    const material = new THREE.MeshBasicMaterial({ color });
    const cylinder = new THREE.Mesh(geometry, material);
  
    // Position the cylinder between start and end
    const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    cylinder.position.copy(midpoint);
  
    // Orient the cylinder to align with the start and end points
    const direction = new THREE.Vector3().subVectors(end, start).normalize();
    const axis = new THREE.Vector3(0, 1, 0).cross(direction).normalize();
    const angle = Math.acos(new THREE.Vector3(0, 1, 0).dot(direction));
    cylinder.quaternion.setFromAxisAngle(axis, angle);
  
    return cylinder;
  };

export const drawTownLocations = (world: World, mesh: THREE.Mesh) => {
    const geometry = mesh.geometry as THREE.PlaneGeometry;
    const townSquarePosition = new THREE.Vector3(
      world.townSquare.x - geometry.parameters.width / 2,
      (world.heightmap.length - world.townSquare.y) - geometry.parameters.height / 2,
      world.heightmap[world.townSquare.x][(world.heightmap.length - world.townSquare.y)] * MESH_THICKNESS
    );

    const docksPosition = new THREE.Vector3(
      world.docks.x - geometry.parameters.width / 2,
      (world.heightmap.length - world.docks.y) - geometry.parameters.height / 2,
      world.heightmap[world.docks.x][(world.heightmap.length - world.docks.y)] * MESH_THICKNESS
    );

    const templePosition = new THREE.Vector3(
      world.temple.x - geometry.parameters.width / 2,
      (world.heightmap.length - world.temple.y) - geometry.parameters.height / 2,
      world.heightmap[world.temple.x][(world.heightmap.length - world.temple.y)] * MESH_THICKNESS
    );

    const townSquareTop = new THREE.Vector3(
      townSquarePosition.x,
      townSquarePosition.y,
      townSquarePosition.z + 10
    );

    const docksTop = new THREE.Vector3(
      docksPosition.x,
      docksPosition.y,
      docksPosition.z + 10
    );

    const templeTop = new THREE.Vector3(
      templePosition.x,
      templePosition.y,
      templePosition.z + 10
    );

    const townSquareLine = createThickLine(townSquarePosition, townSquareTop, 0xff00ff);
    const docksLine = createThickLine(docksPosition, docksTop, 0x00ffff);
    const templeLine = createThickLine(templePosition, templeTop, 0xffff00);
    
    return [townSquareLine, docksLine, templeLine];
  };

export const drawTemple = (world: World, mesh: THREE.Mesh, normalizer: number) : [a: THREE.Mesh, b: THREE.Mesh[]] => {
    const geometry = mesh.geometry as THREE.PlaneGeometry;
    const templePosition = new THREE.Vector3(
      world.temple.x - geometry.parameters.width / 2,
      (world.heightmap.length - world.temple.y) - geometry.parameters.height / 2,
      world.heightmap[world.temple.x][world.temple.y] * MESH_THICKNESS
    );

    const marbleMaterial = new THREE.MeshStandardMaterial({ color: 0xfff0ee, roughness: 0.5, metalness: 0.1 });

    // Create the Platform (elevated box)
    const platformGeometry = new THREE.CylinderGeometry(15 / normalizer, 13 / normalizer, 2 / normalizer, 32);
    const platform = new THREE.Mesh(platformGeometry, marbleMaterial);
    platform.position.set(templePosition.x, templePosition.y, templePosition.z);
    platform.rotation.x = -Math.PI / 2;

    // Create a Column
    const columnGeometry = new THREE.CylinderGeometry(0.5 / normalizer, 0.5 / normalizer, 10 / normalizer, 32);

    // Position Columns around the Platform
    const columnCount = 12; // Number of columns
    const radius = 12 / normalizer; // Radius from the center to place the columns

    let columns: THREE.Mesh[] = [];
    for (let i = 0; i < columnCount; i++) {
        const angle = (i / columnCount) * 2 * Math.PI;
        const x = radius * Math.cos(angle) + templePosition.x;
        const y = radius * Math.sin(angle) + templePosition.y;

        const column = new THREE.Mesh(columnGeometry, marbleMaterial);
        column.position.set(x, y, templePosition.z + 5 / normalizer); // 5 is half the height of the column
        column.rotation.x = -Math.PI / 2;
        columns = columns.concat(column);
    }

    return [platform, columns];
  }

 export const drawTownSquare = (world: World, mesh: THREE.Mesh) => {
    const geometry = mesh.geometry as THREE.PlaneGeometry;
    const marbleMaterial = new THREE.MeshStandardMaterial({ color: 0xfff0ee, roughness: 0.5, metalness: 0.1 });

    const townSquarePosition = new THREE.Vector3(
      world.townSquare.x - geometry.parameters.width / 2,
      (world.heightmap.length - world.townSquare.y) - geometry.parameters.height / 2,
      world.heightmap[world.townSquare.x][world.townSquare.y] * MESH_THICKNESS
    );

    const platformGeometry = new THREE.BoxGeometry(1.2, 1.2, 0.1);
    const platform = new THREE.Mesh(platformGeometry, marbleMaterial);
    platform.position.set(townSquarePosition.x, townSquarePosition.y, townSquarePosition.z); // Raise the platform above ground level

    return platform;
  }

  const interpolateColor = (color1: string, color2: string, factor: number): string => {
    // Clamp factor between 0 and 1
    factor = Math.min(Math.max(factor, 0), 1);

    // Parse the colors into their RGB components
    const c1 = parseInt(color1.substring(1), 16);
    const c2 = parseInt(color2.substring(1), 16);

    const r1 = (c1 >> 16) & 0xff;
    const g1 = (c1 >> 8) & 0xff;
    const b1 = c1 & 0xff;

    const r2 = (c2 >> 16) & 0xff;
    const g2 = (c2 >> 8) & 0xff;
    const b2 = c2 & 0xff;

    // Interpolate each color component
    const r = Math.round(r1 + factor * (r2 - r1));
    const g = Math.round(g1 + factor * (g2 - g1));
    const b = Math.round(b1 + factor * (b2 - b1));

    // Convert the interpolated RGB values back to a hex string
    const rgb = (r << 16) | (g << 8) | b;
    return `#${rgb.toString(16).padStart(6, '0')}`;
}

export const generateMesh = (world: World, colorsConfig: ColorsConfig) => {
  const canvasSize = world.heightmap.length;

  const geometry = new THREE.PlaneGeometry(
    canvasSize,
    canvasSize,
    canvasSize - 1,
    canvasSize - 1
  );

  let colors = [];

  for (let i = 0; i < geometry.attributes.position.array.length; i += 3) {
    const x = Math.floor((i / 3) % canvasSize);
    const y = Math.floor(i / 3 / canvasSize);

    // Set the Z value (height) from the heightmap
    geometry.attributes.position.setZ(i / 3, world.heightmap[x][y] * 10); // Adjust multiplier for height scaling

    let color;
    if (world.heightmap[x][y] < 0.001) {
      color = new THREE.Color(colorsConfig.terrainGradient[0]);
    } else if (world.heightmap[x][y] < 0.5) {
      color = new THREE.Color(interpolateColor(colorsConfig.terrainGradient[1], colorsConfig.terrainGradient[2], world.heightmap[x][y] * 2));
    } else {
      color = new THREE.Color(interpolateColor(colorsConfig.terrainGradient[2], colorsConfig.terrainGradient[3], (world.heightmap[x][y] - 0.5) * 2));
    }

    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const material = new THREE.MeshLambertMaterial({
    vertexColors: true,
    flatShading: true,
  });

  const retMesh = new THREE.Mesh(geometry, material);

  return retMesh;
};

export const createWaterAccumulationField = (waterAccumulation: number[][]): THREE.Group => {
  const gridSize = waterAccumulation.length;
  const color = new THREE.Color(0x2222dd); // Same color for all particles (green)

  const hexagons = new THREE.Group();

  const displayThreshold = 0.05;

  let scaler = 0;
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) { 
      if (waterAccumulation[x][y] === null) continue;
      if (waterAccumulation[x][y] > scaler) scaler = waterAccumulation[x][y];
    }
  }

  // Create particles in a grid
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      if (waterAccumulation[x][y] === null) continue;
      const scaledWaterAccumulation = waterAccumulation[x][y] / scaler;
      if (scaledWaterAccumulation < displayThreshold) continue;
      // Create hexagonal geometry (6 segments = hexagon)
      const hexGeometry = new THREE.CircleGeometry(scaledWaterAccumulation, 4);

      // Create material with transparency
      const hexMaterial = new THREE.MeshBasicMaterial({
        color: color,
      });

      // Create hexagon mesh
      const hexMesh = new THREE.Mesh(hexGeometry, hexMaterial);

      // Position the hexagon in a grid
      hexMesh.position.set(x - gridSize / 2, (gridSize - y) - gridSize / 2, 10);

      hexagons.add(hexMesh);
    }
  }
  
  return hexagons;
}

export const createFlowDiagram = (flowDirections: (number | null)[][]): THREE.Group => {
  const gridSize = flowDirections.length;
  const arrowGroup = new THREE.Group();

  for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
          const flowDirection = flowDirections[i][j];
          if (!(flowDirection === null)) {
            const offset = DIRECTION_OFFSETS[flowDirection];
            // Convert the angle in radians to a direction vector
            const arrowDir = new THREE.Vector3(offset[0], -offset[1], 0).normalize();
            // Create the ArrowHelper with the direction vector
            const arrowHelper = new THREE.ArrowHelper(arrowDir, new THREE.Vector3(i - gridSize / 2, (gridSize - j) - gridSize / 2, 12), 1, 0xaaaaff, 0.2, 0.2);
            arrowGroup.add(arrowHelper);
          }
      }
  }

  //console.log(arrowGroup);

  return arrowGroup;
}