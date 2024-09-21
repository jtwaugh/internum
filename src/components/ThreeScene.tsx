"use client"

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

import { Button } from './ui/button';

import { ColorsConfig, DisplayParams, World } from '@/types';

import { SceneManager } from './scene-manager';

export interface ThreeSceneProps {
  world: World | null;
  colorsConfig: ColorsConfig;
  displayParams: DisplayParams;
  handleFullscreenChange: Function;
}

const useDisplayParamEffect = (
  paramValue: boolean,
  paramName: string,
  callback: (paramName: string) => void
) => {
  useEffect(() => {
    console.log(`Display parameter ${paramName} changed.`);
    callback(paramName);
  }, [paramValue]);
};

const ThreeScene: React.FC<ThreeSceneProps> = (props: ThreeSceneProps) => {
  // Components
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const fullscreenButton = document.getElementById('fullscreen-btn');
  const [cameraModeString, setCameraModeString] = useState<string>("Free Float");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const sceneManagerRef = useRef<SceneManager | null>(null);

  const resizeRendererToDisplaySize = () => {
    const width = mountRef.current?.clientWidth;
    const height = mountRef.current?.clientHeight;
  
    // Set the renderer size
    rendererRef.current?.setSize(width!, height!);
    sceneManagerRef.current?.handleDisplayResize(width!, height!);
  }

  useEffect(() => {
    if (!rendererRef.current) {
      rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
    }
    mountRef.current!.appendChild(rendererRef.current.domElement);
    resizeRendererToDisplaySize();

    // Constructor: KeyEvents setup
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      sceneManagerRef.current?.handleKeyDown(event);
    };

    const handleKeyUp = (event: globalThis.KeyboardEvent) => {
      sceneManagerRef.current?.handleKeyUp(event);
    };

    window.addEventListener('resize', resizeRendererToDisplaySize);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Return cleanup callback
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      mountRef.current?.removeChild(rendererRef.current!.domElement);
      rendererRef.current!.dispose();
    };
  }, []);

  let keyName: keyof DisplayParams;
  for (keyName in props.displayParams) {
    useDisplayParamEffect(props.displayParams[keyName], keyName, (paramName) => {sceneManagerRef.current?.toggleLayer(paramName, props.displayParams[paramName]);});
  }

  useEffect(() => {
    sceneManagerRef.current?.env.setDirectionalLight(props.colorsConfig.directionalLight);
  }, [props.colorsConfig.directionalLight]);

  useEffect(() => {
    sceneManagerRef.current?.env.setAmbientLight(props.colorsConfig.ambientLight);
  }, [props.colorsConfig.ambientLight]);


  useEffect(() => {
    if (!mountRef.current || !rendererRef.current || !props.world) return;

    sceneManagerRef.current = new SceneManager(rendererRef.current, props.world, props.colorsConfig);

    const sm = sceneManagerRef.current;

    if (!sm) return;

    sm.resetScene(props.displayParams);
    let animationId: number;

    const animate = () => {
        animationId = requestAnimationFrame(animate);
        sm.env.advanceFrame();
        rendererRef.current!.render(sm.env.scene, sm.env.camera);
    };

    animate();

    return () => cancelAnimationFrame(animationId);
  }, [props.world]);

  const onFullscreenClick = () => {
    return;
    const shouldBeFullscreen = !isFullscreen;
    if (shouldBeFullscreen) {
      rendererRef.current!.setSize(window.innerWidth, window.innerHeight);
    } else {
      resizeRendererToDisplaySize();
    }
    setIsFullscreen(shouldBeFullscreen);
    props.handleFullscreenChange(shouldBeFullscreen);
  }

  return (
    <div ref={containerRef} id='three-container' tabIndex={0} className='p-4 flex-1'>
      <div className='h-full justify-center'>
        <div id="fullscreen-button-container" className="relative">
          <Button id="fullscreen-btn" onClick={onFullscreenClick} className="absolute top-1 right-2 z-10 p-4 bg-black bg-opacity-50 text-white border-none cursor-pointer text-sm hover:bg-opacity-70">
          『』
          </Button>
        </div>

        <div id="cameramode-label-container" className='relative'>
          <div className='flex p-4 absolute top-1 left-1 z-10'>
            <span className='px-4 py-2 bg-black bg-opacity-50 text-white border-none cursor-pointer text-sm hover:bg-opacity-70'>
              Camera Mode: {cameraModeString}
            </span>
          </div>
        </div>

        <div ref={mountRef} className='h-full w-full bg-primary'/>
        

        <div id="buttons-container" className='relative'>
          <div className='flex p-4 absolute bottom-1 left-1 z-10'>
              <Button className='px-4 py-2 bg-black bg-opacity-50 text-white border-none cursor-pointer text-sm hover:bg-opacity-70'
                onClick={() => {
                  if (sceneManagerRef.current) {
                    setCameraModeString("Free Float");
                    sceneManagerRef.current.env.returnToOverview();
                  }
                }}>
                🗺️
              </Button>
              <Button className='px-4 py-2 bg-black bg-opacity-50 text-white border-none cursor-pointer text-sm hover:bg-opacity-70'
                onClick={() => {
                  if (sceneManagerRef.current) {
                    setCameraModeString("Free Float");
                    sceneManagerRef.current.env.moveCameraAbovePosition(new THREE.Vector3(
                      props.world!.townSquare.x - (sceneManagerRef.current.env.layers.terrainMesh!.geometry as THREE.PlaneGeometry).parameters.width / 2,
                      (props.world!.heightmap.length - props.world!.townSquare.y) - (sceneManagerRef.current.env.layers.terrainMesh!.geometry as THREE.PlaneGeometry).parameters.height / 2,
                      10
                    ));
                  }
                }}>
                🏘️
              </Button>
              <Button className='px-4 py-2 bg-black bg-opacity-50 text-white border-none cursor-pointer text-sm hover:bg-opacity-70'
                onClick={() => {
                  if (sceneManagerRef.current) {
                    setCameraModeString("Gravity On");
                    sceneManagerRef.current.env.turnGravityOn();
                  }
                }}>
                🪂
              </Button>
              <Button className='px-4 py-2 bg-black bg-opacity-50 text-white border-none cursor-pointer text-sm hover:bg-opacity-70'
                onClick={() => {
                  if (sceneManagerRef.current) {
                    setCameraModeString("Fly-Hack");
                    sceneManagerRef.current.env.turnFlyHackOn();
                  }
                }}>
                🛩️
              </Button>
          </div>
        </div>  
      </div>
    </div>
  );
};

export default ThreeScene;

