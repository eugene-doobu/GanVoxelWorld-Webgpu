// Volumetric cloud ray-march shader (half-res fullscreen fragment)
// Perlin-Worley FBM: simplex for large shape, Worley for cumulus erosion.

#include "common/constants.wgsl"
#include "common/noise.wgsl"

struct CloudUniforms {
  invViewProj: mat4x4<f32>,       // 0
  cameraPos: vec4<f32>,           // 64: xyz=pos, w=time
  lightDir: vec4<f32>,            // 80: xyz=dir, w=trueSunHeight
  sunColor: vec4<f32>,            // 96: rgb=color, w=intensity
  cloudParams1: vec4<f32>,        // 112: x=coverage, y=density, z=cloudBase, w=cloudHeight
  cloudParams2: vec4<f32>,        // 128: x=windSpeed, y=detailStrength, z=multiScatterFloor, w=silverLining
  cloudParams3: vec4<f32>,        // 144: x=windDirX, y=windDirZ, z=phaseG1, w=phaseG2
};

@group(0) @binding(0) var<uniform> cloud: CloudUniforms;
@group(0) @binding(1) var gDepth: texture_depth_2d;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@vertex
fn vs_main(@builtin(vertex_index) vid: u32) -> VertexOutput {
  var output: VertexOutput;
  let x = f32(i32(vid & 1u)) * 4.0 - 1.0;
  let y = f32(i32(vid >> 1u)) * 4.0 - 1.0;
  output.position = vec4<f32>(x, y, 0.0, 1.0);
  output.uv = vec2<f32>(x * 0.5 + 0.5, 1.0 - (y * 0.5 + 0.5));
  return output;
}

fn hgPhase(cosTheta: f32, g: f32) -> f32 {
  let g2 = g * g;
  let num = 1.0 - g2;
  let denom = max(4.0 * PI * pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5), 0.0001);
  return num / denom;
}

// Ray-slab intersection: returns (tMin, tMax), negative if no hit
fn raySlab(ro: vec3<f32>, rd: vec3<f32>, slabMin: f32, slabMax: f32) -> vec2<f32> {
  if (abs(rd.y) < 0.0001) {
    if (ro.y >= slabMin && ro.y <= slabMax) {
      return vec2<f32>(0.0, 1000.0);
    }
    return vec2<f32>(-1.0, -1.0);
  }
  let t0 = (slabMin - ro.y) / rd.y;
  let t1 = (slabMax - ro.y) / rd.y;
  return vec2<f32>(min(t0, t1), max(t0, t1));
}

// ---- Noise ----

// 3D hash → vec3 [0, 1] for Worley feature points
fn hash33(p: vec3f) -> vec3f {
  var q = vec3f(
    dot(p, vec3f(127.1, 311.7,  74.7)),
    dot(p, vec3f(269.5, 183.3, 246.1)),
    dot(p, vec3f(113.5, 271.9, 124.6)),
  );
  return fract(sin(q) * 43758.5453123);
}

// Worley (cellular) noise — returns [0, 1], 0 = near cell center
fn worley3d(p: vec3f) -> f32 {
  let ip = floor(p);
  let fp = fract(p);
  var minDist = 1.0;
  for (var x = -1; x <= 1; x++) {
    for (var y = -1; y <= 1; y++) {
      for (var z = -1; z <= 1; z++) {
        let nb = vec3f(f32(x), f32(y), f32(z));
        let rp = hash33(ip + nb);
        let diff = nb + rp - fp;
        minDist = min(minDist, dot(diff, diff));
      }
    }
  }
  return sqrt(clamp(minDist, 0.0, 1.0));
}

// Simplex FBM — large-scale cloud shape [0, 1]
fn fbmShape(p: vec3f) -> f32 {
  var value = 0.0;
  var amp = 0.5;
  var pos = p;
  for (var i = 0u; i < 4u; i++) {
    value += (snoise3d(pos) * 2.0 - 1.0) * amp;
    pos *= 2.1;
    amp *= 0.5;
  }
  return clamp(value * 0.5 + 0.5, 0.0, 1.0);
}

