"use client"

// import ThreeScene from "../components/ThreeScene";
// import IslandGenerator from "../components/IslandGenerator";
import * as THREE from 'three';

import dynamic from 'next/dynamic';

const ThreeScene = dynamic(() => import('../components/ThreeScene'), {
  ssr: false,
});
const IslandGenerator = dynamic(() => import('../components/IslandGenerator'), {
  ssr: false,
});

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