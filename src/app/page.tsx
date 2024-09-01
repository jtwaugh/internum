"use client"


import dynamic from 'next/dynamic';

const ThreeScene = dynamic(() => import('../components/ThreeScene'), {
  ssr: false,
});
const IslandGenerator = dynamic(() => import('../components/IslandGenerator'), {
  ssr: false,
});

import { useState, useEffect } from "react";

import { DEFAULT_AMBIENT_LIGHT_COLOR, DEFAULT_DIRECTIONAL_LIGHT_COLOR, DEFAULT_GRADIENT } from '@/constants';

import { ColorsConfig, World } from '@/types';

export default function Home() {
  const [currentWorld, setCurrentWorld] = useState<World | null>(null);
  const [currentColors, setCurrentColors] = useState<ColorsConfig>({terrainGradient: DEFAULT_GRADIENT, ambientLight: DEFAULT_AMBIENT_LIGHT_COLOR, directionalLight: DEFAULT_DIRECTIONAL_LIGHT_COLOR});

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    //console.log(currentMesh);
  }, [currentWorld]);

  useEffect(() => {
    console.log(currentColors);
  }, [currentColors]);

  return (
    <div>
      <IslandGenerator onWorldGenerated={setCurrentWorld} onColorsChanged={setCurrentColors} display={!isFullscreen} />
      <ThreeScene world={currentWorld} colorsConfig={currentColors} handleFullscreenChange={setIsFullscreen}/>
    </div>
  );
}