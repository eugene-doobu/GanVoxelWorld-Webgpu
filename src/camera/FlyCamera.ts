import { mat4, vec3 } from 'gl-matrix';
import { Config } from '../config/Config';

export class FlyCamera {
  position: vec3;
  yaw = -Math.PI / 2;
  pitch = -0.3;

  private keys = new Set<string>();
  private speed = Config.data.camera.speed;
  private rightMouseDown = false;
  private canvas: HTMLCanvasElement;

  private projection = mat4.create();
  private view = mat4.create();
  private viewProj = mat4.create();

  // Stored listener references for cleanup
  private onKeyDown: (e: KeyboardEvent) => void;
  private onKeyUp: (e: KeyboardEvent) => void;
  private onMouseDown: (e: MouseEvent) => void;
  private onMouseUp: (e: MouseEvent) => void;
  private onContextMenu: (e: Event) => void;
  private onMouseMove: (e: MouseEvent) => void;
  private onWheel: (e: WheelEvent) => void;

  constructor(canvas: HTMLCanvasElement, startPos: vec3 = vec3.fromValues(128, 90, 128)) {
    this.canvas = canvas;
    this.position = vec3.clone(startPos);

    this.onKeyDown = (e: KeyboardEvent) => {
      this.keys.add(e.code);
    };
    this.onKeyUp = (e: KeyboardEvent) => {
      this.keys.delete(e.code);
    };
    this.onMouseDown = (e: MouseEvent) => {
      if (e.button === 2) {
        this.rightMouseDown = true;
        canvas.requestPointerLock();
      }
    };
    this.onMouseUp = (e: MouseEvent) => {
      if (e.button === 2) {
        this.rightMouseDown = false;
        document.exitPointerLock();
      }
    };
    this.onContextMenu = (e: Event) => e.preventDefault();
    this.onMouseMove = (e: MouseEvent) => {
      if (!this.rightMouseDown) return;
      this.yaw += e.movementX * Config.data.camera.mouseSensitivity;
      this.pitch -= e.movementY * Config.data.camera.mouseSensitivity;
      this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));
    };
    this.onWheel = (e: WheelEvent) => {
      e.preventDefault();
      this.speed *= e.deltaY < 0 ? 1.2 : 1 / 1.2;
      this.speed = Math.max(1, Math.min(200, this.speed));
    };

    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    canvas.addEventListener('mousedown', this.onMouseDown);
    document.addEventListener('mouseup', this.onMouseUp);
    canvas.addEventListener('contextmenu', this.onContextMenu);
    document.addEventListener('mousemove', this.onMouseMove);
    canvas.addEventListener('wheel', this.onWheel, { passive: false });
  }

  destroy(): void {
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    document.removeEventListener('mouseup', this.onMouseUp);
    this.canvas.removeEventListener('contextmenu', this.onContextMenu);
    document.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('wheel', this.onWheel);
    this.keys.clear();
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
    const spd = (isShift ? Config.data.camera.fastSpeed : this.speed) * dt;

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

    mat4.lookAt(this.view, this.position, target, [0, 1, 0]);
    perspectiveZO(this.projection, Config.data.camera.fov, aspect, Config.data.camera.near, Config.data.camera.far);
    mat4.multiply(this.viewProj, this.projection, this.view);
    return this.viewProj;
  }

  getProjection(): mat4 {
    return this.projection;
  }

  getView(): mat4 {
    return this.view;
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
