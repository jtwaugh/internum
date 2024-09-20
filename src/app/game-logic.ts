import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";

import * as Constants from '@/constants';
import { FPSControls } from "@/FPSControls";
import { intersectPlane } from "@/app/models";
import { ColorsConfig } from "@/types";

export enum CameraMode {
    FreeFloat,
    Walking,
    FlyHack
  }

export interface InputState {
    moveForward: boolean;
    moveBackward: boolean;
    moveLeft: boolean;
    moveRight: boolean;
    canJump: boolean;
}

export interface GameEnvironmentLighting {
    ambientLight: THREE.AmbientLight;
    directionalLight: THREE.DirectionalLight;
}

export interface GameEnvironmentLayers {
     terrainMesh: THREE.Mesh | null;
     waterMesh: THREE.Mesh | null;
     flares: (THREE.Mesh | null)[];
     structures: THREE.Mesh[];
     roads: THREE.Line[];
     arrows: THREE.Group | null;
     waterAccumulation: THREE.Group | null;
     treesGroups: THREE.Group[];

    [key: string]: THREE.Mesh | THREE.Line | THREE.Group | (THREE.Mesh | null)[] | THREE.Mesh[] | THREE.Line[] | THREE.Group[] | null;
}

const EMPTY_LAYERS = {
    terrainMesh: null,
    waterMesh: null,
    flares: [],
    structures: [],
    roads: [],
    arrows: null,
    waterAccumulation: null,
    treesGroups: []
}

type LayerType = THREE.Mesh | THREE.Line | THREE.Group;
type LayerObject = LayerType | (LayerType | null)[];

export class GameEnvironment {
    clock: THREE.Clock;

    cameraMode: CameraMode;
    camera: THREE.PerspectiveCamera;

    scene: THREE.Scene;
    
    orbitControls: OrbitControls;
    fpsControls: FPSControls;

    controls: OrbitControls | FPSControls;

    input: InputState = {
        moveForward: false,
        moveBackward: false,
        moveLeft: false,
        moveRight: false,
        canJump: false,
    };

    velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

    gravity: number = 9.81;
    moveSpeed: number = 10;

    layers: GameEnvironmentLayers = EMPTY_LAYERS;

    lighting: GameEnvironmentLighting;
    
    constructor (renderer: THREE.WebGLRenderer, colorsConfig: ColorsConfig) {
        this.clock = new THREE.Clock();

        this.cameraMode = CameraMode.FreeFloat;
        this.camera = new THREE.PerspectiveCamera();

        this.orbitControls = new OrbitControls(this.camera, renderer.domElement);
        this.orbitControls.enableDamping = true;
        this.orbitControls.dampingFactor = 0.05;
        this.fpsControls = new FPSControls(this.camera, renderer.domElement);
        this.fpsControls.domElement.ownerDocument.addEventListener('lock', () => {
            //console.log('Pointer locked');
          });
        this.fpsControls.domElement.ownerDocument.addEventListener('unlock', () => {
            //console.log('Pointer unlocked');
        });

        this.controls = this.orbitControls; // TODO ensure this is a pointer

        this.lighting = {
            ambientLight: new THREE.AmbientLight(colorsConfig.ambientLight),
            directionalLight: new THREE.DirectionalLight(colorsConfig.directionalLight, 100)
        };

        this.lighting.directionalLight.position.set(50, 50, 50);

        this.scene = new THREE.Scene();
        this.scene.add(this.lighting.ambientLight);
        this.scene.add(this.lighting.directionalLight);
    }

