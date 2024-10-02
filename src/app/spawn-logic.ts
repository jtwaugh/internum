import * as THREE from "three";
import { HeightMap, MobProps, MobType } from "@/types";
import { getRandomLandTile, getRandomLandTilesInRadius } from "@/world-gen";
import { intersectPlane } from "./models";

export const spawnSheep = (heightmap: HeightMap, waterLevel: number, mesh: THREE.Mesh): MobProps[] => {
    const size = heightmap.length;
    const SKY_HEIGHT = 9001;
    let ret: MobProps[] = [];
  
    for (let flockNumber = 0; flockNumber < 10; flockNumber += 1) {
      const flockCenter = getRandomLandTile(heightmap, waterLevel);
  
      const flockSpawnPoints = getRandomLandTilesInRadius(heightmap, waterLevel, flockCenter, 5, 5);
  
      for (let i = 0; i < flockSpawnPoints.length; i += 1) {
        const tile = flockSpawnPoints[i];
        const sheepBaseX = Math.random() + tile.x  - heightmap.length / 2;
        const sheepBaseY = Math.random() + (heightmap.length - tile.y) - heightmap.length / 2
  
        const groundCollision = intersectPlane(new THREE.Vector3(sheepBaseX, sheepBaseY, SKY_HEIGHT), mesh);
  
        if (groundCollision.length !== 1) continue;
  
        const treeBaseHeight = groundCollision[0].point.z;
  
        if (treeBaseHeight < waterLevel * 10) continue;
  
        ret = ret.concat(
            {
                type: MobType.SHEEP, 
                initialState: "wandering", 
                initialLocation: new THREE.Vector3(sheepBaseX, sheepBaseY, treeBaseHeight)
            }
        );
      } 
    }
  
    return ret;
  }