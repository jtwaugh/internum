import * as THREE from 'three';

import { ColorsConfig, World, Point, HeightMap, WaterAccumulationMap } from '@/types';
import { getRandomLandTile, getRandomLandTilesInRadius } from '@/world-gen';
import * as Constants from '@/constants';

export const intersectPlane = (position: THREE.Vector3, planeMesh: THREE.Mesh): THREE.Intersection[] => {
  const down = new THREE.Vector3(0, 0, -1);
  const raycaster = new THREE.Raycaster();

  raycaster.set(position, down);

  // Check for intersections with the plane mesh
  const intersects = raycaster.intersectObject(planeMesh);

  // If no intersection is found, return null or some default value
  return intersects;
}

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
      world.heightmap[world.townSquare.x][(world.heightmap.length - world.townSquare.y)] * Constants.MESH_THICKNESS
    );

    let docksLine = null;
    if (world.docks) {
      const docksPosition = new THREE.Vector3(
        world.docks.x - geometry.parameters.width / 2,
        (world.heightmap.length - world.docks.y) - geometry.parameters.height / 2,
        world.heightmap[world.docks.x][(world.heightmap.length - world.docks.y)] * Constants.MESH_THICKNESS
      );

      const docksTop = new THREE.Vector3(
        docksPosition.x,
        docksPosition.y,
        docksPosition.z + 10
      );

      docksLine = createThickLine(docksPosition, docksTop, 0x00ffff);
    }

    let templeLine = null;
    if (world.temple) {
      const templePosition = new THREE.Vector3(
        world.temple.x - geometry.parameters.width / 2,
        (world.heightmap.length - world.temple.y) - geometry.parameters.height / 2,
        world.heightmap[world.temple.x][(world.heightmap.length - world.temple.y)] * Constants.MESH_THICKNESS
      );

      const templeTop = new THREE.Vector3(
        templePosition.x,
        templePosition.y,
        templePosition.z + 10
      );
  
      templeLine = createThickLine(templePosition, templeTop, 0xffff00);
    }

    
    const townSquareTop = new THREE.Vector3(
      townSquarePosition.x,
      townSquarePosition.y,
      townSquarePosition.z + 10
    );

    const townSquareLine = createThickLine(townSquarePosition, townSquareTop, 0xff00ff);
    
    return [townSquareLine, docksLine, templeLine];
  };

export const drawTemple = (templeCoords: Point, heightmap: HeightMap, mesh: THREE.Mesh, normalizer: number) : [a: THREE.Mesh, b: THREE.Mesh[]] => {
  const geometry = mesh.geometry as THREE.PlaneGeometry;
  const templePosition = new THREE.Vector3(
    templeCoords.x - geometry.parameters.width / 2,
    (heightmap.length - templeCoords.y) - geometry.parameters.height / 2,
    heightmap[templeCoords.x][templeCoords.y] * Constants.MESH_THICKNESS
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
      world.heightmap[world.townSquare.x][world.townSquare.y] * Constants.MESH_THICKNESS
    );

    const platformGeometry = new THREE.BoxGeometry(1.2, 1.2, 0.1);
    const platform = new THREE.Mesh(platformGeometry, marbleMaterial);
    platform.position.set(townSquarePosition.x, townSquarePosition.y, townSquarePosition.z); // Raise the platform above ground level

    return platform;
  }

  export const drawDocks = (docksCoords: Point, heightmap: HeightMap, mesh: THREE.Mesh) => {
    const geometry = mesh.geometry as THREE.PlaneGeometry;
    const marbleMaterial = new THREE.MeshStandardMaterial({ color: 0xfff0ee, roughness: 0.5, metalness: 0.1 });

    const docksPosition = new THREE.Vector3(
      docksCoords.x - geometry.parameters.width / 2,
      (heightmap.length - docksCoords.y) - geometry.parameters.height / 2,
      heightmap[docksCoords.x][docksCoords.y] * Constants.MESH_THICKNESS
    );

    const platformGeometry = new THREE.BoxGeometry(1.2, 1.2, 0.1);
    const platform = new THREE.Mesh(platformGeometry, marbleMaterial);
    platform.position.set(docksPosition.x, docksPosition.y, docksPosition.z); // Raise the platform above ground level

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
    if (world.heightmap[x][y] < 0.2) { // || world.waterAccumulation[x][y] / scaler > displayThreshold
      color = new THREE.Color(interpolateColor(colorsConfig.terrainGradient[0], colorsConfig.terrainGradient[1], world.heightmap[x][y] * (1 / 0.2)));
    } else if (world.heightmap[x][y] < 0.3) {
      color = new THREE.Color(interpolateColor(colorsConfig.terrainGradient[1], colorsConfig.terrainGradient[2], world.heightmap[x][y] * (1 / 0.3)));
    } else {
      color = new THREE.Color(interpolateColor(colorsConfig.terrainGradient[2], colorsConfig.terrainGradient[3], (world.heightmap[x][y] - 0.3) * (1 / 0.7)));
    }

    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,  // Use vertex colors from the geometry
    roughness: 0.8,      // High roughness for a matte look (values between 0 and 1)
    metalness: 0.0,      // Set to 0 for non-metallic surfaces like rock or grass
    flatShading: true,   // Optional, keeps the shading sharp between faces for a less smooth surface
  });

  const retMesh = new THREE.Mesh(geometry, material);

  return retMesh;
};