    handleKeyDown (event: globalThis.KeyboardEvent) {
        // If we're in free-float mode
        if (this.controls instanceof OrbitControls) {
            //console.log("Orbit lock movement");
            switch (event.key) {
              case 'w':
                let north = new THREE.Vector3(0, 1, 0);
                this.controls.target.addScaledVector(north, this.moveSpeed);
                this.camera.position.addScaledVector(north, this.moveSpeed);
                break;
              case 's':
                let south = new THREE.Vector3(0, -1, 0);
                this.controls.target.addScaledVector(south, this.moveSpeed);
                this.camera.position.addScaledVector(south, this.moveSpeed);
                break;
              case 'a':
                let west = new THREE.Vector3(-1, 0, 0);
                this.controls.target.addScaledVector(west, this.moveSpeed);
                this.camera.position.addScaledVector(west, this.moveSpeed);
                break;
              case 'd':
                let east = new THREE.Vector3(1, 0, 0);
                this.controls.target.addScaledVector(east, this.moveSpeed);
                this.camera.position.addScaledVector(east, this.moveSpeed);
                break;
            }
            this.orbitControls.update();
        } else if (this.controls instanceof FPSControls) {
            // Event listener to lock pointer when user clicks on the canvas
            //console.log(event);
            switch (event.key) {
              case 'w':
                this.input.moveForward = true;
                this.input.moveBackward = false;
                break;
              case 's':
                this.input.moveBackward = true;
                this.input.moveForward = false;
                break;
              case 'a':
                this.input.moveLeft = true;
                this.input.moveRight = false;
                break;
              case 'd':
                this.input.moveRight = true;
                this.input.moveLeft = false;
                break;
              case ' ':
                //console.log("Spacebar");
                if (this.input.canJump) {
                  //console.log("Jumping");
                  this.velocity.z = this.moveSpeed * 2; // Jump logic (adjust as necessary)
                  this.input.canJump = false;
                }
              default:
                this.input.moveForward = false;
                this.input.moveBackward = false;
                this.input.moveLeft = false;
                this.input.moveRight = false;
                break;
            }
        }
    }

    handleKeyUp (event: globalThis.KeyboardEvent) {
        // Reset velocity when key is released
        switch (event.key) {
            case 'w':
                this.input.moveForward = false;
            break;
            case 's':
                this.input.moveBackward = false;
            break;
            case 'a':
                this.input.moveLeft = false;
            break;
            case 'd':
                this.input.moveRight = false;
            break;
        }
    }

    addMesh(mesh: THREE.Mesh) {
        this.scene.add(mesh);
    }
    
    removeMesh(mesh: THREE.Mesh) {
        this.scene.remove(mesh);
    }

    removeLayer<K extends keyof GameEnvironmentLayers>(layerName: K) {
        const layer = this.layers[layerName];
        if (Array.isArray(layer)) {
            layer.forEach(obj => {
                if (obj) this.scene.remove(obj);
            });
        } else {
            // If it's a single object, remove it from the scene
            if (layer) this.scene.remove(layer as any);
        }
    }

     // Generic function to add a layer
    setLayer<K extends keyof GameEnvironmentLayers>(layerName: K, newObject: LayerObject) {
        // Check if the layer exists in the layers object
        if (!(layerName in this.layers)) {
            console.error(`Layer "${layerName}" does not exist in layers`);
            return;
        }

        // Remove old objects from the scene
        this.removeLayer(layerName);

        // Replace the layer
        if (!(typeof newObject === typeof this.layers[layerName])) {
            console.error("Bad layer assignment!");
            return;
        } else {
            this.layers[layerName] = newObject as GameEnvironmentLayers[K];
        }

        // Add the object(s) to the scene
        if (Array.isArray(newObject)) {
            newObject.forEach(obj => { if (obj) this.scene.add(obj) });
        } else {
            this.scene.add(newObject);
        }
    }

    removeAllLayers () {
        this.layers = EMPTY_LAYERS;
    }

    emptySceneBuffer () {
        while (this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }
    }

    resetLights() {
        this.scene.add(this.lighting.ambientLight);
        this.scene.add(this.lighting.directionalLight);
    }

    returnToOverview () {
        this.cameraMode = CameraMode.FreeFloat;
        this.camera = resetCamera(this.camera);
        this.camera.updateProjectionMatrix();
        this.orbitControls.reset();
        this.orbitControls.enabled = true;
        this.controls = this.orbitControls;
        this.fpsControls.unlock();
        this.camera.position.set(0, 0, 100);
        this.orbitControls.target.copy(new THREE.Vector3(0, 0, 0));

        this.fpsControls.domElement.removeEventListener('click', () => {
            if (this.controls instanceof FPSControls) {
                this.fpsControls.lock();
            }
        });
    }
    
    moveCameraAbovePosition (position: THREE.Vector3) {
        this.returnToOverview();
        this.camera.position.set(position.x, position.y, 50); // Adjust the Z position for height
        this.orbitControls.target.copy(position); // Set the controls' target to the town square
        this.orbitControls.update();
    };

    turnGravityOn () {
        this.orbitControls.enabled = false;
        this.controls = this.fpsControls;

        this.fpsControls.domElement.addEventListener('click', () => {
            if (this.controls instanceof FPSControls) {
                this.fpsControls.lock();
            }
        });
        this.cameraMode = CameraMode.Walking;
    }

