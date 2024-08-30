"use client"

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { Button } from './ui/button';

import { MESH_THICKNESS } from '@/constants';
import { World } from '@/types';

const DEBUG_DRAW_TOWN_LOCATIONS = true;

export interface ThreeSceneProps {
  world: World | null;
}

const ThreeScene: React.FC<ThreeSceneProps> = (props: ThreeSceneProps) => {
  const meshRef = useRef<THREE.Mesh | null>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const lightRef = useRef<THREE.DirectionalLight | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  const generateMesh = (heightmap: number[][]) => {
    const canvasSize = heightmap.length;

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
      geometry.attributes.position.setZ(i / 3, heightmap[x][y] * 10); // Adjust multiplier for height scaling

      let color;
      if (heightmap[x][y] < 0.001) {
        color = new THREE.Color(0x0000ff);
      } else {
        color = new THREE.Color((8 * heightmap[x][y]), 50 + (8 * heightmap[x][y]), (8 * heightmap[x][y]));
      }

      // DEBUG
      if (x === props.world?.townSquare.x && y === props.world?.townSquare.y) {
        color = new THREE.Color(0xff00ff);
      }

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

  useEffect(() => {
    if (!mountRef.current) return;

    // Initialize the scene, camera, and renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1.5, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(600, 400);
    mountRef.current.appendChild(renderer.domElement);
    sceneRef.current = scene;

    camera.position.set(0, 0, 100);
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
    if (!props.world) return;
    if (props.world.heightmap && sceneRef.current) {
      const mesh = generateMesh(props.world.heightmap);
      meshRef.current = mesh;

      const drawTownLocations = () => {
        if (!props.world || !sceneRef.current) return;
        
        const townSquarePosition = new THREE.Vector3(
          props.world.townSquare.x - mesh.geometry.parameters.width / 2,
          (props.world.heightmap.length - props.world.townSquare.y) - mesh.geometry.parameters.height / 2,
          props.world.heightmap[props.world.townSquare.x][(props.world.heightmap.length - props.world.townSquare.y)] * MESH_THICKNESS
        );
    
        const docksPosition = new THREE.Vector3(
          props.world.docks.x - mesh.geometry.parameters.width / 2,
          (props.world.heightmap.length - props.world.docks.y) - mesh.geometry.parameters.height / 2,
          props.world.heightmap[props.world.docks.x][(props.world.heightmap.length - props.world.docks.y)] * MESH_THICKNESS
        );
    
        const templePosition = new THREE.Vector3(
          props.world.temple.x - mesh.geometry.parameters.width / 2,
          (props.world.heightmap.length - props.world.temple.y) - mesh.geometry.parameters.height / 2,
          props.world.heightmap[props.world.temple.x][(props.world.heightmap.length - props.world.temple.y)] * MESH_THICKNESS
        );
    
        const townSquareTop = new THREE.Vector3(
          townSquarePosition.x,
          townSquarePosition.y,
          townSquarePosition.z + 10
        );
    
        const docksTop = new THREE.Vector3(
          docksPosition.x,
          docksPosition.y,
          docksPosition.z + 10
        );
    
        const templeTop = new THREE.Vector3(
          templePosition.x,
          templePosition.y,
          templePosition.z + 10
        );
    
        const townSquareLine = createThickLine(townSquarePosition, townSquareTop, 0xff00ff);
        const docksLine = createThickLine(docksPosition, docksTop, 0x00ffff);
        const templeLine = createThickLine(templePosition, templeTop, 0xffff00);
        
        sceneRef.current.add(townSquareLine);
        sceneRef.current.add(docksLine);
        sceneRef.current.add(templeLine);
      };

      const drawTemple = () => {
        const normalizer = 10;
        if (!props.world || !sceneRef.current) return;

        const templePosition = new THREE.Vector3(
          props.world.temple.x - mesh.geometry.parameters.width / 2,
          (props.world.heightmap.length - props.world.temple.y) - mesh.geometry.parameters.height / 2,
          props.world.heightmap[props.world.temple.x][props.world.temple.y] * MESH_THICKNESS
        );

        console.log(props.world.heightmap[props.world.temple.x][props.world.temple.y]);

        const marbleMaterial = new THREE.MeshStandardMaterial({ color: 0xfff0ee, roughness: 0.5, metalness: 0.1 });

        // Create the Platform (elevated box)
        const platformGeometry = new THREE.CylinderGeometry(15 / normalizer, 13 / normalizer, 2 / normalizer, 32);
        const platform = new THREE.Mesh(platformGeometry, marbleMaterial);
        platform.position.set(templePosition.x, templePosition.y, templePosition.z);
        platform.rotation.x = -Math.PI / 2;
        sceneRef.current.add(platform);

        // Create a Column
        const columnGeometry = new THREE.CylinderGeometry(0.5 / normalizer, 0.5 / normalizer, 10 / normalizer, 32);

        // Position Columns around the Platform
        const columnCount = 12; // Number of columns
        const radius = 12 / normalizer; // Radius from the center to place the columns

        for (let i = 0; i < columnCount; i++) {
            const angle = (i / columnCount) * 2 * Math.PI;
            const x = radius * Math.cos(angle) + templePosition.x;
            const y = radius * Math.sin(angle) + templePosition.y;

            const column = new THREE.Mesh(columnGeometry, marbleMaterial);
            column.position.set(x, y, templePosition.z + 5 / normalizer); // 5 is half the height of the column
            column.rotation.x = -Math.PI / 2;
            sceneRef.current.add(column);
        }
      }

      const drawTownSquare = () => {
        if (!props.world || !sceneRef.current) return;
        const marbleMaterial = new THREE.MeshStandardMaterial({ color: 0xfff0ee, roughness: 0.5, metalness: 0.1 });

        const townSquarePosition = new THREE.Vector3(
          props.world.townSquare.x - mesh.geometry.parameters.width / 2,
          (props.world.heightmap.length - props.world.townSquare.y) - mesh.geometry.parameters.height / 2,
          props.world.heightmap[props.world.townSquare.x][props.world.townSquare.y] * MESH_THICKNESS
        );

        const platformGeometry = new THREE.BoxGeometry(1.2, 1.2, 0.1);
        const platform = new THREE.Mesh(platformGeometry, marbleMaterial);
        platform.position.set(townSquarePosition.x, townSquarePosition.y, townSquarePosition.z); // Raise the platform above ground level
        sceneRef.current.add(platform);
      }
    
      
      console.log(mesh);
      sceneRef.current.clear(); // Clear previous mesh
      sceneRef.current.add(mesh); // Add the new mesh

      if (DEBUG_DRAW_TOWN_LOCATIONS) drawTownLocations();

      drawTemple();
      drawTownSquare();
      

      if (ambientLightRef.current) {
        sceneRef.current.add(ambientLightRef.current);
      }

      if (lightRef.current) {
        sceneRef.current.add(lightRef.current);
      }
    }
  }, [props.world]);

  const handleResetView = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 50, 100);
      cameraRef.current.fov = 75; // Reset FOV to default
      cameraRef.current.updateProjectionMatrix();
      controlsRef.current.reset();
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
    controlsRef.current.target.copy(townSquarePosition); // Set the controls' target to the town square
    controlsRef.current.update();
  };

  // Handle WASD movement based on camera's local axes
  useEffect(() => {
    if (typeof window !== 'undefined') {

      const handleKeyDown = (event: KeyboardEvent) => {
        if (!cameraRef.current || !controlsRef.current) return;

        const moveSpeed = 10;

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

        controlsRef.current.update();
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    };
  }, []);

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
    </div>
  );
};

export default ThreeScene;

