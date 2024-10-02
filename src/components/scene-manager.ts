import * as THREE from 'three';
import { 
    drawTemple, 
    drawTownLocations, 
    drawTownSquare,
    generateMesh, 
    generateWaterMesh,
    createFlowDiagram, 
    createWaterAccumulationField,
    createPath,
    drawDocks,
    drawTreesOnMap
} from '@/app/models';
import { ColorsConfig, TerrainLayersDisplayParams, LayerObject, World, GameEnvironmentLayers } from '@/types';
import { GameEnvironment } from '@/app/game-logic';


export class SceneManager {
    world: World;
    colorsConfig: ColorsConfig;
    env: GameEnvironment;

    layerConfig: {[flagName: string]: string};
    cachedLayers: {[layerName: string]: LayerObject} = {};

    dependencies: { [layerName: string]: string[] } = {
      terrainMesh: [],
      waterMesh: ['terrainMesh'],
      structures: ['terrainMesh'],
      roads: [],
      flares: ['terrainMesh'],
      waterAccumulation: [],
      treesGroups: ['terrainMesh'],
      arrows: [] // If necessary, add dependencies here
    };

    drawOrder: string[];

    constructor (renderer: THREE.WebGLRenderer, world: World, colorsConfig: ColorsConfig) {
        this.world = world;
        this.colorsConfig = colorsConfig;
        this.env = new GameEnvironment(renderer, this.colorsConfig);

        this.layerConfig = { 
            drawTerrain: "terrainMesh", 
            drawWater: "waterMesh", 
            drawStructures: "structures", 
            drawRoads: "roads", 
            showStructureFlares: "flares", 
            showFlowDirections: "arrows", 
            showWaterAccumulation: "waterAccumulation", 
            showTrees: "treesGroups",
        };


        function topologicalSort(dependencies: { [key: string]: string[] }): string[] {
          const inDegree: { [key: string]: number } = {};
          const adjList: { [key: string]: string[] } = {};
          const sorted: string[] = [];
          const queue: string[] = [];
      
          // Initialize in-degree and adjacency list
          for (const layer in dependencies) {
              inDegree[layer] = 0;
              adjList[layer] = [];
          }
      
          // Build the graph
          for (const [layer, deps] of Object.entries(dependencies)) {
              for (const dep of deps) {
                  adjList[dep].push(layer);
                  inDegree[layer]++;
              }
          }
      
          // Enqueue nodes with no dependencies (in-degree 0)
          for (const [layer, degree] of Object.entries(inDegree)) {
              if (degree === 0) {
                  queue.push(layer);
              }
          }
      
          // Process nodes
          while (queue.length > 0) {
              const current = queue.shift()!;
              sorted.push(current);
      
              for (const neighbor of adjList[current]) {
                  inDegree[neighbor]--;
                  if (inDegree[neighbor] === 0) {
                      queue.push(neighbor);
                  }
              }
          }
      
          // Check if there's a cycle
          if (sorted.length !== Object.keys(dependencies).length) {
              throw new Error("Cycle detected in dependencies, topological sort not possible");
          }
      
          return sorted;
      }

      // Get the sorted order of draw functions based on dependencies
      this.drawOrder = topologicalSort(this.dependencies);
      
      for (const layerName of this.drawOrder) {
        console.log("Regenerating ", layerName);
        const generatedLayer = this.drawFunctions[layerName]();

        if (!generatedLayer) continue;

        this.cachedLayers[layerName] = generatedLayer;

        console.log(generatedLayer);
      }
    }

    handleKeyDown (event: globalThis.KeyboardEvent) {
        this.env.handleKeyDown(event);
    }

    handleKeyUp (event: globalThis.KeyboardEvent) {
        this.env.handleKeyUp(event);
    }


    handleDisplayResize (width: number, height: number) {
        // Optionally, update the camera aspect ratio and projection matrix if needed
        this.env.camera.aspect = width / height;
        this.env.camera.updateProjectionMatrix();
    }

