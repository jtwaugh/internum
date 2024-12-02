import * as THREE from 'three';
import { intersectPlane } from './models';

export class Mob {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    state: string;
    mesh: THREE.Mesh;

    constructor(position: THREE.Vector3, model: THREE.Mesh) {
        this.position = position;
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.state = "wandering";
        this.mesh = model;

        // Initialize the mesh's position
        this.mesh.position.set(position.x, position.y, position.z);
    }

    update(delta: number) {
       
    }
};

export class Sheep extends Mob {
    
};