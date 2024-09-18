"use client"

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

import { OrbitControls, PointerLockControls } from 'three/examples/jsm/Addons.js';
import { Button } from './ui/button';

import * as Constants from '@/constants';
import { ColorsConfig, DisplayParams, World } from '@/types';
import { 
  drawTemple, 
  drawTownLocations, 
  drawTownSquare,
  generateMesh, 
  createFlowDiagram, 
  createWaterAccumulationField,
  createPath,
  drawDocks
} from '@/app/models';

export interface ThreeSceneProps {
  world: World | null;
  colorsConfig: ColorsConfig;
  displayParams: DisplayParams;
  handleFullscreenChange: Function;
}

enum CameraMode {
  FreeFloat,
  FreeFall,
  Walking
}

const ThreeScene: React.FC<ThreeSceneProps> = (props: ThreeSceneProps) => {
  // Components
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const fullscreenButton = document.getElementById('fullscreen-btn');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Props
  const colorConfigRef = useRef(props.colorsConfig);

  // Actual scene objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const directionalLightRef = useRef<THREE.DirectionalLight | null>(null);

  // Clock
  const clockRef = useRef<THREE.Clock | null>(null); 
  
  // Pointer to terrain mesh
  const meshRef = useRef<THREE.Mesh | null>(null);
  
  // Camera
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Camera controls
  const controlsRef = useRef<OrbitControls | PointerLockControls | null>(null);
  const freeFloatControlsRef = useRef<OrbitControls | null>(null);
  const pointerLockControlsRef = useRef<PointerLockControls | null>(null);

  const cameraModeRef = useRef<CameraMode>(CameraMode.FreeFloat);

  // Track refs for models that we turn on or off
  const flaresRef = useRef<(THREE.Mesh | null)[]>([]);
  const structuresRef = useRef<THREE.Mesh[]>([]);
  const roadsRef = useRef<THREE.Line[]>([]);
  const arrowsRef = useRef<THREE.Group | null>(null);
  const waterAccumulationRef = useRef<THREE.Group | null>(null);


  const resetCamera = () => {
    cameraRef.current!.fov = Constants.DEFAULT_FOV;
    cameraRef.current!.aspect = Constants.DEFAULT_ASPECT;
    cameraRef.current!.near = Constants.DEFAULT_NEAR;
    cameraRef.current!.far = Constants.DEFAULT_FAR;
    cameraRef.current!.position.set(0, 0, 100);
  };


  // Physics for free-fall
  const fallSpeedRef = useRef(0); // Use ref to persist fall speed across renders
  const gravity = 9.81; // Simulating gravity
  

  const resizeRendererToDisplaySize = () => {
    const width = mountRef.current?.clientWidth;
    const height = mountRef.current?.clientHeight;
  
    // Set the renderer size
    rendererRef.current?.setSize(width!, height!);
    
    // Optionally, update the camera aspect ratio and projection matrix if needed
    cameraRef.current!.aspect = width! / height!;
    cameraRef.current!.updateProjectionMatrix();
  }

  useEffect(() => {
    colorConfigRef.current = props.colorsConfig;
  }, [props.colorsConfig]);


  useEffect(() => {
    // Constructor: Components setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current = renderer;

    mountRef.current!.appendChild(rendererRef.current.domElement);

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

    // Constructor: Camera setup
    const camera = new THREE.PerspectiveCamera(Constants.DEFAULT_FOV, Constants.DEFAULT_ASPECT, Constants.DEFAULT_NEAR, Constants.DEFAULT_FAR);
    camera.position.set(0, 0, 100);
    cameraRef.current = camera;

    resizeRendererToDisplaySize();

    // Constructor: OrbitControls setup
    const orbitControls = new OrbitControls(camera, rendererRef.current!.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.05;
    freeFloatControlsRef.current = orbitControls;

    // Constructor: KeyEvents setup
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!cameraRef.current || !controlsRef.current) return;

      const moveSpeed = 10;

      // If we're in free-float mode
      if (controlsRef.current instanceof OrbitControls) {
        switch (event.key) {
          case 'w':
            let north = new THREE.Vector3(0, 1, 0);
            controlsRef.current.target.addScaledVector(north, moveSpeed);
            cameraRef.current.position.addScaledVector(north, moveSpeed);
            break;
          case 's':
            let south = new THREE.Vector3(0, -1, 0);
            controlsRef.current.target.addScaledVector(south, moveSpeed);
            cameraRef.current.position.addScaledVector(south, moveSpeed);
            break;
          case 'a':
            let west = new THREE.Vector3(-1, 0, 0);
            controlsRef.current.target.addScaledVector(west, moveSpeed);
            cameraRef.current.position.addScaledVector(west, moveSpeed);
            break;
          case 'd':
            let east = new THREE.Vector3(1, 0, 0);
            controlsRef.current.target.addScaledVector(east, moveSpeed);
            cameraRef.current.position.addScaledVector(east, moveSpeed);
            break;
        }
      } 
      freeFloatControlsRef.current!.update();
    };

    
    window.addEventListener('resize', resizeRendererToDisplaySize);

    // Game logic: Initialize to free-float mode
    controlsRef.current = orbitControls;
    cameraModeRef.current = CameraMode.FreeFloat;

    // Return cleanup callback
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      mountRef.current?.removeChild(renderer.domElement);
      rendererRef.current!.dispose();
    };
  }, []);

  const drawTerrain = () => {
    if (!colorConfigRef.current || !props.world || !sceneRef.current) return;
    const mesh = generateMesh(props.world, colorConfigRef.current);
    meshRef.current = mesh;

    sceneRef.current.add(mesh);
  }

  const drawStructures = () => {
    if (!meshRef.current || !props.world || !sceneRef.current || !structuresRef.current) return;
    
    if (props.world.temple) {
      const [platform, columns] = drawTemple(props.world.temple, props.world.heightmap, meshRef.current, 12);
      structuresRef.current = structuresRef.current.concat(platform);
      columns.forEach(column => {
        structuresRef.current = structuresRef.current!.concat(column);
      });
    }

    if (props.world.docks) {
      const docksPlatform = drawDocks(props.world.docks, props.world.heightmap, meshRef.current);
      structuresRef.current = structuresRef.current.concat(docksPlatform);
    }
  
    const townSquarePlatform = drawTownSquare(props.world, meshRef.current);
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
    if (!sceneRef.current || !props.world || !meshRef.current) return;
    const [townSquare, temple, docks] = drawTownLocations(props.world!, meshRef.current!);
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

  const drawFlowDiagram = () => {
    if (!sceneRef.current || !props.world || !meshRef.current) return;
    arrowsRef.current = createFlowDiagram(props.world.flowDirections);
    sceneRef.current.add(arrowsRef.current);
  };

  useEffect(() =>{
    if (props.displayParams.drawTerrain) {
      drawTerrain();
    } else if (meshRef.current) {
      sceneRef.current!.remove(meshRef.current);
    }
  }, [props.displayParams.drawTerrain])

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

    // Go back to free-explore when we create a new world
    cameraModeRef.current = CameraMode.FreeFloat;
    resetCamera();
    freeFloatControlsRef.current!.enabled = true;

    if (!mountRef.current || !props.world || !rendererRef.current) return;

    // Reset the clock and the camera
    clockRef.current = new THREE.Clock();
    
    // Refresh array refs
    structuresRef.current = [];
    roadsRef.current = [];

    if (sceneRef.current) {
      if (props.displayParams.drawTerrain) drawTerrain();
      if (props.displayParams.drawStructures) drawStructures();
      if (props.displayParams.drawRoads) drawRoads();
      if (props.displayParams.showStructureFlares) drawStructureFlares();
      if (props.displayParams.showFlowDirections) drawFlowDiagram();
      if (props.displayParams.showWaterAccumulation) drawWaterAccumulationDiagram();
      

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

      const delta = clockRef.current!.getDelta(); // Time between frames

      // Update the camera's fall if in free-fall mode
      if (cameraModeRef.current === CameraMode.FreeFall) {
        fallSpeedRef.current += gravity * delta; // Increase fall speed due to gravity
        cameraRef.current!.position.z -= fallSpeedRef.current * delta; // Move camera downwards

        // Check if the camera has hit the terrain
        const down = new THREE.Vector3(0, 0, -1);
        const raycaster = new THREE.Raycaster();

        raycaster.set(cameraRef.current!.position, down);
        const collisionResults = raycaster.intersectObject(meshRef.current!);

        if (collisionResults.length > 0) {
          if (collisionResults[0].distance <= fallSpeedRef.current * delta) {
            cameraRef.current!.position.z = 5;
            cameraRef.current!.lookAt(new THREE.Vector3(1, 0, 0));
            cameraModeRef.current = CameraMode.Walking;
            fallSpeedRef.current = 0;
          }
        }
      }
      else {
        freeFloatControlsRef.current!.update();
      }
      
      rendererRef.current!.render(sceneRef.current!, cameraRef.current!);
    };

    animate();

    return () => cancelAnimationFrame(animationId);

  }, [props.world]);
  
  const handleResetView = () => {
    if (cameraRef.current && controlsRef.current) {
      resetCamera();
      cameraModeRef.current = CameraMode.FreeFloat;
      cameraRef.current.updateProjectionMatrix();
      freeFloatControlsRef.current!.reset();
      freeFloatControlsRef.current!.enabled = true;
      controlsRef.current = freeFloatControlsRef.current!;
    }
  };

  // Function to move the camera directly above the town square
  const moveCameraAboveTownSquare = () => {
    if (!cameraRef.current || !controlsRef.current || !props.world || !meshRef.current) return;

    const townSquarePosition = new THREE.Vector3(
      props.world!.townSquare.x - (meshRef.current!.geometry as THREE.PlaneGeometry).parameters.width / 2,
      (props.world.heightmap.length - props.world!.townSquare.y) - (meshRef.current!.geometry as THREE.PlaneGeometry).parameters.height / 2,
      10 // Z position above the ground
    );
    cameraRef.current.position.set(townSquarePosition.x, townSquarePosition.y, 50); // Adjust the Z position for height
    freeFloatControlsRef.current!.target.copy(townSquarePosition); // Set the controls' target to the town square
    freeFloatControlsRef.current!.update();
  };

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

        <div ref={mountRef} className='h-full w-full bg-primary'/>

        <div id="buttons-container" className='relative'>
          <div className='flex p-4 absolute bottom-1 left-1 z-10'>
              <Button className='px-4 py-2 bg-black bg-opacity-50 text-white border-none cursor-pointer text-sm hover:bg-opacity-70'
                onClick={handleResetView}>
                🗺️
              </Button>
              <Button className='px-4 py-2 bg-black bg-opacity-50 text-white border-none cursor-pointer text-sm hover:bg-opacity-70'
                onClick={moveCameraAboveTownSquare}>
                🏘️
              </Button>
              <Button className='px-4 py-2 bg-black bg-opacity-50 text-white border-none cursor-pointer text-sm hover:bg-opacity-70'
                onClick={() => {
                  freeFloatControlsRef.current!.enabled = false;
                  cameraModeRef.current = CameraMode.FreeFall;
                }}>
                🪂
              </Button>
          </div>
        </div>  
      </div>
    </div>
  );
};

export default ThreeScene;

