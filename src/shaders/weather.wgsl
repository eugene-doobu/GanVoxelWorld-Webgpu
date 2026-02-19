// Weather particle shader (rain & snow) using GPU instancing
// Each instance is one particle; 6 vertices per instance form a billboard quad.

struct WeatherUniforms {
  viewProjection: mat4x4f,
  cameraPos: vec4f,
  // x=time, y=weatherType(1=rain,2=snow), z=intensity, w=unused
  params: vec4f,
}

@group(0) @binding(0) var<uniform> u: WeatherUniforms;

struct VSOut {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
  @location(1) alpha: f32,
}

@vertex fn vs_main(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32,
) -> VSOut {
  var out: VSOut;

  let gridSize = 64u;
  let ix = instanceIndex % gridSize;
  let iz = instanceIndex / gridSize;
  let spacing = 1.0;

  // Hash per-particle for randomization
  let fIdx = f32(instanceIndex);
  let hash1 = fract(sin(fIdx * 127.1) * 43758.5453);
  let hash2 = fract(sin(fIdx * 269.5 + 37.17) * 23421.631);
  let hash3 = fract(sin(fIdx * 419.7 + 91.33) * 17345.129);

  // Snap grid to camera position (keeps particles around the player)
  let snapX = floor(u.cameraPos.x / spacing) * spacing;
  let snapZ = floor(u.cameraPos.z / spacing) * spacing;
  let baseX = snapX + (f32(ix) - f32(gridSize) / 2.0) * spacing + hash1 * spacing;
  let baseZ = snapZ + (f32(iz) - f32(gridSize) / 2.0) * spacing + hash2 * spacing;

  let time = u.params.x;
  let weatherType = u.params.y; // 1=rain, 2=snow
  let intensity = u.params.z;

  // Fall speed: rain is fast, snow is slow
  let isSnow = step(1.5, weatherType);
  let fallSpeed = mix(8.0, 1.5, isSnow);
  let baseY = u.cameraPos.y + 20.0 - fract(time * fallSpeed * (0.7 + hash1 * 0.6) + hash3) * 40.0;

  // Snow horizontal drift (sinusoidal sway)
  let driftX = isSnow * sin(time * 1.5 + fIdx * 0.37) * 0.5;
  let driftZ = isSnow * cos(time * 1.1 + fIdx * 0.73) * 0.3;

  let particlePos = vec3f(baseX + driftX, baseY, baseZ + driftZ);

  // Billboard quad (2 triangles = 6 vertices)
  // Vertex order: 0,1,2, 2,1,3  (two triangles)
  let quadIdx = vertexIndex % 6u;
  var cornerX: f32;
  var cornerY: f32;

  switch quadIdx {
    case 0u: { cornerX = -0.5; cornerY =  0.5; }
    case 1u: { cornerX = -0.5; cornerY = -0.5; }
    case 2u: { cornerX =  0.5; cornerY =  0.5; }
    case 3u: { cornerX =  0.5; cornerY =  0.5; }
    case 4u: { cornerX = -0.5; cornerY = -0.5; }
    default: { cornerX =  0.5; cornerY = -0.5; }
  }

  // Particle size: rain=thin vertical streak, snow=small square
  let sizeX = mix(0.015, 0.04, isSnow);
  let sizeY = mix(0.25, 0.04, isSnow);

  // Camera-facing billboard: extract right and up from viewProjection
  // For simplicity, use world-aligned billboard (right=X, up=Y)
  let right = vec3f(1.0, 0.0, 0.0);
  let up = vec3f(0.0, 1.0, 0.0);

  let worldPos = particlePos
    + right * cornerX * sizeX
    + up * cornerY * sizeY;

  out.position = u.viewProjection * vec4f(worldPos, 1.0);

  // UV for fragment shading
  out.uv = vec2f(cornerX + 0.5, 0.5 - cornerY);

  // Distance-based fade
  let dist = distance(particlePos, u.cameraPos.xyz);
  let distFade = 1.0 - smoothstep(20.0, 30.0, dist);
  out.alpha = intensity * distFade;

  return out;
}

@fragment fn fs_main(in: VSOut) -> @location(0) vec4f {
  let weatherType = u.params.y;
  let isSnow = step(1.5, weatherType);

  // Rain: vertical streak with center brightness
  // Snow: soft circular dot
  var alpha: f32;

  let snow = isSnow;
  if snow > 0.5 {
    // Snow: circular soft dot
    let d = distance(in.uv, vec2f(0.5, 0.5)) * 2.0;
    alpha = 1.0 - smoothstep(0.4, 1.0, d);
  } else {
    // Rain: vertical line, thin along X, fade at top/bottom
    let cx = abs(in.uv.x - 0.5) * 2.0;
    let cy = abs(in.uv.y - 0.5) * 2.0;
    let xFade = 1.0 - smoothstep(0.2, 1.0, cx);
    let yFade = 1.0 - smoothstep(0.7, 1.0, cy);
    alpha = xFade * yFade;
  }

  // Rain: slightly bluish white, Snow: pure white
  let rainColor = vec3f(0.7, 0.75, 0.85);
  let snowColor = vec3f(0.95, 0.95, 1.0);
  let color = mix(rainColor, snowColor, isSnow);

  let finalAlpha = alpha * in.alpha * 0.6;
  if finalAlpha < 0.001 {
    discard;
  }

  return vec4f(color, finalAlpha);
}