// Inverted FBM Worley — cumulus erosion detail [0, 1]
fn fbmWorley(p: vec3f) -> f32 {
  var value = 0.0;
  var amp = 0.5;
  var pos = p;
  for (var i = 0u; i < 3u; i++) {
    value += (1.0 - worley3d(pos)) * amp;
    pos *= 2.0;
    amp *= 0.5;
  }
  return clamp(value, 0.0, 1.0);
}

fn sampleCloudDensity(pos: vec3f) -> f32 {
  let cloudBase   = cloud.cloudParams1.z;
  let cloudHeight = cloud.cloudParams1.w;
  let coverage    = cloud.cloudParams1.x;
  let density     = cloud.cloudParams1.y;
  let detailStr   = cloud.cloudParams2.y;

  // Height within cloud layer [0, 1]
  let h = clamp((pos.y - cloudBase) / cloudHeight, 0.0, 1.0);

  // Cumulus gradient: thin at base, full in middle, tapered at top
  let hGrad = smoothstep(0.0, 0.2, h) * (1.0 - smoothstep(0.5, 1.0, h));

  // Wind displacement
  let windSpeed  = cloud.cloudParams2.x;
  let windDir    = vec2<f32>(cloud.cloudParams3.x, cloud.cloudParams3.y);
  let time       = cloud.cameraPos.w;
  let windOffset = vec3<f32>(windDir.x, 0.0, windDir.y) * windSpeed * time;

  // Large-scale shape (simplex FBM at cloud scale)
  let shapeSample = (pos + windOffset) * 0.003;
  let shape = fbmShape(shapeSample);

  // Coverage remap: fraction of noise range above (1 - coverage) threshold
  let remapped = clamp((shape - (1.0 - coverage)) / max(coverage, 0.001), 0.0, 1.0);
  if (remapped < 0.001) { return 0.0; }

  // Detail erosion: Worley at higher frequency, slight offset for variety
  let detailSample = (pos + windOffset * 0.7 + vec3f(1.7, 4.3, 9.2)) * 0.012;
  let detail = fbmWorley(detailSample);
  let eroded = clamp(remapped - detail * detailStr * 0.35, 0.0, 1.0);

  return eroded * hGrad * density * 0.1;
}

