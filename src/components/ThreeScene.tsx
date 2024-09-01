"use client"

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

import { OrbitControls, PointerLockControls } from 'three/examples/jsm/Addons.js';
import { Button } from './ui/button';

import { World } from '@/types';
import { drawTemple, drawTownLocations, drawTownSquare, generateMesh } from '@/app/models';

const DEBUG_DRAW_TOWN_LOCATIONS = true;

const DEFAULT_FOV = 75;
const DEFAULT_ASPECT = 1.5;
const DEFAULT_NEAR = 0.1;
const DEFAULT_FAR = 1000;

export interface ThreeSceneProps {
  world: World | null;
}

enum CameraMode {
  FreeFloat,
  FreeFall,
  Walking
}

const ThreeScene: React.FC<ThreeSceneProps> = (props: ThreeSceneProps) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  
  const meshRef = useRef<THREE.Mesh | null>(null);
  
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const lightRef = useRef<THREE.DirectionalLight | null>(null);

  const controlsRef = useRef<OrbitControls | PointerLockControls | null>(null);
  const freeFloatControlsRef = useRef<OrbitControls | null>(null);
  const pointerLockControlsRef = useRef<PointerLockControls | null>(null);

  const cameraModeRef = useRef<CameraMode>(CameraMode.FreeFloat);

  const fallSpeedRef = useRef(0); // Use ref to persist fall speed across renders
  const gravity = 9.81; // Simulating gravity
  const clockRef = useRef<THREE.Clock | null>(null); 


  useEffect(() => {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(600, 400);
    rendererRef.current = renderer;

    mountRef.current!.appendChild(rendererRef.current.domElement);

    const scene = new THREE.Scene();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040); // Soft ambient light
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(50, 50, 50);
    scene.add(directionalLight);
    lightRef.current = directionalLight;

    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(DEFAULT_FOV, DEFAULT_ASPECT, DEFAULT_NEAR, DEFAULT_FAR);
    camera.position.set(0, 0, 100);
    cameraRef.current = camera;

    // OrbitControls setup
    const controls = new OrbitControls(camera, rendererRef.current!.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    freeFloatControlsRef.current = controls;
    controlsRef.current = controls;

    cameraModeRef.current = CameraMode.FreeFloat;

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

    window.addEventListener('keydown', handleKeyDown);

    // Clean up on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      mountRef.current?.removeChild(renderer.domElement);
      rendererRef.current!.dispose();
    };
  }, []);

  const resetCamera = () => {
    cameraRef.current!.fov = DEFAULT_FOV;
    cameraRef.current!.aspect = DEFAULT_ASPECT;
    cameraRef.current!.near = DEFAULT_NEAR;
    cameraRef.current!.far = DEFAULT_FAR;
    cameraRef.current!.position.set(0, 0, 100);
  };


  useEffect(() => {
    // Clean up previous scene, renderer, etc.
    if (sceneRef.current) {
      while (sceneRef.current.children.length > 0) {
        sceneRef.current.remove(sceneRef.current.children[0]);
      }
    }

    // Go back to free-explore when we create a new world
    cameraModeRef.current = CameraMode.FreeFloat;

    if (!mountRef.current || !props.world || !rendererRef.current) return;

    // Reset the clock and the camera
    clockRef.current = new THREE.Clock();
    
    resetCamera();

    if (props.world.heightmap && sceneRef.current) {
      const mesh = generateMesh(props.world);
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

      if (lightRef.current) {
        sceneRef.current.add(lightRef.current);
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
  return (
    <div className='p-4'>
      <div ref={mountRef} style={{
        width: 600,  // Adjust the width of the container
        height: 400, // Adjust the height of the container
        border: '1px solid black' // Optional: add a border for visual reference
      }} />

      <Button 
        onClick={handleResetView}
        style={{ position: 'relative', bottom: '-20px', right: '-10px', zIndex: 10 }}>
        Reset View
      </Button>
      <Button  
        onClick={moveCameraAboveTownSquare}
        style={{ position: 'relative', bottom: '-20px', right: '-60px', zIndex: 10 }}>
        Go to Town Center
      </Button>
      <Button  
        onClick={() => {
          freeFloatControlsRef.current!.enabled = false;
          cameraModeRef.current = CameraMode.FreeFall;
          console.log("Free fall");
        }}
        style={{ position: 'relative', bottom: '-20px', right: '-110px', zIndex: 10 }}>
        Free Fall
      </Button>
    </div>
  );
};

export default ThreeScene;