    turnFlyHackOn () {
        this.orbitControls.enabled = false;
        this.controls = this.fpsControls;
        this.fpsControls.domElement.addEventListener('click', () => {
            if (this.controls instanceof FPSControls) {
                this.fpsControls.lock();
            }
        });
        this.cameraMode = CameraMode.FlyHack;
    }

    advanceFrame () {
        const delta = this.clock.getDelta();
        // Update the camera's fall if in free-fall mode
        if (this.cameraMode === CameraMode.Walking) {
            let collisionResults: THREE.Intersection[] = [];
            
            if (this.layers.terrainMesh) {
                collisionResults = intersectPlane(new THREE.Vector3(this.camera.position.x, this.camera.position.y, 999), this.layers.terrainMesh!);
            }
    
            const moveSpeed = 10;
    
            if (collisionResults.length > 0) {
                if (collisionResults[0].point.z > this.camera.position.z + this.velocity.z * delta - 0.5) {
                //console.log("Ground is at ", collisionResults[0].point.z);
                //console.log("You are going from ", env.camera.position.z, " to ", env.camera.position.z + velocityRef.current.z * delta,  " this frame");
                // This will pop us out of the ground
                this.camera.position.z = collisionResults[0].point.z + 0.5;
    
                //console.log("We put you at ", env.camera.position.z = collisionResults[0].point.z + 0.5);
                
                if (this.velocity.z < 0.0001) {
                    //console.log("Hit ground");
                    this.velocity.z = 0;
                } else {
                    //console.log("Jumping");
                    this.camera.position.z += this.velocity.z * delta;
                }
                
                // Update velocity with delta
                if (Math.abs(this.velocity.x) < 0.01) {
                    //console.log("Zeroing x velocity");
                    this.velocity.x = 0;  
                } else {
                    //console.log("X friction");
                    this.velocity.x -= this.velocity.x * 10.0 * delta;
                }
                if (Math.abs(this.velocity.y) < 0.01) {
                    //console.log("Zeroing y velocity");
                    this.velocity.y = 0;  
                } else {
                    //console.log("Y friction from ", velocity.y, " to ", velocity.y * 10.0 * delta);
                    this.velocity.y -= this.velocity.y * 10.0 * delta;
                }
                
    
                // Update movement direction based on user input (WASD keys)
                if (this.input.moveForward) this.velocity.y += moveSpeed * delta;
                if (this.input.moveBackward) this.velocity.y -= moveSpeed * delta;
                if (this.input.moveLeft) this.velocity.x -= moveSpeed * delta;
                if (this.input.moveRight) this.velocity.x += moveSpeed * delta;
    
                // We can jump if we are on the ground
                this.input.canJump = true;
                } else {
                //console.log("Falling");
                this.camera.position.z += this.velocity.z * delta;
                this.velocity.z -= this.gravity * delta; // Increase fall speed due to gravity
                }
            }
    
            // Apply movement to the PointerLockControls
            (this.controls as FPSControls).moveRight(this.velocity.x * delta);
            (this.controls as FPSControls).moveForward(-1 * this.velocity.y * delta);
        
        } else if (this.cameraMode === CameraMode.FlyHack) {
            // Update velocity with delta
            this.velocity.x -= this.velocity.x * 10.0 * delta;
            this.velocity.y -= this.velocity.y * 10.0 * delta;
    
            // Update movement direction based on user input (WASD keys)
            if (this.input.moveForward) this.velocity.y += this.moveSpeed * delta;
            if (this.input.moveBackward) this.velocity.y -= this.moveSpeed * delta;
            if (this.input.moveLeft) this.velocity.x -= this.moveSpeed * delta;
            if (this.input.moveRight) this.velocity.x += this.moveSpeed * delta;
    
            // Apply movement to the PointerLockControls
            (this.controls as FPSControls).moveRight(this.velocity.x * delta);
            (this.controls as FPSControls).moveForward(-1 * this.velocity.y * delta);
    
        } else if (this.cameraMode === CameraMode.FreeFloat) {
            (this.controls as OrbitControls).update();
        }
    }
}

export const resetCamera = (camera: THREE.PerspectiveCamera) => {
    camera.fov = Constants.DEFAULT_FOV;
    camera.aspect = Constants.DEFAULT_ASPECT;
    camera.near = Constants.DEFAULT_NEAR;
    camera.far = Constants.DEFAULT_FAR;
    camera.position.set(0, 0, 100);
    return camera;
};
