"use client"

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

import { Button } from './ui/button';

import { ColorsConfig, DisplayParams, World } from '@/types';
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

import { GameEnvironment, LayerObject } from '@/app/game-logic';

type LayerTogglesConfig = { [name: string]:  {condition: boolean, drawFn: Function, removeFn: Function} }

export interface ThreeSceneProps {
  world: World | null;
  colorsConfig: ColorsConfig;
  displayParams: DisplayParams;
  handleFullscreenChange: Function;
}

const ThreeScene: React.FC<ThreeSceneProps> = (props: ThreeSceneProps) => {
  // Components
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const fullscreenButton = document.getElementById('fullscreen-btn');
  const [cameraModeString, setCameraModeString] = useState<string>("Free Float");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const envRef = useRef<GameEnvironment | null>(null);

  const colorConfigRef = useRef(props.colorsConfig);

  const resizeRendererToDisplaySize = () => {
    const width = mountRef.current?.clientWidth;
    const height = mountRef.current?.clientHeight;
  
    // Set the renderer size
    rendererRef.current?.setSize(width!, height!);
    
    // Optionally, update the camera aspect ratio and projection matrix if needed
    envRef.current!.camera.aspect = width! / height!;
    envRef.current!.camera.updateProjectionMatrix();
  }

  useEffect(() => {
    colorConfigRef.current = props.colorsConfig;
  }, [props.colorsConfig]);


  useEffect(() => {
    // Constructor: Components setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current = renderer;
 
    const gameEnvironment = new GameEnvironment(renderer, colorConfigRef.current);
    envRef.current = gameEnvironment;

    mountRef.current!.appendChild(renderer.domElement);

    resizeRendererToDisplaySize();

    // Constructor: KeyEvents setup
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (!envRef.current) return;
      
      envRef.current!.handleKeyDown(event);
    };

    const handleKeyUp = (event: globalThis.KeyboardEvent) => {
      if (!envRef.current) return;
    
      envRef.current!.handleKeyUp(event);
    };

    
    window.addEventListener('resize', resizeRendererToDisplaySize);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Return cleanup callback
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      mountRef.current?.removeChild(renderer.domElement);
      rendererRef.current!.dispose();
    };
  }, []);

  const drawFunctions : {[layerName: string]: (() => LayerObject | undefined)} = {
    terrainMesh: () => {
      if (!colorConfigRef.current) return;
      const terrainMesh = generateMesh(props.world!, colorConfigRef.current);
      return terrainMesh;
    },
    waterMesh: () => {
      if (!colorConfigRef.current) return;
      const waterMesh = generateWaterMesh(props.world!.waterLevel, props.world!.heightmap.length, colorConfigRef.current);
      return waterMesh;
    },
    structures: () => {
      if (!envRef.current!.layers.terrainMesh) return;
      const terrainMesh = envRef.current!.layers.terrainMesh!;
      let structures: THREE.Mesh[] = [];
  
      if (props.world!.temple) {
        const [platform, columns] = drawTemple(props.world!.temple, props.world!.heightmap, terrainMesh, 12);
        structures = structures.concat(platform);
        columns.forEach(column => structures = structures.concat(column));
      }
  
      if (props.world!.docks) {
        const docksPlatform = drawDocks(props.world!.docks, props.world!.heightmap, terrainMesh);
        structures = structures.concat(docksPlatform);
      }
  
      const townSquarePlatform = drawTownSquare(props.world!, terrainMesh);
      structures = structures.concat(townSquarePlatform);
      return structures;
    },
    roads: () => {
      let roads: THREE.Line[] = [];
  
      if (props.world!.templePath) {
        roads = roads.concat(createPath(props.world!.templePath!, props.world!.heightmap));
      }
      if (props.world!.docksPath) {
        roads = roads.concat(createPath(props.world!.docksPath!, props.world!.heightmap));
      }
  
      return roads;
    },
    flares: () => {
      if (!envRef.current!.layers.terrainMesh) return;
      const terrainMesh = envRef.current!.layers.terrainMesh!;
      const flares = drawTownLocations(props.world!, terrainMesh);
      return flares;
    },
    waterAccumulation: () => {
      const waterAccumulation = createWaterAccumulationField(props.world!.waterAccumulation, props.world!.heightmap);
      return waterAccumulation;
    },
    treesGroups: () => {
      if (!envRef.current!.layers.terrainMesh) return;
      const terrainMesh = envRef.current!.layers.terrainMesh!;
      const treesGroups = drawTreesOnMap(props.world!.waterAccumulation, props.world!.heightmap, props.world!.waterLevel, terrainMesh);
      return treesGroups;
    },
    arrows: () => {
      const arrows = createFlowDiagram(props.world!.flowDirections);
      return arrows;
    }
  };

  const drawLayer = (layerName: string) => {
    if (!props.world || !envRef.current) return;
    envRef.current!.setLayer(layerName, drawFunctions[layerName]()!);
  }

  // List of layer details: flag, draw function, and layer name for removal
  const layerConfig = [
    { flag: props.displayParams.drawTerrain, layer: "terrainMesh" },
    { flag: props.displayParams.drawWater, layer: "waterMesh" },
    { flag: props.displayParams.drawStructures, layer: "structures" },
    { flag: props.displayParams.drawRoads, layer: "roads" },
    { flag: props.displayParams.showStructureFlares, layer: "flares" },
    { flag: props.displayParams.showFlowDirections, layer: "arrows" },
    { flag: props.displayParams.showWaterAccumulation, layer: "waterAccumulation" },
    { flag: props.displayParams.showTrees, layer: "treesGroups" }
  ];

  // Single useEffect hook to handle all layers
  useEffect(() => {
    if (!envRef.current) return;

    layerConfig.forEach(({ flag, layer }) => {
      if (flag) {
        drawLayer(layer);
      } else {
        envRef.current?.removeLayer(layer);
      }
    });
  }, [
    props.displayParams.drawTerrain,
    props.displayParams.drawWater,
    props.displayParams.drawStructures,
    props.displayParams.drawRoads,
    props.displayParams.showStructureFlares,
    props.displayParams.showFlowDirections,
    props.displayParams.showWaterAccumulation,
    props.displayParams.showTrees
  ]);

  useEffect(() => {
    if (!envRef.current || !envRef.current.lighting) return;
    const ambientLight = new THREE.AmbientLight(colorConfigRef.current.ambientLight); // Soft ambient light
    envRef.current.lighting.ambientLight = ambientLight;
  }, [props.colorsConfig.ambientLight]);

  useEffect(() => {
    if (!envRef.current) return;
    const directionalLight = new THREE.DirectionalLight(colorConfigRef.current.directionalLight); // Soft ambient light
    envRef.current.lighting.directionalLight = directionalLight;
  }, [props.colorsConfig.directionalLight]);

  useEffect(() => {
    if (!mountRef.current || !props.world || !rendererRef.current || !envRef.current) return;
    envRef.current.emptySceneBuffer();

    envRef.current.clock = new THREE.Clock();
    envRef.current.returnToOverview();
    
    // Draw each layer
    layerConfig.forEach(({ flag, layer }) => {if (flag) { drawLayer(layer);}});
    
    envRef.current.resetLights();

    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (envRef.current) {
        envRef.current.advanceFrame();
      
        //console.log("Rendering scene: ", sceneRef.current);

        rendererRef.current!.render(envRef.current.scene, envRef.current.camera);
      }
    };

    animate();

    return () => cancelAnimationFrame(animationId);

  }, [props.world]);

  const onFullscreenClick = () => {
    return;
    const shouldBeFullscreen = !isFullscreen;
    if (shouldBeFullscreen) {
      rendererRef.current!.setSize(window.innerWidth, window.innerHeight);
    } else {
      resizeRendererToDisplaySize();
    }
    setIsFullscreen(shouldBeFullscreen);
    props.handleFullscreenChange(shouldBeFullscreen);
  }

  return (
    <div ref={containerRef} id='three-container' tabIndex={0} className='p-4 flex-1'>
      <div className='h-full justify-center'>
        <div id="fullscreen-button-container" className="relative">
          <Button id="fullscreen-btn" onClick={onFullscreenClick} className="absolute top-1 right-2 z-10 p-4 bg-black bg-opacity-50 text-white border-none cursor-pointer text-sm hover:bg-opacity-70">
          『』
          </Button>
        </div>

        <div id="cameramode-label-container" className='relative'>
          <div className='flex p-4 absolute top-1 left-1 z-10'>
            <span className='px-4 py-2 bg-black bg-opacity-50 text-white border-none cursor-pointer text-sm hover:bg-opacity-70'>
              Camera Mode: {cameraModeString}
            </span>
          </div>
        </div>

        <div ref={mountRef} className='h-full w-full bg-primary'/>
        

        <div id="buttons-container" className='relative'>
          <div className='flex p-4 absolute bottom-1 left-1 z-10'>
              <Button className='px-4 py-2 bg-black bg-opacity-50 text-white border-none cursor-pointer text-sm hover:bg-opacity-70'
                onClick={() => {
                  if (envRef.current) {
                    setCameraModeString("Free Float");
                    envRef.current.returnToOverview();
                  }
                }}>
                🗺️
              </Button>
              <Button className='px-4 py-2 bg-black bg-opacity-50 text-white border-none cursor-pointer text-sm hover:bg-opacity-70'
                onClick={() => {
                  if (envRef.current) {
                    setCameraModeString("Free Float");
                    envRef.current.moveCameraAbovePosition(new THREE.Vector3(
                      props.world!.townSquare.x - (envRef.current!.layers.terrainMesh!.geometry as THREE.PlaneGeometry).parameters.width / 2,
                      (props.world!.heightmap.length - props.world!.townSquare.y) - (envRef.current!.layers.terrainMesh!.geometry as THREE.PlaneGeometry).parameters.height / 2,
                      10
                    ));
                  }
                }}>
                🏘️
              </Button>
              <Button className='px-4 py-2 bg-black bg-opacity-50 text-white border-none cursor-pointer text-sm hover:bg-opacity-70'
                onClick={() => {
                  if (envRef.current) {
                    setCameraModeString("Gravity On");
                    envRef.current.turnGravityOn();
                  }
                }}>
                🪂
              </Button>
              <Button className='px-4 py-2 bg-black bg-opacity-50 text-white border-none cursor-pointer text-sm hover:bg-opacity-70'
                onClick={() => {
                  if (envRef.current) {
                    setCameraModeString("Fly-Hack");
                    envRef.current.turnFlyHackOn();
                  }
                }}>
                🛩️
              </Button>
          </div>
        </div>  
      </div>
    </div>
  );
};

export default ThreeScene;

