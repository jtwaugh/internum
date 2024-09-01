"use client"


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
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    //console.log(currentMesh);
  }, [currentWorld]);

  return (
    <div>
      <IslandGenerator onWorldGenerated={setCurrentWorld} display={!isFullscreen} />
      <ThreeScene world={currentWorld} handleFullscreenChange={setIsFullscreen}/>
    </div>
  );
}