"use client";

import React, { useState, useEffect, useRef } from 'react';
import { aStarWithSlopeConstraint, pathfindToOcean } from '@/pathfind'; 

import * as Constants from '@/constants';

import { useElementWidth } from '@/useElementWidth';
import { Slider } from '@/components/ui/slider';
import { Button } from './button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

import { World, ColorsConfig, WorldGenParams } from '@/types';
import GradientBuilder from './gradient-builder';
import { ColorHexInput } from './color-hex-input';
import { generateWorldTerrain, getRandomLandTile, findHighestPoint, findClosestWaterBorder, accumulateWater, computeFlowDirection, floodFillOcean, erodeHeightmap } from '@/world-gen';


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
  const [erosionRate, setErosionRate] = useState(props.params.erosionRate);
  const [erosionIterations, setErosionIterations] = useState(props.params.erosionIterations);

  const [gradient, setGradient] = useState(Constants.DEFAULT_GRADIENT);
  const [ambientLightColor, setAmbientLightColor] = useState(Constants.DEFAULT_AMBIENT_LIGHT_COLOR);
  const [directionalLightColor, setDirectionalLightColor] = useState(Constants.DEFAULT_DIRECTIONAL_LIGHT_COLOR);

  const [paramsButtonRef, paramsButtonWidth] = useElementWidth<HTMLButtonElement>();
  const [colorsButtonRef, colorsButtonWidth] = useElementWidth<HTMLButtonElement>();


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
        blurIterations: blurIterations,
        erosionRate: erosionRate,
        erosionIterations: erosionIterations
      }
    )
  }, [noiseScale, canvasSize, threshold, maxDistanceFactor, blurIterations, erosionRate])

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
      blurIterations: blurIterations,
      erosionRate: erosionRate,
      erosionIterations: erosionIterations,
    };
    
    const blurredHeightmap = generateWorldTerrain(params);

    const oceanTiles = floodFillOcean(blurredHeightmap, params);

    let currentHeightmap = blurredHeightmap;

    let flowDirections = computeFlowDirection(currentHeightmap, oceanTiles);
    let waterAccumulation = accumulateWater(flowDirections, currentHeightmap);
    let erodedHeightmap = erodeHeightmap(currentHeightmap, flowDirections, waterAccumulation, params);

    if (params.erosionIterations > 1) {
      for (let i = 0; i < params.erosionIterations; i++) {
        currentHeightmap = erodedHeightmap;
        flowDirections = computeFlowDirection(currentHeightmap, oceanTiles);
        waterAccumulation = accumulateWater(flowDirections, currentHeightmap);
        erodedHeightmap = erodeHeightmap(currentHeightmap, flowDirections, waterAccumulation, params);
      }
    }
    

    const townSquarePosition = getRandomLandTile(erodedHeightmap, params);

    //console.log("town square coords: ", townSquarePosition);

    let templePath = null;
    let docksPath = null;

    let templePosition = null;
    let docksPosition = null;
    
    const ROADS_RETRIES = 5;

    //console.log("Starting to try temple");

    for (let i = 0; i < ROADS_RETRIES; i += 1) {
      templePosition = findHighestPoint(erodedHeightmap, townSquarePosition, Constants.TEMPLE_MIN_RADIUS, Constants.TEMPLE_MAX_RADIUS);
      templePath = aStarWithSlopeConstraint(townSquarePosition, templePosition, erodedHeightmap, 999);
      if (!(templePath === null)) {
        break;
      }
    }

    if (templePath) {
      // console.log("path to temple: ", templePath);
      // console.log("temple coords: ", templePath[templePath?.length - 1]);
    }

    //console.log("Starting to try docks");

    for (let j = 0; j < ROADS_RETRIES; j += 1) {
      docksPath = pathfindToOcean(townSquarePosition, oceanTiles, erodedHeightmap, 999);
      if (!(docksPath === null)) {
        break;
      }
    }

    if (docksPath) {
      // console.log("path to docks: ", docksPath);
      // console.log("docks coords: ", docksPath[docksPath?.length - 1]);
    }

    // const townSquarePosition = {x: 0, y: 0};
    // const templePosition = {x: 0, y: 0};
    // const docksPosition = {x: 0, y: 0};


    // TODO ocean tiles not necessarily correct
    props.onWorldGenerated(
      {
        heightmap: erodedHeightmap, 
        oceanTiles: oceanTiles,
        flowDirections: flowDirections, 
        waterAccumulation: waterAccumulation, 
        townSquare: townSquarePosition, 
        temple: templePosition, 
        docks: (docksPath) ? docksPath[docksPath?.length - 1] : null,
        templePath: templePath,
        docksPath: docksPath
      }
    );
  };

  const onGradientChanged = (newGradient: string[]) => {
    setGradient(newGradient);
  }

  if (!props.display) {
    return <></>;
  }

  return (
    <div id='island-generator-container' className='h-full' tabIndex={1}>
      <div className="border h-full flex flex-col">
        <div className="w-full p-2">
          <Button className='w-full pt-6 pb-6 border' style={{backgroundColor: "#0000aa"}} onClick={handleGenerate}><div className=' text-2xl font-extrabold'>Generate</div></Button>
        </div>
        <Tabs defaultValue="worldgen" className="flex-1 flex flex-col p-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger ref={paramsButtonRef} value="worldgen">{paramsButtonWidth > 100 ? "🌐 Parameters" : "🌐"}</TabsTrigger>
            <TabsTrigger ref={colorsButtonRef} value="colors">{colorsButtonWidth > 100 ? "🎨 Colors" : "🎨"}</TabsTrigger>
          </TabsList>
          <TabsContent value="worldgen" className='flex-1 bg-slate-50 border rounded-md p-2'>
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
                    min={0}
                    max={800}
                    step={25}
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
            <div>
              <label>
              <span className='p-2 font-bold text-xs'>Erosion Rate: {erosionRate}</span>
                <Slider
                  className='p-2'
                  min={0.0}
                  max={1.0}
                  step={0.01}
                  value={[erosionRate]}
                  onValueChange={(values) => {
                    setErosionRate(values[0]);
                  }
                    }
                />
              </label>
            </div>
            <div>
              <label>
              <span className='p-2 font-bold text-xs'>Erosion Iterations: {erosionIterations}</span>
                <Slider
                  className='p-2'
                  min={1}
                  max={10}
                  step={1}
                  value={[erosionIterations]}
                  onValueChange={(values) => {
                    setErosionIterations(values[0]);
                  }
                    }
                />
              </label>
            </div>
          </TabsContent>
          <TabsContent value="colors" className='flex-1 bg-slate-50 border rounded-md p-2'>
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default IslandGenerator;

