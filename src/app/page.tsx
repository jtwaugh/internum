"use client"

import ThreeScene from "../components/ThreeScene";
import IslandGenerator from "../components/IslandGenerator";
import * as THREE from 'three';

import { useState, useEffect } from "react";


export default function Home() {
  const [currentMesh, setCurrentMesh] = useState<THREE.Mesh | null>(null);

  useEffect(() => {
    //console.log(currentMesh);
  }, [currentMesh]);

  return (
    <div>
      <IslandGenerator onMeshGenerated={setCurrentMesh} />
      <ThreeScene mesh={currentMesh}/>
    </div>
  );
}