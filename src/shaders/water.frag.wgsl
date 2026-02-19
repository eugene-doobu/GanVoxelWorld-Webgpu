struct FragUniforms {
  cameraPos: vec3f,
  _pad0: f32,
  sunDirection: vec3f,
  _pad1: f32,
  sunColor: vec3f,
  time: f32,
  fogStart: f32,
  fogEnd: f32,
  _pad2: f32,
  _pad3: f32,
  fogColor: vec3f,
  _pad4: f32,
}

@group(0) @binding(1) var<uniform> fragUniforms: FragUniforms;

struct FragInput {
  @location(0) worldPos: vec3f,
  @location(1) uv: vec2f,
}

@fragment
fn main(input: FragInput) -> @location(0) vec4f {
  let viewDir = normalize(fragUniforms.cameraPos - input.worldPos);

  // Normal: micro-perturbation from waves
  let nx = cos(input.worldPos.x * 3.0 + fragUniforms.time * 2.0) * 0.1;
  let nz = cos(input.worldPos.z * 2.5 + fragUniforms.time * 1.7) * 0.1;
  let normal = normalize(vec3f(nx, 1.0, nz));

  // Fresnel: reflection ratio based on viewing angle
  let fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 4.0);

  // Deep water base color
  let waterColor = vec3f(0.05, 0.15, 0.4);

  // Sky reflection color (simple sky tint)
  let skyReflect = vec3f(0.4, 0.6, 0.9);

  // Sun specular highlight
  let reflectDir = reflect(-viewDir, normal);
  let sunSpec = pow(max(dot(reflectDir, fragUniforms.sunDirection), 0.0), 256.0);
  let specular = fragUniforms.sunColor * sunSpec * 0.8;

  // Final color: water + fresnel reflection + specular
  let color = mix(waterColor, skyReflect, fresnel * 0.6) + specular;

  // Opacity: fresnel-dependent (edges more opaque, direct more transparent)
  let alpha = mix(0.5, 0.85, fresnel);

  // Distance fog
  let dist = length(fragUniforms.cameraPos - input.worldPos);
  let fogFactor = clamp((dist - fragUniforms.fogStart) / (fragUniforms.fogEnd - fragUniforms.fogStart), 0.0, 1.0);
  let finalColor = mix(color, fragUniforms.fogColor, fogFactor);
  let finalAlpha = mix(alpha, 1.0, fogFactor);

  return vec4f(finalColor, finalAlpha);
}