fn lightMarch(pos: vec3f, lightDir: vec3f) -> f32 {
  let cloudBase        = cloud.cloudParams1.z;
  let cloudTop         = cloudBase + cloud.cloudParams1.w;
  let multiScatterFloor = cloud.cloudParams2.z;

  let maxDist  = min((cloudTop - pos.y) / max(lightDir.y, 0.001), cloud.cloudParams1.w * 0.5);
  let stepSize = maxDist / 6.0;

  var opticalDepth = 0.0;
  var samplePos = pos;
  for (var i = 0u; i < 6u; i++) {
    samplePos += lightDir * stepSize;
    if (samplePos.y < cloudBase || samplePos.y > cloudTop) { break; }
    opticalDepth += sampleCloudDensity(samplePos) * stepSize;
  }

  let beer   = exp(-opticalDepth);
  let powder = 1.0 - exp(-opticalDepth * 2.0);
  return max(beer * mix(1.0, powder, 0.5), multiScatterFloor);
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let depthDims    = textureDimensions(gDepth);
  let depthUV      = vec2<i32>(input.uv * vec2<f32>(depthDims));
  let geometryDepth = textureLoad(gDepth, depthUV, 0);

  // Reconstruct ray direction from NDC
  let ndc = vec4<f32>(
    input.uv.x * 2.0 - 1.0,
    -(input.uv.y * 2.0 - 1.0),
    1.0,
    1.0,
  );
  let worldH    = cloud.invViewProj * ndc;
  let rayDir    = normalize(worldH.xyz / worldH.w - cloud.cameraPos.xyz);
  let rayOrigin = cloud.cameraPos.xyz;

  let cloudBase = cloud.cloudParams1.z;
  let cloudTop  = cloudBase + cloud.cloudParams1.w;

  let tRange = raySlab(rayOrigin, rayDir, cloudBase, cloudTop);
  if (tRange.x > tRange.y || tRange.y < 0.0) {
    return vec4<f32>(0.0, 0.0, 0.0, 1.0);
  }

  let tMin = max(tRange.x, 0.0);
  if (tMin > 3000.0) {
    return vec4<f32>(0.0, 0.0, 0.0, 1.0);
  }
  let tMax = min(tRange.y, tMin + 600.0);

  // Skip if solid geometry is closer than cloud entry
  if (geometryDepth < 1.0) {
    let geoNdc = vec4<f32>(
      input.uv.x * 2.0 - 1.0,
      -(input.uv.y * 2.0 - 1.0),
      geometryDepth,
      1.0,
    );
    let geoWorld = cloud.invViewProj * geoNdc;
    let geoDist  = length(geoWorld.xyz / geoWorld.w - rayOrigin);
    if (geoDist < tMin) {
      return vec4<f32>(0.0, 0.0, 0.0, 1.0);
    }
  }

  // Adaptive step count: more for horizontal rays (wide cloud pass), fewer for steep
  let stepCount = i32(mix(64.0, 24.0, smoothstep(0.0, 0.5, abs(rayDir.y))));
  let stepSize  = (tMax - tMin) / f32(stepCount);

  // Lighting
  let lightDir      = normalize(cloud.lightDir.xyz);
  let cosTheta      = dot(rayDir, lightDir);
  let trueSunHeight = cloud.lightDir.w;

  let g1    = cloud.cloudParams3.z;
  let g2    = cloud.cloudParams3.w;
  let phase = hgPhase(cosTheta, g1) * 0.7 + hgPhase(cosTheta, g2) * 0.3;

  let silverLining = cloud.cloudParams2.w;
  let silver = pow(max(cosTheta, 0.0), 5.0) * silverLining;

  let dayNightBlend = smoothstep(-0.15, 0.1, trueSunHeight);
  let sunCol   = cloud.sunColor.rgb * cloud.sunColor.w;
  let moonCol  = vec3<f32>(0.15, 0.2, 0.35) * 0.15;
  let lightColor = mix(moonCol, sunCol, dayNightBlend);

  let ambientDay   = vec3<f32>(0.35, 0.45, 0.65);
  let ambientNight = vec3<f32>(0.01, 0.015, 0.03);
  let ambient = mix(ambientNight, ambientDay, dayNightBlend);

  // Ray march
  var transmittance = 1.0;
  var scatteredLight = vec3<f32>(0.0);
  var t = tMin;

  for (var i = 0; i < 64; i++) {
    if (i >= stepCount)        { break; }
    if (transmittance < 0.01)  { break; }

    let samplePos = rayOrigin + rayDir * (t + stepSize * 0.5);
    let d = sampleCloudDensity(samplePos);

    if (d > 0.001) {
      let lightEnergy = lightMarch(samplePos, lightDir);
      let h = clamp((samplePos.y - cloudBase) / cloud.cloudParams1.w, 0.0, 1.0);

      let directLight = lightColor * lightEnergy * (phase + silver);
      let ambientLight = ambient * (0.3 + 0.7 * h);

      let luminance          = directLight + ambientLight;
      let sampleExtinction   = d * stepSize;
      let sampleTransmittance = exp(-sampleExtinction);

      scatteredLight += transmittance * luminance * (1.0 - sampleTransmittance) / max(d, 0.001);
      transmittance  *= sampleTransmittance;
    }

    t += stepSize;
  }

  return vec4<f32>(scatteredLight, transmittance);
}
