"use client"


import pako from 'pako';

import dynamic from 'next/dynamic';

const ThreeScene = dynamic(() => import('../components/ThreeScene'), {
  ssr: false,
});
const IslandGenerator = dynamic(() => import('../components/ui/worldgen-frame'), {
  ssr: false,
});

import React, { useState, useEffect } from "react";

import * as Constants from '@/constants';

import { ColorsConfig, DisplayParams, World, WorldGenParams } from '@/types';

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";


// Function to serialize the current configuration
const serializeConfig = (wgParams: WorldGenParams, colorsConfig: ColorsConfig) => {
  const config = {
    params: wgParams,
    colorsConfig: colorsConfig,
  };

  return JSON.stringify(config);
};

const deserializeConfig = (configString: string) => {
  const config = JSON.parse(configString);
  return config;
}


export default function Home() {
  const [currentWorld, setCurrentWorld] = useState<World | null>(null);
  const [currentColors, setCurrentColors] = useState<ColorsConfig>(
    {
      terrainGradient: Constants.DEFAULT_GRADIENT, 
      ambientLight: Constants.DEFAULT_AMBIENT_LIGHT_COLOR, 
      directionalLight: Constants.DEFAULT_DIRECTIONAL_LIGHT_COLOR
    }
  );
  const [currentParams, setCurrentParams] = useState<WorldGenParams>(
    {
      noiseScale: Constants.DEFAULT_NOISE_SCALE,
        canvasSize: Constants.DEFAULT_CANVAS_SIZE,
        threshold: Constants.DEFAULT_THRESHOLD,
        maxDistanceFactor: Constants.DEFAULT_MAX_DISTANCE_FACTOR,
        blurIterations: Constants.DEFAULT_BLUR_ITERATIONS,
        erosionRate: Constants.DEFAULT_EROSION_RATE,
        erosionIterations: Constants.DEFAULT_EROSION_ITERATIONS,
    }
  )
  const [currentDisplayParams, setCurrentDisplayParams] = useState<DisplayParams>(
    {
      drawTerrain: true,
      drawStructures: true,
      drawRoads: true,
      showStructureFlares: false,
      showWaterAccumulation: false,
      showFlowDirections: false,
      showTrees: false,
    }
  )

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // UI
  const [currentSeed, setCurrentSeed] = useState("");
  const [importText, setImportText] = useState("");
  const [copied, setCopied] = useState(false);
  const [imported, setImported] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSeed)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset the copied state after 2 seconds
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  const handleImportConfig = () => {
    function base64ToUint8Array(base64: string): Uint8Array {
      const binaryString = atob(base64);
      const len = binaryString.length;
      const uint8Array = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
          uint8Array[i] = binaryString.charCodeAt(i);
      }
      return uint8Array;
    }
  
    // TODO must validate
    const decompressedSeed = pako.inflate(base64ToUint8Array(importText), { to: 'string' });
    const newConfig = deserializeConfig(decompressedSeed);
    setCurrentParams(newConfig.params);
    setCurrentColors(newConfig.colorsConfig);
    setImported(true);
    setTimeout(() => setImported(false), 2000);
  };

  const handleExportConfig = (wgParams: WorldGenParams, colorsConfig: ColorsConfig) => {
    function uint8ArrayToBase64(uint8Array: Uint8Array): string {
      let binary = '';
      const len = uint8Array.byteLength;
      for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(uint8Array[i]);
      }
      return btoa(binary);
    }
    const serializedConfig = serializeConfig(wgParams, colorsConfig);
    const uint8Config = pako.deflate(serializedConfig);
  
    const compressedConfig = uint8ArrayToBase64(uint8Config);
  
    setCurrentSeed(compressedConfig.toString());
  };

  useEffect(() => {
    //console.log(currentMesh);
  }, [currentWorld]);

  useEffect(() => {
    //console.log(currentColors);
  }, [currentColors]);

  useEffect(() => {
    //console.log(currentParams);
  }, [currentParams]);

  useEffect(() => {
    //console.log(currentDisplayParams);
  }, [currentDisplayParams]);

  return (
    <div className='flex flex-col w-full  min-h-screen bg-slate-100'>
      <div className='p-4 flex justify-center bg-white border'>
        <Label className='text-4xl font-extrabold'>Demiurge Studio</Label>
      </div>
      <div className='flex flex-1'>
        <div className='w-1/3 flex flex-col'>
          <IslandGenerator 
            params={currentParams}
            onWorldGenerated={setCurrentWorld} 
            onColorsChanged={setCurrentColors} 
            onParamsChanged={setCurrentParams} 
            display={!isFullscreen} 
          />
        </div>
        <div className='flex-1 flex flex-col p-2'>
          <Menubar>
            <MenubarMenu>
              <MenubarTrigger>📜 File</MenubarTrigger>
              <MenubarContent>
                <MenubarItem onSelect={(e)=>{e.preventDefault()}} onPointerMove={(e)=>{e.preventDefault()}}>
                  <Popover>
                    <PopoverTrigger asChild>
                        <span>Import</span>
                    </PopoverTrigger>
                    <PopoverContent side="right" align="start">
                      <Textarea 
                      className="max-h-24 overflow-y-auto break-all" 
                      placeholder="Paste seed" 
                      value={importText} 
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setImportText(e.target.value)}
                      />
                      <Button className="w-full" onClick={handleImportConfig}>{imported ? "Uploaded!" : "Upload"} </Button>
                    </PopoverContent>
                  </Popover>
                </MenubarItem>
                <MenubarItem onSelect={(e)=>{e.preventDefault()}} onPointerMove={(e)=>{e.preventDefault()}}>
                  <Popover>
                    <PopoverTrigger asChild>
                        <span onClick={() => handleExportConfig(currentParams, currentColors)}>Export</span>
                    </PopoverTrigger>
                    <PopoverContent side="right" align="start">
                      <Textarea className="max-h-24 overflow-y-auto break-all self-start" onClick={handleCopy}>{currentSeed}</Textarea>
                      <Button className="w-full" onClick={handleCopy}>{copied ? "Copied!" : "Copy"}</Button>
                    </PopoverContent>
                  </Popover>
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger>🖌️ Edit</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>
                  adsf
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger>🔍 View</MenubarTrigger>
              <MenubarContent>
              <MenubarItem onSelect={(e)=>{e.preventDefault()}}>
                  <Checkbox 
                    checked={currentDisplayParams.drawTerrain}
                    id='show-terrain' 
                    onClick={
                      () => {
                        const newParams = {...currentDisplayParams, drawTerrain: !currentDisplayParams.drawTerrain};
                        
                        setCurrentDisplayParams(newParams);
                    }}
                  />
                  <Label htmlFor='show-structure-flares' className='px-2'>Show terrain</Label>
                </MenubarItem>
                <MenubarItem onSelect={(e)=>{e.preventDefault()}}>
                  <Checkbox 
                    checked={currentDisplayParams.drawStructures}
                    id='show-structures' 
                    onClick={
                      () => {
                        const newParams = {...currentDisplayParams, drawStructures: !currentDisplayParams.drawStructures};
                        
                        setCurrentDisplayParams(newParams);
                    }}
                  />
                  <Label htmlFor='show-structure-flares' className='px-2'>Show structures</Label>
                </MenubarItem>
                <MenubarItem onSelect={(e)=>{e.preventDefault()}}>
                  <Checkbox 
                    checked={currentDisplayParams.drawRoads}
                    id='show-structures' 
                    onClick={
                      () => {
                        const newParams = {...currentDisplayParams, drawRoads: !currentDisplayParams.drawRoads};
                        
                        setCurrentDisplayParams(newParams);
                    }}
                  />
                  <Label htmlFor='show-roads' className='px-2'>Show roads</Label>
                </MenubarItem>
                <MenubarItem onSelect={(e)=>{e.preventDefault()}}>
                  <Checkbox 
                    checked={currentDisplayParams.showStructureFlares}
                    id='show-structure-flares' 
                    onClick={
                      () => {
                        const newParams = {...currentDisplayParams, showStructureFlares: !currentDisplayParams.showStructureFlares};
                        
                        setCurrentDisplayParams(newParams);
                    }}
                  />
                  <Label htmlFor='show-structure-flares' className='px-2'>Show structure flares</Label>
                </MenubarItem>
                <MenubarItem onSelect={(e)=>{e.preventDefault()}}>
                  <Checkbox 
                    checked={currentDisplayParams.showWaterAccumulation}
                    id='show-water-accumulation' 
                    onClick={
                      () => {
                        const newParams = {...currentDisplayParams, showWaterAccumulation: !currentDisplayParams.showWaterAccumulation};
                        
                        setCurrentDisplayParams(newParams);
                    }}
                  />
                  <Label htmlFor='show-water-accumulation' className='px-2'>Show water accumulation</Label>
                </MenubarItem>
                <MenubarItem onSelect={(e)=>{e.preventDefault()}}>
                  <Checkbox 
                    checked={currentDisplayParams.showFlowDirections}
                    id='show-flow-direction' 
                    onClick={
                      () => {
                        const newParams = {...currentDisplayParams, showFlowDirections: !currentDisplayParams.showFlowDirections};
                        
                        setCurrentDisplayParams(newParams);
                    }}
                  />
                  <Label htmlFor='show-flow-direction' className='px-2'>Show flow direction</Label>
                </MenubarItem>
                <MenubarItem onSelect={(e)=>{e.preventDefault()}}>
                  <Checkbox 
                    checked={currentDisplayParams.showTrees}
                    id='show-trees' 
                    onClick={
                      () => {
                        const newParams = {...currentDisplayParams, showTrees: !currentDisplayParams.showTrees};
                        
                        setCurrentDisplayParams(newParams);
                    }}
                  />
                  <Label htmlFor='show-trees' className='px-2'>Show trees</Label>
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
          <ThreeScene world={currentWorld} colorsConfig={currentColors} displayParams={currentDisplayParams} handleFullscreenChange={setIsFullscreen}/>
        </div>
      </div>
      
    </div>
  );
}