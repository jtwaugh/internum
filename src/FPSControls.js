import { Euler, Vector3 } from 'three';

const _euler = new Euler(0, 0, 0, 'ZYX'); // Use ZXY to make Z the up axis
const _vector = new Vector3();

const _changeEvent = { type: 'change' };
const _lockEvent = { type: 'lock' };
const _unlockEvent = { type: 'unlock' };

const _PI_2 = Math.PI / 2;

class FPSControls {

  constructor(camera, domElement = document.body) {
    this.camera = camera;
    this.domElement = domElement;
    this.isLocked = false;
	
    this.pointerSpeed = 1.0;

    // Bind event listeners
    this._onMouseMove = onMouseMove.bind(this);
    this._onPointerlockChange = onPointerlockChange.bind(this);
    this._onPointerlockError = onPointerlockError.bind(this);

    this.connect();
  }

  connect() {
    this.domElement.ownerDocument.addEventListener('mousemove', this._onMouseMove);
    this.domElement.ownerDocument.addEventListener('pointerlockchange', this._onPointerlockChange);
    this.domElement.ownerDocument.addEventListener('pointerlockerror', this._onPointerlockError);
  }

  disconnect() {
    this.domElement.ownerDocument.removeEventListener('mousemove', this._onMouseMove);
    this.domElement.ownerDocument.removeEventListener('pointerlockchange', this._onPointerlockChange);
    this.domElement.ownerDocument.removeEventListener('pointerlockerror', this._onPointerlockError);
  }

  dispose() {
    this.disconnect();
  }

  moveForward(distance) {
    if (!this.isLocked) return;

    // Move forward in the x-y plane (Z is up)
    _vector.setFromMatrixColumn(this.camera.matrix, 2);  // Y-axis column

    this.camera.position.addScaledVector(_vector, distance);
  }

  moveRight(distance) {
    if (!this.isLocked) return;

    // Move right in the x-y plane (Z is up)
    _vector.setFromMatrixColumn(this.camera.matrix, 0);  // X-axis column

    this.camera.position.addScaledVector(_vector, distance);
  }

  lock() {
    this.domElement.requestPointerLock();
  }

  unlock() {
    this.domElement.ownerDocument.exitPointerLock();
  }
}

// Event listeners

function onMouseMove(event) {
  if (!this.isLocked) return;

  const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
  const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

  _euler.setFromQuaternion(this.camera.quaternion);

  // Adjust yaw (horizontal rotation) to rotate around the Z axis
  _euler.z -= movementX * 0.002 * this.pointerSpeed;

  // Adjust pitch (vertical rotation) to rotate around the X axis
  _euler.x -= movementY * 0.002 * this.pointerSpeed;

  // Constrain pitch to prevent flipping (clamp X axis rotation)
  //_euler.x = Math.max(-_PI_2, Math.min(_PI_2, _euler.x));

  this.camera.quaternion.setFromEuler(_euler);

  this.camera.dispatchEvent(_changeEvent);
}

function onPointerlockChange() {
  if (this.domElement.ownerDocument.pointerLockElement === this.domElement) {
    this.isLocked = true;
    this.camera.dispatchEvent(_lockEvent);
  } else {
    this.isLocked = false;
    this.camera.dispatchEvent(_unlockEvent);
  }
}

function onPointerlockError() {
  console.error('FPSControls: Unable to use Pointer Lock API');
}

export { FPSControls };
