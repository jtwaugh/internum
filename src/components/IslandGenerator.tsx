"use client";

import React, { useState } from 'react';
import p5 from 'p5';
import * as THREE from 'three';
import { Slider } from '@/components/ui/slider';
import { Button } from './ui/button';

interface IslandGeneratorProps {
  onMeshGenerated: (mesh: THREE.Mesh | null) => void;
}

const IslandGenerator: React.FC<IslandGeneratorProps> = (props: IslandGeneratorProps) => {
  // const canvasRef = useRef<HTMLDivElement>(null);
  const [noiseScale, setNoiseScale] = useState(0.1);
  const [canvasSize, setCanvasSize] = useState(400);
  const [threshold, setThreshold] = useState(0.5);
  const [maxDistanceFactor, setMaxDistanceFactor] = useState(1);
  const [generate, setGenerate] = useState(false);
  const [blurIterations, setBlurIterations] = useState(1);

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

  

  const generateMesh = (heightmap: number[][]) => {
    const geometry = new THREE.PlaneGeometry(
      canvasSize,
      canvasSize,
      canvasSize - 1,
      canvasSize - 1
    );

    let colors = [];

    for (let i = 0; i < geometry.attributes.position.array.length; i += 3) {
      const x = Math.floor((i / 3) % canvasSize);
      const y = Math.floor(i / 3 / canvasSize);

      // Set the Z value (height) from the heightmap
      geometry.attributes.position.setZ(i / 3, heightmap[x][y] * 10); // Adjust multiplier for height scaling

      let color;
      if (heightmap[x][y] < 0.001) {
        color = new THREE.Color(0x0000ff);
      } else {
        color = new THREE.Color((8 * heightmap[x][y]), 50 + (8 * heightmap[x][y]), (8 * heightmap[x][y]));
      }

      colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshLambertMaterial({
      vertexColors: true,
      flatShading: true,
    });

    const retMesh = new THREE.Mesh(geometry, material);

    return retMesh;
  };


  const handleGenerate = () => {
    const p5Instance = new p5((p: p5) => {});

    const heightmap = generateHeightmap(p5Instance);
    const blurredHeightmap = blurHeightmap(heightmap);
    const newMesh = generateMesh(blurredHeightmap);
  
    props.onMeshGenerated(newMesh);
  };

  return (
    <div>
      <div>
        <label>
          <span className='p-2 font-bold text-xs'>Noise Scale: {noiseScale}</span>
          <Slider
            className='w-1/6 p-2'
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
            className='w-1/6 p-2'
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
            className='w-1/6 p-2'
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
            className='w-1/6 p-2'
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
            className='w-1/6 p-2'
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
      <Button onClick={handleGenerate}>Generate</Button>
      {/* <div ref={canvasRef}></div> */}
    </div>
  );
};

export default IslandGenerator;

