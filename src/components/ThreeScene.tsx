"use client"

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { Button } from './ui/button';

interface ThreeSceneProps {
  mesh: THREE.Mesh | null;
}

const ThreeScene: React.FC<ThreeSceneProps> = (props: ThreeSceneProps) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const lightRef = useRef<THREE.DirectionalLight | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Initialize the scene, camera, and renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(Math.min(600, window.innerWidth), Math.min(400, window.innerHeight));
    mountRef.current.appendChild(renderer.domElement);
    sceneRef.current = scene;

    camera.position.set(0, 50, 100);
    cameraRef.current = camera;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040); // Soft ambient light
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(50, 50, 50);
    scene.add(directionalLight);
    lightRef.current = directionalLight;

    // OrbitControls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Clean up on unmount
    return () => {
      mountRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (props.mesh && sceneRef.current) {
      console.log(props.mesh);
      sceneRef.current.clear(); // Clear previous mesh
      sceneRef.current.add(props.mesh); // Add the new mesh

      if (ambientLightRef.current) {
        sceneRef.current.add(ambientLightRef.current);
      }

      if (lightRef.current) {
        sceneRef.current.add(lightRef.current);
      }
    }
  }, [props.mesh]);

  // Adjust the camera's field of view (FOV) for zooming
  const handleZoomIn = () => {
    if (cameraRef.current) {
      cameraRef.current.fov = Math.max(cameraRef.current.fov - 5, 10); // Minimum FOV of 10
      cameraRef.current.updateProjectionMatrix();
    }
  };

  const handleZoomOut = () => {
    if (cameraRef.current) {
      cameraRef.current.fov = Math.min(cameraRef.current.fov + 5, 100); // Maximum FOV of 100
      cameraRef.current.updateProjectionMatrix();
    }
  };

  const handleResetView = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 50, 100);
      cameraRef.current.fov = 75; // Reset FOV to default
      cameraRef.current.updateProjectionMatrix();
      controlsRef.current.reset();
    }
  };

  const handleCoordinatesClick = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(100, 100, 100);
      controlsRef.current.reset();
    }
  };

  // Handle WASD movement based on camera's local axes
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!cameraRef.current) return;

      const moveSpeed = 2;
      const direction = new THREE.Vector3();
      cameraRef.current.getWorldDirection(direction);

      switch (event.key) {
        case 'w':
          cameraRef.current.position.addScaledVector(direction, moveSpeed);
          break;
        case 's':
          cameraRef.current.position.addScaledVector(direction, -moveSpeed);
          break;
        case 'a':
          const rightVector = new THREE.Vector3();
          cameraRef.current.getWorldDirection(direction);
          rightVector.crossVectors(cameraRef.current.up, direction).normalize();aa
          cameraRef.current.position.addScaledVector(rightVector, -moveSpeed);
          break;
        case 'd':
          const leftVector = new THREE.Vector3();
          cameraRef.current.getWorldDirection(direction);
          leftVector.crossVectors(cameraRef.current.up, direction).normalize();
          cameraRef.current.position.addScaledVector(leftVector, moveSpeed);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className='p-4'>
      <div ref={mountRef} style={{
        width: Math.min(600, window.innerWidth),  // Adjust the width of the container
        height: Math.min(400, window.innerHeight), // Adjust the height of the container
        border: '1px solid black' // Optional: add a border for visual reference
      }} />

      <Button 
        className="reset-button" 
        onClick={handleResetView}
        style={{ position: 'relative', bottom: '-20px', right: '-10px', zIndex: 10 }}>
        Reset View
      </Button>
    </div>
  );
};

export default ThreeScene;