    drawFunctions : {[layerName: string]: (() => LayerObject | undefined)} = {
        terrainMesh: () => {
          const terrainMesh = generateMesh(this.world, this.colorsConfig);
          return terrainMesh;
        },
        waterMesh: () => {
          const waterMesh = generateWaterMesh(this.world.waterLevel, this.world.heightmap.length, this.colorsConfig);
          return waterMesh;
        },
        structures: () => {
          let deps: {[layerName: string]: LayerObject} = {};
          for (const dependentLayer of this.dependencies.structures) {
            if (!this.cachedLayers[dependentLayer]) return;
            deps[dependentLayer] = this.cachedLayers[dependentLayer]!;
          }
          const terrainMesh = deps["terrainMesh"] as THREE.Mesh;
          
          let structures: THREE.Mesh[] = [];
      
          if (this.world.temple) {
            const [platform, columns] = drawTemple(this.world.temple, this.world.heightmap, terrainMesh, 12);
            structures = structures.concat(platform);
            columns.forEach(column => structures = structures.concat(column));
          }
      
          if (this.world.docks) {
            const docksPlatform = drawDocks(this.world.docks, this.world.heightmap, terrainMesh);
            structures = structures.concat(docksPlatform);
          }
      
          const townSquarePlatform = drawTownSquare(this.world, terrainMesh);
          structures = structures.concat(townSquarePlatform);
          return structures;
        },
        roads: () => {
          let roads: THREE.Line[] = [];
      
          if (this.world.templePath) {
            roads = roads.concat(createPath(this.world.templePath!, this.world.heightmap));
          }
          if (this.world.docksPath) {
            roads = roads.concat(createPath(this.world.docksPath!, this.world.heightmap));
          }
      
          return roads;
        },
        flares: () => {
          let deps: {[layerName: string]: LayerObject} = {};
          for (const dependentLayer of this.dependencies.flares) {
            if (!this.cachedLayers[dependentLayer]) return;
            deps[dependentLayer] = this.cachedLayers[dependentLayer]!;
          }
          const terrainMesh = deps["terrainMesh"] as THREE.Mesh;

          const flares = drawTownLocations(this.world, terrainMesh);
          return flares;
        },
        waterAccumulation: () => {
          const waterAccumulation = createWaterAccumulationField(this.world.waterAccumulation, this.world.heightmap);
          return waterAccumulation;
        },
        treesGroups: () => {
          let deps: {[layerName: string]: LayerObject} = {};
          for (const dependentLayer of this.dependencies.treesGroups) {
            if (!this.cachedLayers[dependentLayer]) return;
            deps[dependentLayer] = this.cachedLayers[dependentLayer]!;
          }
          const terrainMesh = deps["terrainMesh"] as THREE.Mesh;

          const treesGroups = drawTreesOnMap(this.world.waterAccumulation, this.world.heightmap, this.world.waterLevel, terrainMesh);
          return treesGroups;
        },
        arrows: () => {
          const arrows = createFlowDiagram(this.world.flowDirections);
          return arrows;
        },
      };

      // When a display param gets turned back on, we need to repopulate the scene with the thing it's supposed to draw
      toggleLayer = (paramName: string, value: boolean) => {
        console.log(paramName);

        const layerName = this.layerConfig[paramName];

        console.log(layerName);

        if (!value) {
            this.env.removeLayer(layerName);
        } else {
            const drawTarget = this.cachedLayers[layerName];

            if (!drawTarget) return;
            
            this.env.setLayer(layerName, drawTarget);
            this.env.drawLayer(layerName);
        }        
      }

      resetScene (displayParams: TerrainLayersDisplayParams) {
        this.env.emptySceneBuffer();
        this.env.clock = new THREE.Clock();
        this.env.returnToOverview();
        
        let paramName: keyof TerrainLayersDisplayParams;
        for (paramName in displayParams) this.toggleLayer(paramName, displayParams[paramName]);
        
        this.env.resetLights();
      }
} 



  

  