export const generateWaterMesh = (waterLevel: number, canvasSize: number, colorsConfig: ColorsConfig) => {
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
    geometry.attributes.position.setZ(i / 3, waterLevel * 10); // Adjust multiplier for height scaling

    // Water color
    let color = new THREE.Color(colorsConfig.waterColor);

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

export const createWaterAccumulationField = (waterAccumulation: WaterAccumulationMap, heightmap: HeightMap): THREE.Group => {
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
      hexMesh.position.set(x - gridSize / 2, (gridSize - y) - gridSize / 2, heightmap[x][y] * 10 + 0.5);

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
            const offset = Constants.DIRECTION_OFFSETS[flowDirection];
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

export const createPath = (points: Point[], heightmap: HeightMap) => {
  const geometry = new THREE.BufferGeometry();
  const gridSize = heightmap.length;

  let vertices = new Float32Array(points.length * 3);
  
  points.forEach((point, i) => {
    vertices[i * 3] = point.x - gridSize / 2;
    vertices[i * 3 + 1] = (gridSize - point.y) - gridSize / 2;
    vertices[i * 3 + 2] = 10 * heightmap[point.x][point.y] + 0.2;
  });

  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

  // Create the material
  const material = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });

  // Create the LineSegments object
  return new THREE.Line(geometry, material);
}

export const drawTree = (basePosition: THREE.Vector3, waterFraction: number) => {
  let ret = new THREE.Group();

  // Create the tree trunk
  const trunkGeometry = new THREE.CylinderGeometry(0.02 + 0.05 * waterFraction, 0.03 + 0.05 * waterFraction, 1.5, 6); // Cylinder (trunk) with a hexagonal base
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown color for the trunk
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.set(basePosition.x, basePosition.y, basePosition.z); // Raise the trunk above the ground
  trunk.rotation.x = -Math.PI / 2;
  ret.add(trunk);

  // Create the foliage (tree top) using cones
  const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 }); // Green color for the leaves

  const foliageGeometries = [
      new THREE.ConeGeometry(0.25 + 0.25 * waterFraction, 0.25 + 0.2 * waterFraction, 5), // Lower cone
      new THREE.ConeGeometry(0.2 + 0.2 * waterFraction, 0.25 + 0.2 * waterFraction, 5), // Middle cone
      new THREE.ConeGeometry(0.15 + 0.15 * waterFraction, 0.2 + 0.15 * waterFraction, 5) // Top cone
  ];

  const foliagePositions = [0.6 + 0.4 * waterFraction, 0.8 + 0.4 * waterFraction, 1.0 + 0.4 * waterFraction]; // Y-positions for the foliage

  foliageGeometries.forEach((geometry, index) => {
      const foliage = new THREE.Mesh(geometry, foliageMaterial);
      foliage.rotation.x = Math.PI / 2;
      foliage.position.set(basePosition.x, basePosition.y, basePosition.z + foliagePositions[index]); // Position each cone above the trunk
      ret.add(foliage);
  });

  return ret;
}

export const drawTreesOnMap = (waterAccumulation: WaterAccumulationMap, heightmap: HeightMap, waterLevel: number, mesh: THREE.Mesh): THREE.Group[] => {
  const size = heightmap.length;
  const SKY_HEIGHT = 9001;
  let ret: THREE.Group[] = [];

  let scaler = 0;
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) { 
      if (waterAccumulation[x][y] === null) continue;
      if (waterAccumulation[x][y] > scaler) scaler = waterAccumulation[x][y];
    }
  }

  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      if (heightmap[x][y] < waterLevel) continue;

      const waterFraction = Math.log(waterAccumulation[x][y] / scaler * (scaler - 1) + 1) / Math.log(scaler);

      if (waterFraction > 0.3) {
        const treeBaseX = Math.random() + x  - heightmap.length / 2;
        const treeBaseY = Math.random() + (heightmap.length - y) - heightmap.length / 2

        const groundCollision = intersectPlane(new THREE.Vector3(treeBaseX, treeBaseY, SKY_HEIGHT), mesh);

        if (groundCollision.length !== 1) continue;

        const treeBaseHeight = groundCollision[0].point.z;

        if (treeBaseHeight < waterLevel * 10) continue;

        ret = ret.concat(drawTree(new THREE.Vector3(treeBaseX, treeBaseY, treeBaseHeight), waterFraction));
      }
    }
  }

  return ret;
}

