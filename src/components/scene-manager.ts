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
    drawTreesOnMap,
    drawSheep,
    drawSheepOnMap
} from '@/app/models';
import { ColorsConfig, DisplayParams, LayerObject, World } from '@/types';
import { GameEnvironment } from '@/app/game-logic';


export class SceneManager {
    world: World;
    colorsConfig: ColorsConfig;
    env: GameEnvironment;
    layerConfig: {[flagName: string]: string};

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
            showMobs: "mobs" 
        };
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
          if (!this.env.layers.terrainMesh) return;
          const terrainMesh = this.env.layers.terrainMesh!;
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
          if (!this.env.layers.terrainMesh) return;
          const terrainMesh = this.env.layers.terrainMesh!;
          const flares = drawTownLocations(this.world, terrainMesh);
          return flares;
        },
        waterAccumulation: () => {
          const waterAccumulation = createWaterAccumulationField(this.world.waterAccumulation, this.world.heightmap);
          return waterAccumulation;
        },
        treesGroups: () => {
          if (!this.env.layers.terrainMesh) return;
          const terrainMesh = this.env.layers.terrainMesh!;
          const treesGroups = drawTreesOnMap(this.world.waterAccumulation, this.world.heightmap, this.world.waterLevel, terrainMesh);
          return treesGroups;
        },
        arrows: () => {
          const arrows = createFlowDiagram(this.world.flowDirections);
          return arrows;
        },
        mobs: () => {
            const terrainMesh = this.env.layers.terrainMesh!;
            const sheep = drawSheepOnMap(this.world.heightmap, this.world.waterLevel, terrainMesh);
            return sheep;
          }
      };

      // When a display param gets turned back on, we need to repopulate the scene with the thing it's supposed to draw
      toggleLayer = (paramName: string, value: boolean) => {
        console.log(paramName);

        const layerName = this.layerConfig[paramName];

        console.log(layerName);

        if (!value) {
            this.env.removeLayer(layerName);
        } else {
            const drawTarget = this.drawFunctions[layerName]();

            if (!drawTarget) return;
            
            this.env.setLayer(layerName, drawTarget);
            this.env.drawLayer(layerName);
        }        
      }

      resetScene (displayParams: DisplayParams) {
        this.env.emptySceneBuffer();
        this.env.clock = new THREE.Clock();
        this.env.returnToOverview();
        
        let paramName: keyof DisplayParams;
        for (paramName in displayParams) this.toggleLayer(paramName, displayParams[paramName]);
        
        this.env.resetLights();
      }
} 



  

  