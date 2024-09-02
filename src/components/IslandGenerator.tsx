"use client";

import React, { useState, useEffect } from 'react';

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
import { generateWorldTerrain, getRandomLandTile, findHighestPoint, findClosestWaterBorder } from '@/world-gen';


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


  const handleGenerate = () => {
    const params = {
      noiseScale: noiseScale,
      canvasSize: canvasSize,
      threshold: threshold,
      maxDistanceFactor: maxDistanceFactor,
      blurIterations: blurIterations
    };
    
    const blurredHeightmap = generateWorldTerrain(params);
    const townSquarePosition = getRandomLandTile(blurredHeightmap, params);
    const templePosition = findHighestPoint(blurredHeightmap, townSquarePosition, Constants.TEMPLE_MIN_RADIUS, Constants.TEMPLE_MAX_RADIUS);
    const docksPosition = findClosestWaterBorder(blurredHeightmap, townSquarePosition, params);

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

