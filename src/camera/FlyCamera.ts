import { mat4, vec3 } from 'gl-matrix';
import { CAMERA_SPEED, CAMERA_FAST_SPEED, MOUSE_SENSITIVITY, CAMERA_FOV, CAMERA_NEAR, CAMERA_FAR } from '../constants';

export class FlyCamera {
  position: vec3;
  yaw = -Math.PI / 2;
  pitch = -0.3;

  private keys = new Set<string>();
  private speed = CAMERA_SPEED;
  private rightMouseDown = false;
  private canvas: HTMLCanvasElement;

  private projection = mat4.create();
  private view = mat4.create();
  private viewProj = mat4.create();

  constructor(canvas: HTMLCanvasElement, startPos: vec3 = vec3.fromValues(128, 90, 128)) {
    this.canvas = canvas;
    this.position = vec3.clone(startPos);

    document.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
    });
    document.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    // Unreal-style: right-click to look
    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 2) {
        this.rightMouseDown = true;
        canvas.requestPointerLock();
      }
    });
    document.addEventListener('mouseup', (e) => {
      if (e.button === 2) {
        this.rightMouseDown = false;
        document.exitPointerLock();
      }
    });

    // Prevent context menu on right-click
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    document.addEventListener('mousemove', (e) => {
      if (!this.rightMouseDown) return;
      this.yaw += e.movementX * MOUSE_SENSITIVITY;
      this.pitch -= e.movementY * MOUSE_SENSITIVITY;
      this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));
    });

    // Mouse wheel to adjust speed
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.speed *= e.deltaY < 0 ? 1.2 : 1 / 1.2;
      this.speed = Math.max(1, Math.min(200, this.speed));
    }, { passive: false });
  }

  update(dt: number): void {
    const forward = vec3.fromValues(
      Math.cos(this.pitch) * Math.cos(this.yaw),
      Math.sin(this.pitch),
      Math.cos(this.pitch) * Math.sin(this.yaw),
    );
    vec3.normalize(forward, forward);

    const right = vec3.create();
    vec3.cross(right, forward, [0, 1, 0]);
    vec3.normalize(right, right);

    const move = vec3.create();
    const isShift = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    const spd = (isShift ? CAMERA_FAST_SPEED : this.speed) * dt;

    if (this.keys.has('KeyW')) vec3.scaleAndAdd(move, move, forward, spd);
    if (this.keys.has('KeyS')) vec3.scaleAndAdd(move, move, forward, -spd);
    if (this.keys.has('KeyA')) vec3.scaleAndAdd(move, move, right, -spd);
    if (this.keys.has('KeyD')) vec3.scaleAndAdd(move, move, right, spd);
    if (this.keys.has('KeyE') || this.keys.has('Space')) move[1] += spd;
    if (this.keys.has('KeyQ') || this.keys.has('KeyC')) move[1] -= spd;

    vec3.add(this.position, this.position, move);
  }

  getViewProjection(aspect: number): mat4 {
    const target = vec3.fromValues(
      this.position[0] + Math.cos(this.pitch) * Math.cos(this.yaw),
      this.position[1] + Math.sin(this.pitch),
      this.position[2] + Math.cos(this.pitch) * Math.sin(this.yaw),
    );

    mat4.lookAt(this.view, this.position as Float32Array as any, target as Float32Array as any, [0, 1, 0]);
    perspectiveZO(this.projection, CAMERA_FOV, aspect, CAMERA_NEAR, CAMERA_FAR);
    mat4.multiply(this.viewProj, this.projection, this.view);
    return this.viewProj;
  }

  getSpeed(): number {
    return this.speed;
  }
}

// WebGPU-compatible perspective: depth range [0, 1] (right-hand)
function perspectiveZO(out: mat4, fovy: number, aspect: number, near: number, far: number): mat4 {
  const f = 1.0 / Math.tan(fovy / 2);
  out[0] = f / aspect;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = f;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = far / (near - far);
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[14] = (near * far) / (near - far);
  out[15] = 0;
  return out;
}
