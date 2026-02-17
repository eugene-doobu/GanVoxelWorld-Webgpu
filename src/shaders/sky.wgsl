struct Camera {
  viewProj: mat4x4<f32>,
  cameraPos: vec4<f32>,
  fogParams: vec4<f32>,
};

struct SkyUniforms {
  invViewProj: mat4x4<f32>,
  sunDir: vec4<f32>,
};

@group(0) @binding(0) var<uniform> camera: Camera;
@group(0) @binding(1) var<uniform> sky: SkyUniforms;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) screenUV: vec2<f32>,
};

// Fullscreen triangle from vertex ID
@vertex
fn vs_main(@builtin(vertex_index) vid: u32) -> VertexOutput {
  var output: VertexOutput;
  // Generate fullscreen triangle: 3 vertices covering [-1,1] clip space
  let x = f32(i32(vid & 1u)) * 4.0 - 1.0;
  let y = f32(i32(vid >> 1u)) * 4.0 - 1.0;
  output.position = vec4<f32>(x, y, 1.0, 1.0); // z=1.0 (far plane)
  output.screenUV = vec2<f32>(x * 0.5 + 0.5, 1.0 - (y * 0.5 + 0.5));
  return output;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  // Reconstruct world ray direction from screen UV
  let ndc = vec4<f32>(input.screenUV.x * 2.0 - 1.0, (1.0 - input.screenUV.y) * 2.0 - 1.0, 1.0, 1.0);
  let worldPos = sky.invViewProj * ndc;
  let rayDir = normalize(worldPos.xyz / worldPos.w - camera.cameraPos.xyz);

  let up = rayDir.y;

  // Sky gradient
  let zenithColor = vec3<f32>(0.35, 0.55, 0.92);  // deep blue
  let horizonColor = vec3<f32>(0.75, 0.85, 0.95);  // pale blue
  let groundColor = vec3<f32>(0.65, 0.72, 0.78);   // muted

  var skyColor: vec3<f32>;
  if (up > 0.0) {
    let t = pow(up, 0.4);
    skyColor = mix(horizonColor, zenithColor, t);
  } else {
    let t = pow(-up, 0.6);
    skyColor = mix(horizonColor, groundColor, t);
  }

  // Sun disc
  let sunDirection = normalize(sky.sunDir.xyz);
  let sunDot = dot(rayDir, sunDirection);

  // Sun core (sharp disc)
  let sunRadius = 0.9985;
  if (sunDot > sunRadius) {
    let t = (sunDot - sunRadius) / (1.0 - sunRadius);
    let sunColor = vec3<f32>(1.0, 0.98, 0.90);
    skyColor = mix(skyColor, sunColor, smoothstep(0.0, 1.0, t));
  }

  // Sun glow (soft halo)
  let glowRadius = 0.98;
  if (sunDot > glowRadius) {
    let t = (sunDot - glowRadius) / (1.0 - glowRadius);
    let glowColor = vec3<f32>(1.0, 0.95, 0.80);
    skyColor = mix(skyColor, glowColor, t * t * 0.4);
  }

  // Horizon glow near sun
  if (up > -0.1 && up < 0.3) {
    let horizonGlow = max(sunDot, 0.0);
    let warmth = vec3<f32>(1.0, 0.9, 0.7);
    let intensity = horizonGlow * horizonGlow * 0.15 * (1.0 - abs(up) * 3.0);
    skyColor = skyColor + warmth * max(intensity, 0.0);
  }

  return vec4<f32>(skyColor, 1.0);
}
