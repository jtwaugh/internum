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

import { World } from '@/types';

export default function Home() {
  const [currentWorld, setCurrentWorld] = useState<World | null>(null);

  useEffect(() => {
    //console.log(currentMesh);
  }, [currentWorld]);

  return (
    <div>
      <IslandGenerator onWorldGenerated={setCurrentWorld} />
      <ThreeScene world={currentWorld}/>
    </div>
  );
}