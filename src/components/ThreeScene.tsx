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

import { GameEnvironment } from '@/app/game-logic';

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
  
  // Game environment
  const envRef = useRef<GameEnvironment | null>(null);

  // Props
  const colorConfigRef = useRef(props.colorsConfig);

  // Actual scene objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const directionalLightRef = useRef<THREE.DirectionalLight | null>(null);

  // Layers for rendering
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const waterMeshRef = useRef<THREE.Mesh | null>(null);
  const flaresRef = useRef<(THREE.Mesh | null)[]>([]);
  const structuresRef = useRef<THREE.Mesh[]>([]);
  const roadsRef = useRef<THREE.Line[]>([]);
  const arrowsRef = useRef<THREE.Group | null>(null);
  const waterAccumulationRef = useRef<THREE.Group | null>(null);
  const treesGroupsRef = useRef<THREE.Group[]>([]);

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
 
    const gameEnvironment = new GameEnvironment(renderer);
    envRef.current = gameEnvironment;

    mountRef.current!.appendChild(renderer.domElement);

    // Constructor: Scene setup
    const scene = new THREE.Scene();

    const ambientLight = new THREE.AmbientLight(colorConfigRef.current.ambientLight); // Soft ambient light
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const directionalLight = new THREE.DirectionalLight(colorConfigRef.current.directionalLight, 100);
    directionalLight.position.set(50, 50, 50);
    scene.add(directionalLight);
    directionalLightRef.current = directionalLight;

    sceneRef.current = scene;

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

  const drawTerrain = () => {
    if (!colorConfigRef.current || !props.world || !sceneRef.current) return;

    const terrainMesh = generateMesh(props.world, colorConfigRef.current);

    //console.log("Got terrain mesh");

    terrainMeshRef.current = terrainMesh;

    sceneRef.current.add(terrainMesh);

    //console.log("Rendered terrain mesh");
  }

  const drawWaterLevel = () => {
    if (!colorConfigRef.current || !props.world || !sceneRef.current) return;
    const waterMesh = generateWaterMesh(props.world.waterLevel, props.world.heightmap.length, colorConfigRef.current);
    waterMeshRef.current = waterMesh;

    sceneRef.current.add(waterMesh);
  }

  const drawStructures = () => {
    if (!terrainMeshRef.current || !props.world || !sceneRef.current || !structuresRef.current) return;
    
    if (props.world.temple) {
      const [platform, columns] = drawTemple(props.world.temple, props.world.heightmap, terrainMeshRef.current, 12);
      structuresRef.current = structuresRef.current.concat(platform);
      columns.forEach(column => {
        structuresRef.current = structuresRef.current!.concat(column);
      });
    }

    if (props.world.docks) {
      const docksPlatform = drawDocks(props.world.docks, props.world.heightmap, terrainMeshRef.current);
      structuresRef.current = structuresRef.current.concat(docksPlatform);
    }
  
    const townSquarePlatform = drawTownSquare(props.world, terrainMeshRef.current);
    structuresRef.current = structuresRef.current.concat(townSquarePlatform);

    structuresRef.current.forEach((thing) => sceneRef.current!.add(thing));
  }

  const drawRoads = () => {
    if (!props.world || !sceneRef.current || !roadsRef.current) return;

    roadsRef.current = [];
    if (props.world.templePath) {
      roadsRef.current = roadsRef.current.concat(createPath(props.world.templePath!, props.world.heightmap));
    }
    if (props.world.docksPath) {
      roadsRef.current = roadsRef.current.concat(createPath(props.world.docksPath!, props.world.heightmap));
    }

    roadsRef.current.forEach((roadSegments) => {
      sceneRef.current!.add(roadSegments);
    }) 
  }

  const drawStructureFlares = () => {
    if (!sceneRef.current || !props.world || !terrainMeshRef.current) return;
    const [townSquare, temple, docks] = drawTownLocations(props.world!, terrainMeshRef.current!);
      flaresRef.current = [townSquare, temple, docks];
      if (townSquare) {
        sceneRef.current.add(townSquare);
      }
      if (temple) {
        sceneRef.current.add(temple);
      }
      if (docks) {
        sceneRef.current.add(docks);
      }
  };

  const drawWaterAccumulationDiagram = () => {
    if (!sceneRef.current || !props.world) return;
    waterAccumulationRef.current = createWaterAccumulationField(props.world.waterAccumulation, props.world.heightmap);
    sceneRef.current.add(waterAccumulationRef.current);
  }

  const drawTrees = () => {
    if (!sceneRef.current || !props.world || !terrainMeshRef.current) return;
    treesGroupsRef.current = drawTreesOnMap(props.world.waterAccumulation, props.world.heightmap, props.world.waterLevel, terrainMeshRef.current!);
    treesGroupsRef.current.forEach((treeGroup) => sceneRef.current!.add(treeGroup));
  }

  const drawFlowDiagram = () => {
    if (!sceneRef.current || !props.world || !terrainMeshRef.current) return;
    arrowsRef.current = createFlowDiagram(props.world.flowDirections);
    sceneRef.current.add(arrowsRef.current);
  };

  useEffect(() =>{
    if (props.displayParams.drawTerrain) {
      drawTerrain();
    } else if (terrainMeshRef.current) {
      sceneRef.current!.remove(terrainMeshRef.current);
    }
  }, [props.displayParams.drawTerrain])

  useEffect(() =>{
    if (props.displayParams.drawWater) {
      drawTerrain();
    } else if (waterMeshRef.current) {
      sceneRef.current!.remove(waterMeshRef.current);
    }
  }, [props.displayParams.drawWater])

  useEffect(() =>{
    if (props.displayParams.drawStructures) {
      drawStructures();
    } else if (structuresRef.current) {
      structuresRef.current.forEach((thing) => sceneRef.current!.remove(thing));
    }
  }, [props.displayParams.drawStructures])

  useEffect(() =>{
    if (props.displayParams.drawRoads) {
      drawRoads();
    } else if (roadsRef.current) {
      roadsRef.current.forEach((thing) => sceneRef.current!.remove(thing));
    }
  }, [props.displayParams.drawRoads])
  
  useEffect(() =>{
    if (props.displayParams.showStructureFlares) {
      drawStructureFlares();
    } else if (flaresRef.current) {
      flaresRef.current.forEach((thing) => {if (thing) sceneRef.current!.remove(thing);})
    }
  }, [props.displayParams.showStructureFlares])


  useEffect(() =>{
    if (props.displayParams.showFlowDirections) {
      drawFlowDiagram();
    } else if (arrowsRef.current) {
      sceneRef.current!.remove(arrowsRef.current);
    }
  }, [props.displayParams.showFlowDirections])

  useEffect(() =>{
    if (props.displayParams.showWaterAccumulation) {
      drawWaterAccumulationDiagram();
    } else if (waterAccumulationRef.current) {
      sceneRef.current!.remove(waterAccumulationRef.current);
    }
  }, [props.displayParams.showWaterAccumulation])

  useEffect(() =>{
    if (props.displayParams.showTrees) {
      drawTrees();
    } else if (treesGroupsRef.current) {
      treesGroupsRef.current.forEach((thing) => {if (thing) sceneRef.current!.remove(thing);})
    }
  }, [props.displayParams.showTrees])

  useEffect(() => {
    const ambientLight = new THREE.AmbientLight(colorConfigRef.current.ambientLight); // Soft ambient light
    ambientLightRef.current = ambientLight;
  }, [props.colorsConfig.ambientLight]);

  useEffect(() => {
    const directionalLight = new THREE.DirectionalLight(colorConfigRef.current.directionalLight); // Soft ambient light
    directionalLightRef.current = directionalLight;
  }, [props.colorsConfig.directionalLight]);

  useEffect(() => {
    // Clean up previous scene, renderer, etc.
    if (sceneRef.current) {
      while (sceneRef.current.children.length > 0) {
        sceneRef.current.remove(sceneRef.current.children[0]);
      }
    }

    if (!mountRef.current || !props.world || !rendererRef.current || !envRef.current) return;

    //console.log("Rendering world");

    // Reset the clock and the camera
    envRef.current.clock = new THREE.Clock();
    envRef.current.returnToOverview();
    
    // Refresh array refs
    structuresRef.current = [];
    roadsRef.current = [];

    if (sceneRef.current) {
      if (props.displayParams.drawTerrain) drawTerrain();
      if (props.displayParams.drawWater) drawWaterLevel();
      if (props.displayParams.drawStructures) drawStructures();
      if (props.displayParams.drawRoads) drawRoads();
      if (props.displayParams.showStructureFlares) drawStructureFlares();
      if (props.displayParams.showFlowDirections) drawFlowDiagram();
      if (props.displayParams.showWaterAccumulation) drawWaterAccumulationDiagram();
      if (props.displayParams.showTrees) drawTrees();
      
      if (ambientLightRef.current) {
        sceneRef.current.add(ambientLightRef.current);
      }

      if (directionalLightRef.current) {
        sceneRef.current.add(directionalLightRef.current);
      }
    }

    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (envRef.current) {
        envRef.current.advanceFrame(terrainMeshRef.current!);
      
        //console.log("Rendering scene: ", sceneRef.current);

        rendererRef.current!.render(sceneRef.current!, envRef.current.camera);
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
                      props.world!.townSquare.x - (terrainMeshRef.current!.geometry as THREE.PlaneGeometry).parameters.width / 2,
                      (props.world!.heightmap.length - props.world!.townSquare.y) - (terrainMeshRef.current!.geometry as THREE.PlaneGeometry).parameters.height / 2,
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