export const drawSheep = (basePosition: THREE.Vector3) => {
  const scale = 0.2;

  // Create the main icosahedron body
  const bodyMaterial = new THREE.MeshBasicMaterial({ color: Constants.DEFAULT_SHEEP_WHITE_COLOR, wireframe: false });
  const body = new THREE.Mesh(new THREE.IcosahedronGeometry(1 * scale, 0), bodyMaterial);
  body.position.set(basePosition.x, basePosition.y, basePosition.z + 0.8 * scale);

  const headMaterial = new THREE.MeshBasicMaterial({ color: Constants.DEFAULT_SHEEP_BLACK_COLOR, wireframe: false });
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5 * scale, 0), headMaterial);
  head.position.set(basePosition.x + 1 * scale, basePosition.y, basePosition.z + 1 * scale);

  // Function to create cylindrical legs
  const createLeg = (radiusTop: number, radiusBottom: number, height: number, radialSegments: number, color: string) => {
    const legGeometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments);
    const legMaterial = new THREE.MeshBasicMaterial({ color: color });
    const leg = new THREE.Mesh(legGeometry, legMaterial);
    leg.rotation.x = Math.PI / 2;
    return leg;
  }

  // Create four legs and position them relative to the icosahedron
  const leg1 = createLeg(0.2 * scale, 0.2 * scale, 0.75 * scale, 5, Constants.DEFAULT_SHEEP_BLACK_COLOR);
  const leg2 = createLeg(0.2 * scale, 0.2 * scale, 0.75* scale, 5, Constants.DEFAULT_SHEEP_BLACK_COLOR);
  const leg3 = createLeg(0.2 * scale, 0.2 * scale, 0.75* scale, 5, Constants.DEFAULT_SHEEP_BLACK_COLOR);
  const leg4 = createLeg(0.2 * scale, 0.2 * scale, 0.75* scale, 5, Constants.DEFAULT_SHEEP_BLACK_COLOR);

  // Position each leg around the icosahedron
  leg1.position.set(basePosition.x -0.5 * scale, basePosition.y - 0.3 * scale, basePosition.z);
  leg2.position.set(basePosition.x + 0.5 * scale, basePosition.y - 0.3 * scale, basePosition.z);
  leg3.position.set(basePosition.x -0.5 * scale, basePosition.y + 0.3 * scale, basePosition.z);
  leg4.position.set(basePosition.x + 0.5 * scale, basePosition.y + 0.3 * scale, basePosition.z);

  const appendages = [body, head, leg1, leg2, leg3, leg4];

  const sheep = new THREE.Group();

  appendages.forEach((appendage) => sheep.add(appendage));

  return sheep;
};


export const drawSheepOnMap = (heightmap: HeightMap, waterLevel: number, mesh: THREE.Mesh): THREE.Group[] => {
  const size = heightmap.length;
  const SKY_HEIGHT = 9001;
  let ret: THREE.Group[] = [];

  for (let flockNumber = 0; flockNumber < 10; flockNumber += 1) {
    const flockCenter = getRandomLandTile(heightmap, waterLevel);

    const flockSpawnPoints = getRandomLandTilesInRadius(heightmap, waterLevel, flockCenter, 5, 5);

    for (let i = 0; i < flockSpawnPoints.length; i += 1) {
      const tile = flockSpawnPoints[i];
      const sheepBaseX = Math.random() + tile.x  - heightmap.length / 2;
      const sheepBaseY = Math.random() + (heightmap.length - tile.y) - heightmap.length / 2

      const groundCollision = intersectPlane(new THREE.Vector3(sheepBaseX, sheepBaseY, SKY_HEIGHT), mesh);

      if (groundCollision.length !== 1) continue;

      const treeBaseHeight = groundCollision[0].point.z;

      if (treeBaseHeight < waterLevel * 10) continue;

      ret = ret.concat(drawSheep(new THREE.Vector3(sheepBaseX, sheepBaseY, treeBaseHeight)));

    }
    
  }

  return ret;
}