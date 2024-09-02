"use client";

import React, { useState, useEffect } from 'react';
import p5 from 'p5';

import * as Constants from '@/constants';

import { Slider } from '@/components/ui/slider';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from './ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

import { World, ColorsConfig, WorldGenParams } from '@/types';
import GradientBuilder from './GradientBuilder';
import { ColorHexInput } from './ColorHexInput';


interface IslandGeneratorProps {
  onWorldGenerated: (world: World | null) => void;
  onColorsChanged: (colorsConfig: ColorsConfig) => void;
  onParamsChanged: (params: WorldGenParams) => void;
  params: WorldGenParams;
  display: boolean;
}

const IslandGenerator: React.FC<IslandGeneratorProps> = (props: IslandGeneratorProps) => {
  const [noiseScale, setNoiseScale] = useState(props.params.noiseScale);
  const [canvasSize, setCanvasSize] = useState(props.params.canvasSize);
  const [threshold, setThreshold] = useState(props.params.threshold);
  const [maxDistanceFactor, setMaxDistanceFactor] = useState(props.params.maxDistanceFactor);
  const [blurIterations, setBlurIterations] = useState(props.params.blurIterations);

  const [gradient, setGradient] = useState(Constants.DEFAULT_GRADIENT);
  const [ambientLightColor, setAmbientLightColor] = useState(Constants.DEFAULT_AMBIENT_LIGHT_COLOR);
  const [directionalLightColor, setDirectionalLightColor] = useState(Constants.DEFAULT_DIRECTIONAL_LIGHT_COLOR);


  useEffect(() => {
    props.onColorsChanged(
      {
        terrainGradient: gradient, 
        ambientLight: ambientLightColor, 
        directionalLight: directionalLightColor
      }
    );
  }, [gradient, ambientLightColor, directionalLightColor]);

  useEffect(() => {
    props.onParamsChanged(
      {
        noiseScale: noiseScale,
        canvasSize: canvasSize,
        threshold: threshold,
        maxDistanceFactor: maxDistanceFactor,
        blurIterations: blurIterations
      }
    )
  }, [noiseScale, canvasSize, threshold, maxDistanceFactor, blurIterations])

  useEffect(() => {
    setNoiseScale(props.params.noiseScale);
    setCanvasSize(props.params.canvasSize);
    setThreshold(props.params.threshold);
    setMaxDistanceFactor(props.params.maxDistanceFactor);
    setBlurIterations(props.params.blurIterations);
  }, [props.params]);

  const generateHeightmap = (p: p5): number[][] => {
    const heightmap: number[][] = [];
    const centerX = canvasSize / 2;
    const centerY = canvasSize / 2;
    const maxDistance = p.dist(0, 0, centerX, centerY) * maxDistanceFactor;

    for (let x = 0; x < canvasSize; x++) {
      heightmap[x] = [];
      for (let y = 0; y < canvasSize; y++) {
        let noiseVal = p.noise(x * noiseScale, y * noiseScale);
        let distance = p.dist(x, y, centerX, centerY);
        let normalizedDistance = distance / maxDistance;

        let islandShape = noiseVal - normalizedDistance;
        islandShape = p.constrain(islandShape, 0, 1);

        heightmap[x][y] = islandShape < threshold ? 0 : islandShape;
      }
    }

    return heightmap;
  };

  const generateGaussianKernel = (radius: number, sigma: number): number[][] => {
    const kernelSize = 2 * radius + 1;
    const kernel: number[][] = Array(kernelSize).fill(null).map(() => Array(kernelSize).fill(0));
    const sigma2 = sigma * sigma;
    const piSigma = Math.PI * sigma2;
    const normalizationFactor = 1 / (2 * piSigma);
  
    let sum = 0;
  
    for (let x = -radius; x <= radius; x++) {
      for (let y = -radius; y <= radius; y++) {
        const exponent = -(x * x + y * y) / (2 * sigma2);
        const value = normalizationFactor * Math.exp(exponent);
        kernel[x + radius][y + radius] = value;
        sum += value;
      }
    }
  
    // Normalize the kernel so that the sum of all elements is 1
    for (let x = 0; x < kernelSize; x++) {
      for (let y = 0; y < kernelSize; y++) {
        kernel[x][y] /= sum;
      }
    }
  
    return kernel;
  };

  const applyGaussianBlur = (heightmap: number[][], radius: number, sigma: number): number[][] => {
    const kernel = generateGaussianKernel(radius, sigma);

    const blurredHeightmap = heightmap.map(arr => [...arr]); // Deep copy of heightmap
    const size = heightmap.length;
  
    for (let x = radius; x < size - radius; x++) {
      for (let y = radius; y < size - radius; y++) {
        let sum = 0;
  
        for (let kx = -radius; kx <= radius; kx++) {
          for (let ky = -radius; ky <= radius; ky++) {
            const weight = kernel[kx + radius][ky + radius];
            sum += heightmap[x + kx][y + ky] * weight;
          }
        }
  
        blurredHeightmap[x][y] = sum;
      }
    }
  
    return blurredHeightmap;
  };

  const blurHeightmap = (heightmap: number[][]): number[][] => {
    let oldHeightmap = heightmap;
    let newHeightmap = heightmap;

    for (let i = 0; i < blurIterations; i++) {
      newHeightmap = oldHeightmap.map(arr => [...arr]); // Deep copy of heightmap

      for (let x = 1; x < canvasSize - 1; x++) {
        for (let y = 1; y < canvasSize - 1; y++) {
          // Average the current cell's value with its 8 neighbors
          newHeightmap[x][y] = (
            oldHeightmap[x][y] * 3 +
            oldHeightmap[x - 1][y] +
            oldHeightmap[x + 1][y] +
            oldHeightmap[x][y - 1] +
            oldHeightmap[x][y + 1] +
            oldHeightmap[x - 1][y - 1] +
            oldHeightmap[x - 1][y + 1] +
            oldHeightmap[x + 1][y - 1] +
            oldHeightmap[x + 1][y + 1]
          ) / 11;
          // console.log(heightmap[x][y], " -> ", blurredHeightmap[x][y]);
        }
      }
      oldHeightmap = newHeightmap
    }

    return newHeightmap;
  };

  const floodFillOcean = (heightmap: number[][]): boolean[][] => {
    const size = canvasSize;
    const ocean = Array(size).fill(null).map(() => Array(size).fill(false));
    const queue = [{ x: size - 1, y: 0 }]; // Start from the top-right corner
  
    while (queue.length > 0) {
      const { x, y } = queue.shift()!;
      if (ocean[x][y] || heightmap[x][y] > 0.001) continue;
  
      ocean[x][y] = true;
  
      // Check the 4-connected neighbors (up, down, left, right)
      const neighbors = [
        { x: x - 1, y }, { x: x + 1, y },
        { x, y: y - 1 }, { x, y: y + 1 }
      ];
  
      for (const neighbor of neighbors) {
        if (neighbor.x >= 0 && neighbor.x < size && neighbor.y >= 0 && neighbor.y < size) {
          queue.push(neighbor);
        }
      }
    }
  
    return ocean;
  };

  // Section for town generation

  const getRandomInt = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const getRandomLandTile = (heightmap: number[][]): { x: number; y: number } => {
    const size = heightmap.length;
    const landTiles: Array<{ x: number; y: number }> = [];
  
    // Gather all land tiles (tiles that are not underwater)
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        if (heightmap[x][y] > threshold) {
          landTiles.push({ x, y });
        }
      }
    }
  
    // If there are no land tiles, return null or handle the edge case
    if (landTiles.length === 0) {
      throw new Error("No land tiles available to place the town square.");
    }
  
    // Pick a random land tile
    const randomIndex = getRandomInt(0, landTiles.length - 1);

    const townSquareTile = landTiles[randomIndex];

    console.log(townSquareTile);
    console.log(heightmap[townSquareTile.x][townSquareTile.y]);

    return townSquareTile;
  };

  const findHighestPoint = (heightmap: number[][], center: { x: number; y: number }, minRadius: number, maxRadius: number): { x: number; y: number } => {
    const size = heightmap.length;
    let highestPoint = center;
    let maxHeight = heightmap[center.x][center.y];
  
    for (let dx = -maxRadius; dx <= maxRadius; dx++) {
      if (dx > -minRadius && dx < minRadius) continue;
      for (let dy = -maxRadius; dy <= maxRadius; dy++) {
        if (dy > -minRadius && dy < minRadius) continue;
        const x = center.x + dx;
        const y = center.y + dy;
        if (x >= 0 && y >= 0 && x < size && y < size) {
          if (heightmap[x][y] > maxHeight) {
            maxHeight = heightmap[x][y];
            highestPoint = { x, y };
          }
        }
      }
    }
  
    return highestPoint;
  };

  const findClosestWaterBorder = (heightmap: number[][], center: { x: number; y: number }): { x: number; y: number } => {
    const oceanTiles = floodFillOcean(heightmap);
    
    const size = heightmap.length;
    let closestPoint = null;
    let minDistance = Infinity;
  
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        if (oceanTiles[x][y]) {
          const distance = Math.abs(x - center.x) + Math.abs(y - center.y); // Manhattan distance
          if (distance < minDistance) {
            minDistance = distance;
            closestPoint = { x, y };
          }
        }
      }
    }
  
    return closestPoint!;
  };


  const handleGenerate = () => {
    const p5Instance = new p5((p: p5) => {});

    const heightmap = generateHeightmap(p5Instance);
    const blurredHeightmap = blurHeightmap(heightmap);
  
    const townSquarePosition = getRandomLandTile(blurredHeightmap);
    const templePosition = findHighestPoint(blurredHeightmap, townSquarePosition, Constants.TEMPLE_MIN_RADIUS, Constants.TEMPLE_MAX_RADIUS);
    const docksPosition = findClosestWaterBorder(blurredHeightmap, townSquarePosition);

    props.onWorldGenerated({heightmap: blurredHeightmap, townSquare: townSquarePosition, temple: templePosition, docks: docksPosition});
  };

  const onGradientChanged = (newGradient: string[]) => {
    console.log(newGradient);
    setGradient(newGradient);
  }

  if (!props.display) {
    return <></>;
  }

  return (
    <div id='island-generator-container' tabIndex={1}>
      <div className='p-4 flex justify-center bg-primary'>
        <Label className='text-4xl font-extrabold text-white'>Demiurge Studio</Label>
      </div>
      
      <div className="flex border-input items-center bg-primary">
        <div className="flex w-1/3 p-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">{window.innerWidth > 600 ? "Worldgen Parameters" : "🌐"}</Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div>
                <label>
                  <span className='p-2 font-bold text-xs'>Noise Scale: {noiseScale}</span>
                  <Slider
                    className='p-2'
                    min={0.01}
                    max={0.3}
                    step={0.01}
                    value={[noiseScale]}
                    onValueChange={(values) => setNoiseScale(values[0])}
                  />
                </label>
              </div>
              <div>
                <label>
                  <span className='p-2 font-bold text-xs'>Canvas Size: {canvasSize}</span>
                    <Slider
                      className='p-2'
                      min={200}
                      max={800}
                      step={50}
                      value={[canvasSize]}
                      onValueChange={(values) => setCanvasSize(values[0])}
                    />
                </label>
              </div>
              <div>
                <label>
                <span className='p-2 font-bold text-xs'>Max Distance Factor: {maxDistanceFactor}</span>
                  <Slider
                    className='p-2'
                    min={0.5}
                    max={2}
                    step={0.1}
                    value={[maxDistanceFactor]}
                    onValueChange={(values) => setMaxDistanceFactor(values[0])}
                  />
                </label>
              </div>
              <div>
                <label>
                <span className='p-2 font-bold text-xs'>Threshold: {threshold}</span>
                  <Slider
                    className='p-2'
                    min={0.0}
                    max={1.0}
                    step={0.05}
                    value={[threshold]}
                    onValueChange={(values) => setThreshold(values[0])}
                  />
                </label>
              </div>
              <div>
                <label>
                <span className='p-2 font-bold text-xs'>Blur Iterations: {blurIterations}</span>
                  <Slider
                    className='p-2'
                    min={0.0}
                    max={10.0}
                    step={1.0}
                    value={[blurIterations]}
                    onValueChange={(values) => {
                      setBlurIterations(values[0]);
                    }
                      }
                  />
                </label>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex w-1/3 p-2 justify-center">
        <Button className='pt-6 pb-6 border' style={{backgroundColor: "#0000aa"}} onClick={handleGenerate}><div className='text-2xl font-extrabold'>Generate</div></Button>
      </div>
        <div className="flex w-1/3 p-2 justify-end">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">{window.innerWidth > 600 ? "Color Parameters" : "🎨"}</Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <ColorHexInput text="Ambient Light" value={ambientLightColor} placeholder={Constants.DEFAULT_AMBIENT_LIGHT_COLOR} onChange={setAmbientLightColor}></ColorHexInput>
              <ColorHexInput text="Directional Light" value={directionalLightColor} placeholder={Constants.DEFAULT_DIRECTIONAL_LIGHT_COLOR} onChange={setDirectionalLightColor}></ColorHexInput>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className='flex'>
                    <div className='w-1/2 text-start'>Gradient</div> 
                    <div className='w-1/2 border h-full rounded-md mr-2 ml-4' style={{
                          background: `linear-gradient(180deg, ${gradient[3]}, ${gradient[2]}, ${gradient[1]}, ${gradient[0]})`,
                        }}/>
                  </AccordionTrigger>
                  <AccordionContent>
                    <GradientBuilder currentGradient={gradient} onChange={onGradientChanged}/>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      
    
    </div>
  );
};

export default IslandGenerator;

