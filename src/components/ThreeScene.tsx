"use client"

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

import { OrbitControls, PointerLockControls } from 'three/examples/jsm/Addons.js';
import { Button } from './ui/button';

import { ColorsConfig, World } from '@/types';
import { drawTemple, drawTownLocations, drawTownSquare, generateMesh } from '@/app/models';

const DEBUG_DRAW_TOWN_LOCATIONS = true;

const DEFAULT_FOV = 75;
const DEFAULT_ASPECT = 1.5;
const DEFAULT_NEAR = 0.1;
const DEFAULT_FAR = 1000;

export interface ThreeSceneProps {
  world: World | null;
  colorsConfig: ColorsConfig;
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

  const resetCamera = () => {
    cameraRef.current!.fov = DEFAULT_FOV;
    cameraRef.current!.aspect = DEFAULT_ASPECT;
    cameraRef.current!.near = DEFAULT_NEAR;
    cameraRef.current!.far = DEFAULT_FAR;
    cameraRef.current!.position.set(0, 0, 100);
  };


  // Physics for free-fall
  const fallSpeedRef = useRef(0); // Use ref to persist fall speed across renders
  const gravity = 9.81; // Simulating gravity

  useEffect(() => {
    colorConfigRef.current = props.colorsConfig;
    console.log(props.colorsConfig);
  }, [props.colorsConfig]);


  useEffect(() => {
    // Constructor: Components setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(Math.min(window.innerWidth - 100, 600), 400);
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
    const camera = new THREE.PerspectiveCamera(DEFAULT_FOV, DEFAULT_ASPECT, DEFAULT_NEAR, DEFAULT_FAR);
    camera.position.set(0, 0, 100);
    cameraRef.current = camera;

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

    const handleBlur = () => {
      console.log('ThreeScene lost focus, stopping key listeners');
      containerRef.current!.removeEventListener('keydown', handleKeyDown);
    };

    const handleFocus = () => {
      console.log('ThreeScene gained focus, adding key listeners');
      containerRef.current!.addEventListener('keydown', handleKeyDown);
    };

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
    

    if (props.world.heightmap && sceneRef.current) {
      console.log(colorConfigRef.current);
      const mesh = generateMesh(props.world, colorConfigRef.current);
      meshRef.current = mesh;

      sceneRef.current.add(mesh);

      if (DEBUG_DRAW_TOWN_LOCATIONS) {
        const [townSquare, temple, docks] = drawTownLocations(props.world, mesh);
        sceneRef.current.add(townSquare);
        sceneRef.current.add(temple);
        sceneRef.current.add(docks);
      }

      const [platform, columns] = drawTemple(props.world, mesh, 12);
      sceneRef.current.add(platform);
      columns.forEach(column => {
        sceneRef.current!.add(column);  
      });
      
    
      const townSquarePlatform = drawTownSquare(props.world, mesh);
      sceneRef.current.add(townSquarePlatform);
      

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
    const shouldBeFullscreen = !isFullscreen;
    if (shouldBeFullscreen) {
      rendererRef.current!.setSize(window.innerWidth - 100, window.innerHeight - 100);
    } else {
      rendererRef.current!.setSize(600, 400);
    }
    setIsFullscreen(shouldBeFullscreen);
    props.handleFullscreenChange(shouldBeFullscreen);
  }

  return (
    <div ref={containerRef} id='three-container' tabIndex={0} className='p-4'>
      <div className='flex h-full justify-center'>
        <div>
        <div id="fullscreen-button-container" className="relative">
            <Button id="fullscreen-btn" onClick={onFullscreenClick} className="absolute top-1 right-2 z-10 px-4 py-2 bg-black bg-opacity-50 text-white border-none cursor-pointer text-sm hover:bg-opacity-70">
            『』
            </Button>
          </div>

          <div ref={mountRef} />

          <div id="buttons-container" className="relative">
            <div className='flex p-4'>
              <div className='flex w-1/3'>
                <Button 
                  onClick={handleResetView}>
                  Reset View
                </Button>
              </div>
              <div className='flex w-1/3 justify-center'>
                <Button  
                  onClick={moveCameraAboveTownSquare}>
                  Go to Town Center
                </Button>
              </div>
              <div className='flex w-1/3 justify-end'>
                <Button  
                  onClick={() => {
                    freeFloatControlsRef.current!.enabled = false;
                    cameraModeRef.current = CameraMode.FreeFall;
                    console.log("Free fall");
                  }}>
                  Free Fall
                </Button>
              </div>
            </div>
          </div>

          
        
        </div>
      </div>
    </div>
  );
};

export default ThreeScene;

