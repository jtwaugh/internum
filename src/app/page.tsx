"use client"


import pako from 'pako';

import dynamic from 'next/dynamic';

const ThreeScene = dynamic(() => import('../components/ThreeScene'), {
  ssr: false,
});
const IslandGenerator = dynamic(() => import('../components/ui/worldgen-frame'), {
  ssr: false,
});

import { useState, useEffect } from "react";

import * as Constants from '@/constants';

import { ColorsConfig, World, WorldGenParams } from '@/types';

import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar";
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
        blurIterations: Constants.DEFAULT_BLUR_ITERATIONS
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
    console.log('Decompressed config:', decompressedSeed);
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
  
    console.log('Serialized Config:', serializedConfig);
    console.log('Compressed Config:', compressedConfig);
    setCurrentSeed(compressedConfig.toString());
  };

  useEffect(() => {
    //console.log(currentMesh);
  }, [currentWorld]);

  useEffect(() => {
    //console.log(currentColors);
  }, [currentColors]);

  useEffect(() => {
    console.log(currentParams);
  }, [currentParams]);

  return (
    <div className='flex flex-col w-full  min-h-screen bg-slate-100'>
      <div className='p-4 flex justify-center bg-primary border'>
        <Label className='text-4xl font-extrabold text-white'>Demiurge Studio</Label>
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
        <div className='flex-1 flex flex-col'>
          <Menubar className='bg-primary'>
            <MenubarMenu>
              <MenubarTrigger className='text-white'>File</MenubarTrigger>
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
          </Menubar>
          <ThreeScene world={currentWorld} colorsConfig={currentColors} handleFullscreenChange={setIsFullscreen}/>
        </div>
      </div>
      
    </div>
  );
}