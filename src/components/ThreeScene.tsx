"use client"

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { FPSControls } from '@/FPSControls.js';
import { Button } from './ui/button';

import * as Constants from '@/constants';
import { ColorsConfig, DisplayParams, Point, World } from '@/types';
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
  intersectPlane
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
  const [cameraModeString, setCameraModeString] = useState<string>("Free Float");
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
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const waterMeshRef = useRef<THREE.Mesh | null>(null);
  
  // Camera
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Camera controls
  const controlsRef = useRef<OrbitControls | FPSControls | null>(null);
  const freeFloatControlsRef = useRef<OrbitControls | null>(null);
  const pointerLockControlsRef = useRef<FPSControls | null>(null);

  const cameraModeRef = useRef<CameraMode>(CameraMode.FreeFloat);

  // Track refs for models that we turn on or off
  const flaresRef = useRef<(THREE.Mesh | null)[]>([]);
  const structuresRef = useRef<THREE.Mesh[]>([]);
  const roadsRef = useRef<THREE.Line[]>([]);
  const arrowsRef = useRef<THREE.Group | null>(null);
  const waterAccumulationRef = useRef<THREE.Group | null>(null);
  const treesGroupsRef = useRef<THREE.Group[]>([]);


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

  // Input state
  const moveForward = useRef<boolean>(false);
  const moveBackward = useRef<boolean>(false);
  const moveLeft = useRef<boolean>(false);
  const moveRight = useRef<boolean>(false);
  const canJumpRef = useRef<boolean>(false);
  const velocityRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const directionRef = useRef<THREE.Vector3>(new THREE.Vector3());

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

    // Constructor: PointerLockControls setup
    const pointerLockControls = new FPSControls(camera, renderer.domElement);
    pointerLockControlsRef.current = pointerLockControls;

    // Handle pointer lock state changes (optional but useful for UI)
    pointerLockControls.domElement.ownerDocument.addEventListener('lock', () => {
      console.log('Pointer locked');
    });
    pointerLockControls.domElement.ownerDocument.addEventListener('unlock', () => {
      console.log('Pointer unlocked');
    });

    // Constructor: KeyEvents setup
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (!cameraRef.current || !controlsRef.current) return;

      const moveSpeed = 10;

      // If we're in free-float mode
      if (controlsRef.current instanceof OrbitControls) {
        console.log("Orbit lock movement");
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
        freeFloatControlsRef.current!.update();
      } else if (controlsRef.current instanceof FPSControls) {
        // Event listener to lock pointer when user clicks on the canvas
        console.log("Pointer lock movement");
        switch (event.key) {
          case 'w':
            velocityRef.current.y = moveSpeed; // Move forward
            break;
          case 's':
            velocityRef.current.y = -moveSpeed; // Move backward
            break;
          case 'a':
            velocityRef.current.x = -moveSpeed; // Move left
            break;
          case 'd':
            velocityRef.current.x = moveSpeed; // Move right
            break;
          case 'Space':
            if (cameraRef.current.position.z <= 10) {
              velocityRef.current.z = moveSpeed * 2; // Jump logic (adjust as necessary)
            }
            break;
        }
      }
      
    };

    const handleKeyUp = (event: globalThis.KeyboardEvent) => {
      if (!controlsRef.current) return;
    
      // Reset velocity when key is released
      switch (event.key) {
        case 'w':
        case 's':
          velocityRef.current.y = 0;
          break;
        case 'a':
        case 'd':
          velocityRef.current.x = 0;
          break;
        case 'Space':
          velocityRef.current.z = 0; // Reset vertical velocity after jump
          break;
      }
    };

    
    window.addEventListener('resize', resizeRendererToDisplaySize);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Game logic: Initialize to free-float mode
    controlsRef.current = orbitControls;
    cameraModeRef.current = CameraMode.FreeFloat;

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
    terrainMeshRef.current = terrainMesh;

    sceneRef.current.add(terrainMesh);
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

      const delta = clockRef.current!.getDelta(); // Time between frames

      // Update the camera's fall if in free-fall mode
      if (cameraModeRef.current === CameraMode.FreeFall) {
        setCameraModeString("Free Fall")
        fallSpeedRef.current += gravity * delta; // Increase fall speed due to gravity
        cameraRef.current!.position.z -= fallSpeedRef.current * delta; // Move camera downwards

        const collisionResults = intersectPlane(cameraRef.current!.position, terrainMeshRef.current!);

        if (collisionResults.length > 0) {
          if (collisionResults[0].distance <= fallSpeedRef.current * delta) {
            cameraRef.current!.position.z = 5;
            cameraRef.current!.lookAt(new THREE.Vector3(1, 0, 0));
            cameraRef.current!.setRotationFromEuler(new THREE.Euler(0, 0, 0, "ZYX"));
            cameraModeRef.current = CameraMode.Walking;
            controlsRef.current = pointerLockControlsRef.current;
            fallSpeedRef.current = 0;
          }
        }
      } else if (cameraModeRef.current === CameraMode.Walking) {
        setCameraModeString("Fly-Hack");
        const moveSpeed = 10;
        // Apply velocity and movement for PointerLockControls
        const velocity = velocityRef.current; // Assuming you have a velocity ref for FPS movement
        const direction = directionRef.current; // Assuming you have a direction ref for FPS movement
    
        // Update velocity with delta
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.y -= velocity.y * 10.0 * delta;
    
        // Update movement direction based on user input (WASD keys)
        if (moveForward.current) velocity.y += moveSpeed * delta;
        if (moveBackward.current) velocity.y -= moveSpeed * delta;
        if (moveLeft.current) velocity.x -= moveSpeed * delta;
        if (moveRight.current) velocity.x += moveSpeed * delta;
    
        // Apply movement to the PointerLockControls
        (controlsRef.current as FPSControls).moveRight(velocity.x * delta);
        (controlsRef.current as FPSControls).moveForward(-1 * velocity.y * delta);
    
        // // Optional: Handle gravity or jumping
        // if (cameraRef.current.position.y < 10) {
        //   cameraRef.current.position.y = 10; // Prevent camera from going below ground level
        //   velocity.y = 0; // Stop vertical movement
        // }
    
        // // You can also add vertical movement for jumping or falling here
        // cameraRef.current.position.y += velocity.y * delta;
      } 
      else if (cameraModeRef.current === CameraMode.FreeFloat) {
        setCameraModeString("Free Float");
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

      rendererRef.current!.domElement.removeEventListener('click', () => {
        if (controlsRef.current instanceof FPSControls) {
          pointerLockControlsRef.current!.lock();
        }
      });
    }
  };

  // Function to move the camera directly above the town square
  const moveCameraAboveTownSquare = () => {
    if (!cameraRef.current || !controlsRef.current || !props.world || !terrainMeshRef.current) return;

    const townSquarePosition = new THREE.Vector3(
      props.world!.townSquare.x - (terrainMeshRef.current!.geometry as THREE.PlaneGeometry).parameters.width / 2,
      (props.world.heightmap.length - props.world!.townSquare.y) - (terrainMeshRef.current!.geometry as THREE.PlaneGeometry).parameters.height / 2,
      10 // Z position above the ground
    );
    cameraModeRef.current = CameraMode.FreeFloat;
    controlsRef.current = freeFloatControlsRef.current;
    cameraRef.current.position.set(townSquarePosition.x, townSquarePosition.y, 50); // Adjust the Z position for height
    freeFloatControlsRef.current!.target.copy(townSquarePosition); // Set the controls' target to the town square
    freeFloatControlsRef.current!.update();
    freeFloatControlsRef.current!.enabled = true;

    rendererRef.current!.domElement.removeEventListener('click', () => {
      if (controlsRef.current instanceof FPSControls) {
        pointerLockControlsRef.current!.lock();
      }
    });
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
              <Button className='px-4 py-2 bg-black bg-opacity-50 text-white border-none cursor-pointer text-sm hover:bg-opacity-70'
                onClick={() => {
                  freeFloatControlsRef.current!.enabled = false;
                  rendererRef.current!.domElement.addEventListener('click', () => {
                    if (controlsRef.current instanceof FPSControls) {
                      pointerLockControlsRef.current!.lock();
                    }
                  });
                  cameraModeRef.current = CameraMode.Walking;
                  controlsRef.current = pointerLockControlsRef.current;
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

