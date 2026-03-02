(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))n(r);new MutationObserver(r=>{for(const s of r)if(s.type==="childList")for(const o of s.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function t(r){const s={};return r.integrity&&(s.integrity=r.integrity),r.referrerPolicy&&(s.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?s.credentials="include":r.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(r){if(r.ep)return;r.ep=!0;const s=t(r);fetch(r.href,s)}})();var nt=1e-6,Pe=typeof Float32Array<"u"?Float32Array:Array;function se(){var i=new Pe(16);return Pe!=Float32Array&&(i[1]=0,i[2]=0,i[3]=0,i[4]=0,i[6]=0,i[7]=0,i[8]=0,i[9]=0,i[11]=0,i[12]=0,i[13]=0,i[14]=0),i[0]=1,i[5]=1,i[10]=1,i[15]=1,i}function sn(i){var e=new Pe(16);return e[0]=i[0],e[1]=i[1],e[2]=i[2],e[3]=i[3],e[4]=i[4],e[5]=i[5],e[6]=i[6],e[7]=i[7],e[8]=i[8],e[9]=i[9],e[10]=i[10],e[11]=i[11],e[12]=i[12],e[13]=i[13],e[14]=i[14],e[15]=i[15],e}function Ae(i,e){return i[0]=e[0],i[1]=e[1],i[2]=e[2],i[3]=e[3],i[4]=e[4],i[5]=e[5],i[6]=e[6],i[7]=e[7],i[8]=e[8],i[9]=e[9],i[10]=e[10],i[11]=e[11],i[12]=e[12],i[13]=e[13],i[14]=e[14],i[15]=e[15],i}function on(i){return i[0]=1,i[1]=0,i[2]=0,i[3]=0,i[4]=0,i[5]=1,i[6]=0,i[7]=0,i[8]=0,i[9]=0,i[10]=1,i[11]=0,i[12]=0,i[13]=0,i[14]=0,i[15]=1,i}function ut(i,e){var t=e[0],n=e[1],r=e[2],s=e[3],o=e[4],l=e[5],a=e[6],c=e[7],u=e[8],d=e[9],f=e[10],h=e[11],m=e[12],v=e[13],g=e[14],b=e[15],P=t*l-n*o,w=t*a-r*o,S=t*c-s*o,x=n*a-r*l,B=n*c-s*l,C=r*c-s*a,A=u*v-d*m,M=u*g-f*m,R=u*b-h*m,N=d*g-f*v,O=d*b-h*v,F=f*b-h*g,L=P*F-w*O+S*N+x*R-B*M+C*A;return L?(L=1/L,i[0]=(l*F-a*O+c*N)*L,i[1]=(r*O-n*F-s*N)*L,i[2]=(v*C-g*B+b*x)*L,i[3]=(f*B-d*C-h*x)*L,i[4]=(a*R-o*F-c*M)*L,i[5]=(t*F-r*R+s*M)*L,i[6]=(g*S-m*C-b*w)*L,i[7]=(u*C-f*S+h*w)*L,i[8]=(o*O-l*R+c*A)*L,i[9]=(n*R-t*O-s*A)*L,i[10]=(m*B-v*S+b*P)*L,i[11]=(d*S-u*B-h*P)*L,i[12]=(l*M-o*N-a*A)*L,i[13]=(t*N-n*M+r*A)*L,i[14]=(v*w-m*x-g*P)*L,i[15]=(u*x-d*w+f*P)*L,i):null}function We(i,e,t){var n=e[0],r=e[1],s=e[2],o=e[3],l=e[4],a=e[5],c=e[6],u=e[7],d=e[8],f=e[9],h=e[10],m=e[11],v=e[12],g=e[13],b=e[14],P=e[15],w=t[0],S=t[1],x=t[2],B=t[3];return i[0]=w*n+S*l+x*d+B*v,i[1]=w*r+S*a+x*f+B*g,i[2]=w*s+S*c+x*h+B*b,i[3]=w*o+S*u+x*m+B*P,w=t[4],S=t[5],x=t[6],B=t[7],i[4]=w*n+S*l+x*d+B*v,i[5]=w*r+S*a+x*f+B*g,i[6]=w*s+S*c+x*h+B*b,i[7]=w*o+S*u+x*m+B*P,w=t[8],S=t[9],x=t[10],B=t[11],i[8]=w*n+S*l+x*d+B*v,i[9]=w*r+S*a+x*f+B*g,i[10]=w*s+S*c+x*h+B*b,i[11]=w*o+S*u+x*m+B*P,w=t[12],S=t[13],x=t[14],B=t[15],i[12]=w*n+S*l+x*d+B*v,i[13]=w*r+S*a+x*f+B*g,i[14]=w*s+S*c+x*h+B*b,i[15]=w*o+S*u+x*m+B*P,i}function Xt(i,e,t,n){var r,s,o,l,a,c,u,d,f,h,m=e[0],v=e[1],g=e[2],b=n[0],P=n[1],w=n[2],S=t[0],x=t[1],B=t[2];return Math.abs(m-S)<nt&&Math.abs(v-x)<nt&&Math.abs(g-B)<nt?on(i):(u=m-S,d=v-x,f=g-B,h=1/Math.sqrt(u*u+d*d+f*f),u*=h,d*=h,f*=h,r=P*f-w*d,s=w*u-b*f,o=b*d-P*u,h=Math.sqrt(r*r+s*s+o*o),h?(h=1/h,r*=h,s*=h,o*=h):(r=0,s=0,o=0),l=d*o-f*s,a=f*r-u*o,c=u*s-d*r,h=Math.sqrt(l*l+a*a+c*c),h?(h=1/h,l*=h,a*=h,c*=h):(l=0,a=0,c=0),i[0]=r,i[1]=l,i[2]=u,i[3]=0,i[4]=s,i[5]=a,i[6]=d,i[7]=0,i[8]=o,i[9]=c,i[10]=f,i[11]=0,i[12]=-(r*m+s*v+o*g),i[13]=-(l*m+a*v+c*g),i[14]=-(u*m+d*v+f*g),i[15]=1,i)}function we(){var i=new Pe(3);return Pe!=Float32Array&&(i[0]=0,i[1]=0,i[2]=0),i}function an(i){var e=new Pe(3);return e[0]=i[0],e[1]=i[1],e[2]=i[2],e}function he(i,e,t){var n=new Pe(3);return n[0]=i,n[1]=e,n[2]=t,n}function ln(i,e){return i[0]=e[0],i[1]=e[1],i[2]=e[2],i}function cn(i,e,t){return i[0]=e[0]+t[0],i[1]=e[1]+t[1],i[2]=e[2]+t[2],i}function Me(i,e,t,n){return i[0]=e[0]+t[0]*n,i[1]=e[1]+t[1]*n,i[2]=e[2]+t[2]*n,i}function un(i,e){return i[0]=-e[0],i[1]=-e[1],i[2]=-e[2],i}function Ye(i,e){var t=e[0],n=e[1],r=e[2],s=t*t+n*n+r*r;return s>0&&(s=1/Math.sqrt(s)),i[0]=e[0]*s,i[1]=e[1]*s,i[2]=e[2]*s,i}function dn(i,e,t){var n=e[0],r=e[1],s=e[2],o=t[0],l=t[1],a=t[2];return i[0]=r*a-s*l,i[1]=s*o-n*a,i[2]=n*l-r*o,i}(function(){var i=we();return function(e,t,n,r,s,o){var l,a;for(t||(t=3),n||(n=0),r?a=Math.min(r*t+n,e.length):a=e.length,l=n;l<a;l+=t)i[0]=e[l],i[1]=e[l+1],i[2]=e[l+2],s(i,i,o),e[l]=i[0],e[l+1]=i[1],e[l+2]=i[2];return e}})();const D=16,_=128,I=16,pt=D*_*I,G=16,$=16,re=G*$,qt="rgba8unorm",Zt="rgba16float",Kt="rgba8unorm",be="depth32float",te="rgba16float",ae=4,mt="rg16float",ge="r16float",Ge="rgba16float",dt=128;class ft{adapter;device;context;format;canvas;depthTexture;onResize=null;constructor(){}static async create(e){const t=new ft;if(t.canvas=e,!navigator.gpu)throw new Error("WebGPU not supported");const n=await navigator.gpu.requestAdapter({powerPreference:"high-performance"});if(!n)throw new Error("No GPUAdapter found");t.adapter=n,t.device=await n.requestDevice({requiredLimits:{maxBufferSize:256*1024*1024,maxStorageBufferBindingSize:128*1024*1024}}),t.device.lost.then(s=>{console.error("WebGPU device lost:",s.message);const o=document.createElement("div");o.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:99999;color:#fff;font-family:sans-serif;flex-direction:column;gap:16px",o.innerHTML='<div style="font-size:20px">GPU device was lost</div><button style="padding:8px 24px;font-size:16px;cursor:pointer" onclick="location.reload()">Reload Page</button>',document.body.appendChild(o)}),t.device.addEventListener("uncapturederror",s=>{console.error("[WebGPU Error]",s.error.message)});const r=e.getContext("webgpu");if(!r)throw new Error("Failed to get WebGPU context");return t.context=r,t.format=navigator.gpu.getPreferredCanvasFormat(),t.context.configure({device:t.device,format:t.format,alphaMode:"premultiplied"}),t.createDepthTexture(),t}createDepthTexture(){this.depthTexture&&this.depthTexture.destroy(),this.depthTexture=this.device.createTexture({size:[this.canvas.width,this.canvas.height],format:be,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING})}resize(){const e=window.devicePixelRatio||1,t=Math.floor(this.canvas.clientWidth*e),n=Math.floor(this.canvas.clientHeight*e);return this.canvas.width!==t||this.canvas.height!==n?(this.canvas.width=t,this.canvas.height=n,this.createDepthTexture(),this.onResize&&this.onResize(),!0):!1}get aspectRatio(){return this.canvas.width/this.canvas.height}}class fn{albedoTexture;normalTexture;materialTexture;albedoView;normalView;materialView;depthView;ctx;constructor(e){this.ctx=e,this.create()}create(){this.destroy();const e=this.ctx.canvas.width,t=this.ctx.canvas.height,n=this.ctx.device;this.albedoTexture=n.createTexture({size:[e,t],format:qt,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING}),this.normalTexture=n.createTexture({size:[e,t],format:Zt,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING}),this.materialTexture=n.createTexture({size:[e,t],format:Kt,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING}),this.albedoView=this.albedoTexture.createView(),this.normalView=this.normalTexture.createView(),this.materialView=this.materialTexture.createView(),this.depthView=this.ctx.depthTexture.createView()}destroy(){this.albedoTexture&&this.albedoTexture.destroy(),this.normalTexture&&this.normalTexture.destroy(),this.materialTexture&&this.materialTexture.destroy()}resize(){this.create()}}const hn={"camera.fov":{min:.1,max:3.14},"camera.speed":{min:.1,max:500},"camera.fastSpeed":{min:.1,max:1e3},"camera.mouseSensitivity":{min:1e-4,max:.05},"camera.near":{min:.01,max:10},"camera.far":{min:10,max:1e5},"rendering.general.renderDistance":{min:1,max:32},"rendering.general.timeBudgetMs":{min:2,max:32},"rendering.shadows.cascadeCount":{min:1,max:8},"rendering.shadows.mapSize":{min:256,max:8192},"rendering.ssao.kernelSize":{min:4,max:64},"rendering.ssao.radius":{min:.01,max:10},"rendering.ssao.bias":{min:0,max:1},"rendering.bloom.mipLevels":{min:1,max:10},"rendering.bloom.threshold":{min:0,max:10},"rendering.bloom.intensity":{min:0,max:5},"rendering.fog.startRatio":{min:0,max:5},"rendering.fog.endRatio":{min:0,max:5},"rendering.contactShadows.maxSteps":{min:1,max:64},"rendering.contactShadows.rayLength":{min:.01,max:10},"rendering.contactShadows.thickness":{min:.01,max:5},"rendering.taa.blendFactor":{min:0,max:1},"rendering.autoExposure.adaptSpeed":{min:.01,max:10},"rendering.autoExposure.keyValue":{min:.01,max:1},"rendering.autoExposure.minExposure":{min:.001,max:10},"rendering.autoExposure.maxExposure":{min:.01,max:100},"rendering.motionBlur.strength":{min:0,max:2},"rendering.dof.focusDistance":{min:.1,max:1e3},"rendering.dof.aperture":{min:.001,max:1},"rendering.dof.maxBlur":{min:0,max:50},"rendering.lod.renderDistance":{min:0,max:32},"terrain.noise.octaves":{min:1,max:8},"terrain.noise.persistence":{min:.01,max:1},"terrain.noise.lacunarity":{min:1,max:4},"terrain.noise.scale":{min:1,max:500},"terrain.height.seaLevel":{min:0,max:255},"terrain.height.minHeight":{min:1,max:255},"terrain.height.maxHeight":{min:1,max:255},"terrain.height.dirtLayerDepth":{min:1,max:20},"terrain.biomes.temperatureScale":{min:10,max:2e3},"terrain.biomes.humidityScale":{min:10,max:2e3},"terrain.biomes.continentalnessScale":{min:10,max:2e3},"terrain.biomes.heightVariationScale":{min:1,max:200},"terrain.biomes.oceanThreshold":{min:0,max:1},"terrain.caves.count":{min:0,max:50},"terrain.caves.minLength":{min:1,max:500},"terrain.caves.maxLength":{min:1,max:500},"terrain.caves.minRadius":{min:.5,max:10},"terrain.caves.maxRadius":{min:.5,max:20},"terrain.caves.minY":{min:0,max:255},"terrain.caves.maxY":{min:0,max:255},"terrain.caves.waterTable.baseLevel":{min:0,max:60},"terrain.caves.waterTable.amplitude":{min:0,max:30},"terrain.caves.waterTable.noiseScale":{min:10,max:300},"terrain.ores.coal.minY":{min:0,max:255},"terrain.ores.coal.maxY":{min:0,max:255},"terrain.ores.coal.attempts":{min:0,max:50},"terrain.ores.coal.veinSize":{min:1,max:20},"terrain.ores.iron.minY":{min:0,max:255},"terrain.ores.iron.maxY":{min:0,max:255},"terrain.ores.iron.attempts":{min:0,max:50},"terrain.ores.iron.veinSize":{min:1,max:20},"terrain.ores.gold.minY":{min:0,max:255},"terrain.ores.gold.maxY":{min:0,max:255},"terrain.ores.gold.attempts":{min:0,max:50},"terrain.ores.gold.veinSize":{min:1,max:20},"terrain.ores.diamond.minY":{min:0,max:255},"terrain.ores.diamond.maxY":{min:0,max:255},"terrain.ores.diamond.attempts":{min:0,max:50},"terrain.ores.diamond.veinSize":{min:1,max:20},"terrain.trees.perChunk":{min:0,max:20},"terrain.trees.minTrunkHeight":{min:1,max:20},"terrain.trees.maxTrunkHeight":{min:1,max:30},"terrain.trees.leafDecayChance":{min:0,max:1},"environment.dayDurationSeconds":{min:10,max:36e3},"environment.sky.starBrightness":{min:0,max:2},"environment.sky.nebulaIntensity":{min:0,max:2},"environment.cloud.coverage":{min:0,max:1},"environment.cloud.density":{min:.1,max:3},"environment.cloud.cloudBase":{min:100,max:1e3},"environment.cloud.cloudHeight":{min:50,max:500},"environment.cloud.detailStrength":{min:0,max:1},"environment.cloud.windSpeed":{min:0,max:50},"environment.cloud.silverLining":{min:0,max:3},"environment.cloud.multiScatterFloor":{min:0,max:.5}},pn=[["terrain.height.minHeight","terrain.height.maxHeight"],["terrain.trees.minTrunkHeight","terrain.trees.maxTrunkHeight"],["terrain.caves.minLength","terrain.caves.maxLength"],["terrain.caves.minRadius","terrain.caves.maxRadius"],["terrain.caves.minY","terrain.caves.maxY"],["terrain.ores.coal.minY","terrain.ores.coal.maxY"],["terrain.ores.iron.minY","terrain.ores.iron.maxY"],["terrain.ores.gold.minY","terrain.ores.gold.maxY"],["terrain.ores.diamond.minY","terrain.ores.diamond.maxY"],["rendering.autoExposure.minExposure","rendering.autoExposure.maxExposure"]];function mn(i,e){const t=e.split(".");let n=i;for(const r of t){if(n==null||typeof n!="object")return;n=n[r]}return n}function gn(i,e,t){const n=e.split(".");let r=i;for(let s=0;s<n.length-1;s++)r=r[n[s]];r[n[n.length-1]]=t}const rt="voxelEngineConfig";function $t(i,e){for(const t of Object.keys(e)){const n=e[t],r=i[t];n!=null&&typeof n=="object"&&!Array.isArray(n)&&r!=null&&typeof r=="object"&&!Array.isArray(r)?$t(r,n):i[t]=n}}class vn{data;handlers=[];dirtyGroups=new Set;saveTimer=null;constructor(){this.data=this.getDefaults(),this.loadFromStorage()}getDefaults(){return{terrain:{noise:{octaves:4,persistence:.5,lacunarity:2,scale:50},height:{seaLevel:50,minHeight:1,maxHeight:100,dirtLayerDepth:4},biomes:{temperatureScale:200,humidityScale:200,continentalnessScale:400,heightVariationScale:30,oceanThreshold:.3},caves:{count:8,minLength:50,maxLength:150,minRadius:1.5,maxRadius:4,minY:10,maxY:60,waterTable:{baseLevel:25,amplitude:12,noiseScale:80}},ores:{coal:{minY:5,maxY:128,attempts:20,veinSize:8},iron:{minY:5,maxY:64,attempts:20,veinSize:6},gold:{minY:5,maxY:32,attempts:2,veinSize:5},diamond:{minY:5,maxY:16,attempts:1,veinSize:4}},trees:{perChunk:3,minTrunkHeight:4,maxTrunkHeight:6,leafDecayChance:.2}},rendering:{general:{renderDistance:14,timeBudgetMs:12},shadows:{cascadeCount:3,mapSize:2048,cascadeSplits:[20,60,160]},ssao:{kernelSize:16,radius:1.5,bias:.025},bloom:{mipLevels:5,threshold:1.5,intensity:.08},fog:{startRatio:.85,endRatio:1.15},contactShadows:{enabled:!0,maxSteps:16,rayLength:.5,thickness:.3},taa:{enabled:!0,blendFactor:.9},autoExposure:{enabled:!0,adaptSpeed:1.5,keyValue:.1,minExposure:.2,maxExposure:1.8},motionBlur:{enabled:!1,strength:.5},dof:{enabled:!1,focusDistance:50,aperture:.05,maxBlur:10},lod:{enabled:!0,renderDistance:14}},camera:{speed:20,fastSpeed:60,mouseSensitivity:.002,fov:70*(Math.PI/180),near:.1,far:1e3},environment:{dayDurationSeconds:1200,sky:{starBrightness:1,nebulaIntensity:1},cloud:{enabled:!0,coverage:.25,density:.5,cloudBase:300,cloudHeight:200,detailStrength:.3,windSpeed:10,silverLining:1.5,multiScatterFloor:.15}}}}loadFromStorage(){try{const e=localStorage.getItem(rt);if(e){const t=JSON.parse(e);t&&typeof t=="object"&&$t(this.data,t)}}catch{}}scheduleSave(){this.saveTimer!==null&&clearTimeout(this.saveTimer),this.saveTimer=setTimeout(()=>{try{localStorage.setItem(rt,JSON.stringify(this.data))}catch{}this.saveTimer=null},500)}get(e){return mn(this.data,e)}set(e,t){const n=this.get(e);if(n!==void 0){if(typeof n=="number"&&(typeof t!="number"||!Number.isFinite(t)))return{success:!1,error:`"${e}": expected finite number, got ${t}`};if(typeof n=="boolean"&&typeof t!="boolean")return{success:!1,error:`"${e}": expected boolean, got ${typeof t}`}}if(typeof t=="number"){const s=hn[e];if(s&&(t<s.min||t>s.max))return{success:!1,error:`"${e}": ${t} out of range [${s.min}, ${s.max}]`}}if(typeof t=="number"){for(const[s,o]of pn)if(e===s){const l=this.get(o);if(typeof l=="number"&&t>l)return{success:!1,error:`"${e}": ${t} must be <= ${o} (${l})`}}else if(e===o){const l=this.get(s);if(typeof l=="number"&&t<l)return{success:!1,error:`"${e}": ${t} must be >= ${s} (${l})`}}}if(e.startsWith("rendering.shadows.cascadeSplits")){const s=[...this.data.rendering.shadows.cascadeSplits],o=e.match(/cascadeSplits\.(\d+)$/);if(o){const l=parseInt(o[1]);s[l]=t;for(let a=1;a<s.length;a++)if(s[a]<=s[a-1])return{success:!1,error:`cascadeSplits must be ascending: [${s.join(", ")}]`}}}gn(this.data,e,t);const r=e.split(".")[0];this.dirtyGroups.add(r);for(const s of this.handlers)s(e,t);return this.scheduleSave(),{success:!0}}onChange(e){this.handlers.push(e)}removeHandler(e){const t=this.handlers.indexOf(e);t>=0&&this.handlers.splice(t,1)}isDirty(e){return this.dirtyGroups.has(e)}clearDirty(e){this.dirtyGroups.delete(e)}resetToDefaults(){this.data=this.getDefaults();try{localStorage.removeItem(rt)}catch{}for(const e of this.handlers)e("*",void 0)}}const T=new vn,xn=`struct ShadowUniforms {
  lightViewProj: array<mat4x4<f32>, 3>,
  cascadeSplits: vec4<f32>,
};

@group(0) @binding(0) var<uniform> shadow: ShadowUniforms;

// Push constant equivalent via dynamic offset - cascade index passed as uniform
struct CascadeIndex {
  index: u32,
};

@group(0) @binding(1) var<uniform> cascade: CascadeIndex;

struct VertexInput {
  @location(0) position: vec3<f32>,
  @location(1) normalIndex: u32,
  @location(2) texCoord: vec2<f32>,
};

@vertex
fn main(input: VertexInput) -> @builtin(position) vec4<f32> {
  return shadow.lightViewProj[cascade.index] * vec4<f32>(input.position, 1.0);
}
`,yn=`struct ShadowUniforms {
  lightViewProj: array<mat4x4<f32>, 3>,
  cascadeSplits: vec4<f32>,
};

@group(0) @binding(0) var<uniform> shadow: ShadowUniforms;

struct CascadeIndex {
  index: u32,
};

@group(0) @binding(1) var<uniform> cascade: CascadeIndex;

struct VertexInput {
  @location(0) position: vec3<f32>,
  @location(1) normalIndex: u32,
  @location(2) texCoord: vec2<f32>,
};

struct VertexOutput {
  @builtin(position) clipPos: vec4<f32>,
  @location(0) texCoord: vec2<f32>,
  @location(1) worldPos: vec3<f32>,
  @location(2) @interpolate(flat) normalIndex: u32,
};

@vertex
fn main(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  output.clipPos = shadow.lightViewProj[cascade.index] * vec4<f32>(input.position, 1.0);
  output.texCoord = input.texCoord;
  output.worldPos = input.position;
  output.normalIndex = input.normalIndex;
  return output;
}
`,bn=`@group(1) @binding(0) var atlasSampler: sampler;
@group(1) @binding(1) var atlasTexture: texture_2d<f32>;

// Alpha cutout for leaves (51), vegetation (80-82), and torches (93).
// Atlas alpha is baked at texture generation time for stable, flicker-free results.
// Requires: atlasSampler, atlasTexture bindings declared before inclusion.

fn applyCutout(blockType: u32, texCoord: vec2<f32>) {
  if (blockType == 51u || (blockType >= 80u && blockType <= 82u) || blockType == 93u) {
    let cutoutAlpha = textureSampleLevel(atlasTexture, atlasSampler, texCoord, 0.0).a;
    if (cutoutAlpha < 0.5) { discard; }
  }
}

struct FragInput {
  @location(0) texCoord: vec2<f32>,
  @location(1) worldPos: vec3<f32>,
  @location(2) @interpolate(flat) normalIndex: u32,
};

@fragment
fn main(input: FragInput) {
  let blockType = input.normalIndex >> 8u;

  // Cutout blocks (leaves/veg) use direct atlas UV, but in shadow pass they
  // always come through the cutout pipeline which only renders cutout blocks.
  // These blocks are emitted with atlas UV (not tiled), so use texCoord directly.
  applyCutout(blockType, input.texCoord);
}
`;function wn(i,e,t,n,r,s,o){const l=1/(e-t),a=1/(n-r),c=1/(s-o);return i[0]=-2*l,i[1]=0,i[2]=0,i[3]=0,i[4]=0,i[5]=-2*a,i[6]=0,i[7]=0,i[8]=0,i[9]=0,i[10]=c,i[11]=0,i[12]=(e+t)*l,i[13]=(r+n)*a,i[14]=s*c,i[15]=1,i}class Sn{ctx;shadowTexture;shadowTextureView;cascadeViews=[];pipeline;cutoutPipeline;bindGroupLayout;atlasBindGroupLayout;atlasBindGroup=null;uniformBuffer;cascadeIndexBuffers=[];bindGroups=[];lightViewProjs=[];uniformData=new Float32Array(52);constructor(e){this.ctx=e;const t=T.data.rendering.shadows.cascadeCount;for(let n=0;n<t;n++)this.lightViewProjs.push(se());this.createTextures(),this.createPipeline(),this.createBuffers(),this.createBindGroups()}createTextures(){const e=T.data.rendering.shadows;this.shadowTexture=this.ctx.device.createTexture({size:[e.mapSize,e.mapSize,e.cascadeCount],format:be,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING}),this.shadowTextureView=this.shadowTexture.createView({dimension:"2d-array"}),this.cascadeViews=[];for(let t=0;t<e.cascadeCount;t++)this.cascadeViews.push(this.shadowTexture.createView({dimension:"2d",baseArrayLayer:t,arrayLayerCount:1}))}createPipeline(){const e=this.ctx.device;this.bindGroupLayout=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.VERTEX,buffer:{type:"uniform"}}]});const t=e.createPipelineLayout({bindGroupLayouts:[this.bindGroupLayout]}),n=e.createShaderModule({code:xn}),r={arrayStride:28,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"uint32"},{shaderLocation:2,offset:16,format:"float32x2"}]},s={format:be,depthWriteEnabled:!0,depthCompare:"less",depthBias:2,depthBiasSlopeScale:1.5};this.pipeline=e.createRenderPipeline({layout:t,vertex:{module:n,entryPoint:"main",buffers:[r]},primitive:{topology:"triangle-list",cullMode:"none",frontFace:"ccw"},depthStencil:s}),this.atlasBindGroupLayout=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,sampler:{}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{}}]});const o=e.createShaderModule({code:yn}),l=e.createShaderModule({code:bn});this.cutoutPipeline=e.createRenderPipeline({layout:e.createPipelineLayout({bindGroupLayouts:[this.bindGroupLayout,this.atlasBindGroupLayout]}),vertex:{module:o,entryPoint:"main",buffers:[r]},fragment:{module:l,entryPoint:"main",targets:[]},primitive:{topology:"triangle-list",cullMode:"none",frontFace:"ccw"},depthStencil:s})}createBuffers(){const e=this.ctx.device,t=T.data.rendering.shadows.cascadeCount;this.uniformBuffer=e.createBuffer({size:208,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});for(let n=0;n<t;n++){const r=e.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),s=new Uint32Array([n,0,0,0]);e.queue.writeBuffer(r,0,s),this.cascadeIndexBuffers.push(r)}}createBindGroups(){const e=T.data.rendering.shadows.cascadeCount;this.bindGroups=[];for(let t=0;t<e;t++)this.bindGroups.push(this.ctx.device.createBindGroup({layout:this.bindGroupLayout,entries:[{binding:0,resource:{buffer:this.uniformBuffer}},{binding:1,resource:{buffer:this.cascadeIndexBuffers[t]}}]}))}setAtlasTexture(e,t){this.atlasBindGroup=this.ctx.device.createBindGroup({layout:this.atlasBindGroupLayout,entries:[{binding:0,resource:t},{binding:1,resource:e.createView()}]})}updateLightMatrices(e,t,n){const r=T.data.rendering.shadows;for(let o=0;o<r.cascadeCount;o++){const l=r.cascadeSplits[o];this.computeCascadeMatrix(e,n,l,o)}const s=this.uniformData;for(let o=0;o<r.cascadeCount;o++)s.set(this.lightViewProjs[o],o*16);s[48]=r.cascadeSplits[0],s[49]=r.cascadeSplits[1],s[50]=r.cascadeSplits[2],s[51]=0,this.ctx.device.queue.writeBuffer(this.uniformBuffer,0,s)}computeCascadeMatrix(e,t,n,r){const s=T.data.rendering.shadows.mapSize,o=Ye(we(),t),l=Math.abs(o[1])>.99?he(0,0,1):he(0,1,0),a=we();ln(a,e);const c=we();Me(c,a,o,n*2);const u=se();Xt(u,c,a,l);const d=n*1.2,f=se();wn(f,-d,d,-d,d,.1,n*5);const h=this.lightViewProjs[r];We(h,f,u);const m=h[12],v=h[13],g=s/2,b=m*g,P=v*g,w=(Math.round(b)-b)/g,S=(Math.round(P)-P)/g;f[12]+=w,f[13]+=S,We(h,f,u)}renderShadowPass(e,t,n){const r=T.data.rendering.shadows.cascadeCount;for(let s=0;s<r;s++){const o=e.beginRenderPass({colorAttachments:[],depthStencilAttachment:{view:this.cascadeViews[s],depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});o.setPipeline(this.pipeline),o.setBindGroup(0,this.bindGroups[s]);let l=null,a=null;for(const c of t)c.indexCount!==0&&(c.vertexBuffer!==l&&(o.setVertexBuffer(0,c.vertexBuffer),l=c.vertexBuffer),c.indexBuffer!==a&&(o.setIndexBuffer(c.indexBuffer,"uint32"),a=c.indexBuffer),o.drawIndexed(c.indexCount,1,c.firstIndex??0,c.baseVertex??0));if(n&&this.atlasBindGroup){o.setPipeline(this.cutoutPipeline),o.setBindGroup(0,this.bindGroups[s]),o.setBindGroup(1,this.atlasBindGroup),l=null,a=null;for(const c of n)c.indexCount!==0&&(c.vertexBuffer!==l&&(o.setVertexBuffer(0,c.vertexBuffer),l=c.vertexBuffer),c.indexBuffer!==a&&(o.setIndexBuffer(c.indexBuffer,"uint32"),a=c.indexBuffer),o.drawIndexed(c.indexCount,1,c.firstIndex??0,c.baseVertex??0))}o.end()}}}const Pn=`// SSAO - Screen-Space Ambient Occlusion (half resolution)

struct SSAOParams {
  projection: mat4x4<f32>,  // 64
  invProjection: mat4x4<f32>,  // 64
  kernelSamples: array<vec4<f32>, 16>,  // 256
  noiseScale: vec2<f32>,  // 8
  radius: f32,            // 4
  bias: f32,              // 4
};

@group(0) @binding(0) var<uniform> params: SSAOParams;
@group(0) @binding(1) var depthTex: texture_depth_2d;
@group(0) @binding(2) var normalTex: texture_2d<f32>;
@group(0) @binding(3) var noiseTex: texture_2d<f32>;
@group(0) @binding(4) var pointSampler: sampler;

// Fullscreen triangle vertex shader
// Generates a single triangle that covers the entire screen using vertex_index.

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

fn viewPosFromDepth(uv: vec2<f32>, depth: f32) -> vec3<f32> {
  let ndc = vec4<f32>(uv * 2.0 - 1.0, depth, 1.0);
  let ndcFlipped = vec4<f32>(ndc.x, -ndc.y, ndc.z, 1.0);
  let viewH = params.invProjection * ndcFlipped;
  return viewH.xyz / viewH.w;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let fullDims = textureDimensions(depthTex);
  // Sample depth at full-res coords matching our half-res UV
  let fullPixel = vec2<i32>(vec2<f32>(fullDims) * input.uv);
  let depth = textureLoad(depthTex, fullPixel, 0);

  if (depth >= 1.0) {
    return vec4<f32>(1.0);
  }

  let fragPos = viewPosFromDepth(input.uv, depth);
  let normalSample = textureLoad(normalTex, fullPixel, 0);
  let normal = normalize(normalSample.rgb * 2.0 - 1.0);

  // Random rotation from noise texture
  let noiseCoord = input.uv * params.noiseScale;
  let randomVec = textureSampleLevel(noiseTex, pointSampler, noiseCoord, 0.0).rgb * 2.0 - 1.0;

  // TBN matrix
  let tangent = normalize(randomVec - normal * dot(randomVec, normal));
  let bitangent = cross(normal, tangent);
  let TBN = mat3x3<f32>(tangent, bitangent, normal);

  var occlusion = 0.0;
  for (var i = 0u; i < 16u; i++) {
    let sampleDir = TBN * params.kernelSamples[i].xyz;
    let samplePos = fragPos + sampleDir * params.radius;

    // Project sample to screen space
    let offset = params.projection * vec4<f32>(samplePos, 1.0);
    let projXY = offset.xy / offset.w;
    let sampleUV = vec2<f32>(projXY.x * 0.5 + 0.5, 1.0 - (projXY.y * 0.5 + 0.5));

    // Sample depth at projected position
    let samplePixel = vec2<i32>(vec2<f32>(fullDims) * sampleUV);
    let sampleDepth = textureLoad(depthTex, clamp(samplePixel, vec2<i32>(0), vec2<i32>(fullDims) - vec2<i32>(1)), 0);
    let sampleViewPos = viewPosFromDepth(sampleUV, sampleDepth);

    let rangeCheck = smoothstep(0.0, 1.0, params.radius / (abs(fragPos.z - sampleViewPos.z) + 0.0001));
    occlusion += select(0.0, 1.0, sampleViewPos.z >= samplePos.z + params.bias) * rangeCheck;
  }

  let ao = 1.0 - (occlusion / 16.0);
  return vec4<f32>(ao, ao, ao, 1.0);
}
`,Tn=`// Separable bilateral blur for SSAO (depth-edge preserving)
// Run twice: once with direction=(1,0) for horizontal, once with (0,1) for vertical

struct BlurParams {
  direction: vec2<f32>,
};

@group(0) @binding(0) var inputTex: texture_2d<f32>;
@group(0) @binding(1) var depthTex: texture_depth_2d;
@group(0) @binding(2) var linearSampler: sampler;
@group(0) @binding(3) var<uniform> blurParams: BlurParams;

// Fullscreen triangle vertex shader
// Generates a single triangle that covers the entire screen using vertex_index.

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

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let dims = vec2<f32>(textureDimensions(inputTex));
  let pixelCoord = vec2<i32>(input.position.xy);
  let step = vec2<i32>(blurParams.direction);

  let centerAO = textureLoad(inputTex, pixelCoord, 0).r;

  // Sample depth at full resolution matching this UV
  let depthDims = textureDimensions(depthTex);
  let depthPixel = vec2<i32>(vec2<f32>(depthDims) * input.uv);
  let centerDepth = textureLoad(depthTex, depthPixel, 0);

  var result = 0.0;
  var totalWeight = 0.0;

  // 5-tap 1D bilateral blur along direction
  for (var i = -2i; i <= 2i; i++) {
    let sampleCoord = pixelCoord + step * i;
    let sampleUV = (vec2<f32>(sampleCoord) + 0.5) / dims;

    let aoSample = textureLoad(inputTex, clamp(sampleCoord, vec2<i32>(0), vec2<i32>(dims) - vec2<i32>(1)), 0).r;

    let sDepthPixel = vec2<i32>(vec2<f32>(depthDims) * sampleUV);
    let sampleDepth = textureLoad(depthTex, clamp(sDepthPixel, vec2<i32>(0), vec2<i32>(depthDims) - vec2<i32>(1)), 0);

    // Depth-based weight (bilateral)
    let depthDiff = abs(centerDepth - sampleDepth);
    let depthWeight = exp(-depthDiff * 1000.0);

    // Spatial weight (gaussian-like)
    let dist = f32(i * i);
    let spatialWeight = exp(-dist * 0.2);

    let w = depthWeight * spatialWeight;
    result += aoSample * w;
    totalWeight += w;
  }

  let finalAO = result / max(totalWeight, 0.0001);
  return vec4<f32>(finalAO, finalAO, finalAO, 1.0);
}
`;class Bn{ctx;ssaoTexture;ssaoTextureView;blurredTexture;blurredTextureView;blurIntermediateTexture;blurIntermediateTextureView;noiseTexture;noiseTextureView;uniformBuffer;blurHDirBuffer;blurVDirBuffer;ssaoPipeline;ssaoBindGroupLayout;ssaoBindGroup;blurPipeline;blurBindGroupLayout;blurHBindGroup;blurVBindGroup;pointSampler;linearSampler;halfWidth=0;halfHeight=0;constructor(e){this.ctx=e,this.createSamplers(),this.createNoiseTexture(),this.createUniformBuffer(),this.createPipelines(),this.createTextures()}createSamplers(){this.pointSampler=this.ctx.device.createSampler({magFilter:"nearest",minFilter:"nearest",addressModeU:"repeat",addressModeV:"repeat"}),this.linearSampler=this.ctx.device.createSampler({magFilter:"linear",minFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"})}createNoiseTexture(){const e=new Float32Array(ae*ae*4);for(let n=0;n<ae*ae;n++)e[n*4+0]=Math.random()*2-1,e[n*4+1]=Math.random()*2-1,e[n*4+2]=0,e[n*4+3]=1;const t=new Uint8Array(ae*ae*4);for(let n=0;n<e.length;n++)t[n]=Math.round((e[n]*.5+.5)*255);this.noiseTexture=this.ctx.device.createTexture({size:[ae,ae],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST}),this.ctx.device.queue.writeTexture({texture:this.noiseTexture},t.buffer,{bytesPerRow:ae*4},[ae,ae]),this.noiseTextureView=this.noiseTexture.createView()}createUniformBuffer(){const e=T.data.rendering.ssao.kernelSize,t=400;this.uniformBuffer=this.ctx.device.createBuffer({size:t,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});const n=new Float32Array(e*4);for(let r=0;r<e;r++){let s=Math.random()*2-1,o=Math.random()*2-1,l=Math.random();const a=Math.sqrt(s*s+o*o+l*l);s/=a,o/=a,l/=a;let c=r/e;c=.1+c*c*.9,s*=c,o*=c,l*=c,n[r*4+0]=s,n[r*4+1]=o,n[r*4+2]=l,n[r*4+3]=0}this.ctx.device.queue.writeBuffer(this.uniformBuffer,128,n),this.blurHDirBuffer=this.ctx.device.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.ctx.device.queue.writeBuffer(this.blurHDirBuffer,0,new Float32Array([1,0,0,0])),this.blurVDirBuffer=this.ctx.device.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.ctx.device.queue.writeBuffer(this.blurVDirBuffer,0,new Float32Array([0,1,0,0]))}updateProjection(e,t){const n=T.data.rendering.ssao,r=new ArrayBuffer(64);new Float32Array(r).set(e),this.ctx.device.queue.writeBuffer(this.uniformBuffer,0,r);const s=new ArrayBuffer(64);new Float32Array(s).set(t),this.ctx.device.queue.writeBuffer(this.uniformBuffer,64,s);const o=new Float32Array([this.halfWidth/ae,this.halfHeight/ae,n.radius,n.bias]);this.ctx.device.queue.writeBuffer(this.uniformBuffer,384,o)}createPipelines(){const e=this.ctx.device;this.ssaoBindGroupLayout=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"depth"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:3,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:4,visibility:GPUShaderStage.FRAGMENT,sampler:{}}]});const t=e.createShaderModule({code:Pn});this.ssaoPipeline=e.createRenderPipeline({layout:e.createPipelineLayout({bindGroupLayouts:[this.ssaoBindGroupLayout]}),vertex:{module:t,entryPoint:"vs_main"},fragment:{module:t,entryPoint:"fs_main",targets:[{format:"r8unorm"}]},primitive:{topology:"triangle-list"}}),this.blurBindGroupLayout=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"depth"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,sampler:{}},{binding:3,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]});const n=e.createShaderModule({code:Tn});this.blurPipeline=e.createRenderPipeline({layout:e.createPipelineLayout({bindGroupLayouts:[this.blurBindGroupLayout]}),vertex:{module:n,entryPoint:"vs_main"},fragment:{module:n,entryPoint:"fs_main",targets:[{format:"r8unorm"}]},primitive:{topology:"triangle-list"}})}createTextures(){this.ssaoTexture&&this.ssaoTexture.destroy(),this.blurIntermediateTexture&&this.blurIntermediateTexture.destroy(),this.blurredTexture&&this.blurredTexture.destroy(),this.halfWidth=Math.max(1,Math.floor(this.ctx.canvas.width/2)),this.halfHeight=Math.max(1,Math.floor(this.ctx.canvas.height/2)),this.ssaoTexture=this.ctx.device.createTexture({size:[this.halfWidth,this.halfHeight],format:"r8unorm",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING}),this.ssaoTextureView=this.ssaoTexture.createView(),this.blurIntermediateTexture=this.ctx.device.createTexture({size:[this.halfWidth,this.halfHeight],format:"r8unorm",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING}),this.blurIntermediateTextureView=this.blurIntermediateTexture.createView(),this.blurredTexture=this.ctx.device.createTexture({size:[this.halfWidth,this.halfHeight],format:"r8unorm",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING}),this.blurredTextureView=this.blurredTexture.createView(),this.ssaoBindGroup=null,this.blurHBindGroup=null,this.blurVBindGroup=null}ensureBindGroups(e,t){this.ssaoBindGroup||(this.ssaoBindGroup=this.ctx.device.createBindGroup({layout:this.ssaoBindGroupLayout,entries:[{binding:0,resource:{buffer:this.uniformBuffer}},{binding:1,resource:e},{binding:2,resource:t},{binding:3,resource:this.noiseTextureView},{binding:4,resource:this.pointSampler}]}),this.blurHBindGroup=this.ctx.device.createBindGroup({layout:this.blurBindGroupLayout,entries:[{binding:0,resource:this.ssaoTextureView},{binding:1,resource:e},{binding:2,resource:this.linearSampler},{binding:3,resource:{buffer:this.blurHDirBuffer}}]}),this.blurVBindGroup=this.ctx.device.createBindGroup({layout:this.blurBindGroupLayout,entries:[{binding:0,resource:this.blurIntermediateTextureView},{binding:1,resource:e},{binding:2,resource:this.linearSampler},{binding:3,resource:{buffer:this.blurVDirBuffer}}]}))}renderSSAO(e,t,n){this.ensureBindGroups(t,n);const r=e.beginRenderPass({colorAttachments:[{view:this.ssaoTextureView,clearValue:{r:1,g:1,b:1,a:1},loadOp:"clear",storeOp:"store"}]});r.setPipeline(this.ssaoPipeline),r.setBindGroup(0,this.ssaoBindGroup),r.draw(3),r.end();const s=e.beginRenderPass({colorAttachments:[{view:this.blurIntermediateTextureView,clearValue:{r:1,g:1,b:1,a:1},loadOp:"clear",storeOp:"store"}]});s.setPipeline(this.blurPipeline),s.setBindGroup(0,this.blurHBindGroup),s.draw(3),s.end();const o=e.beginRenderPass({colorAttachments:[{view:this.blurredTextureView,clearValue:{r:1,g:1,b:1,a:1},loadOp:"clear",storeOp:"store"}]});o.setPipeline(this.blurPipeline),o.setBindGroup(0,this.blurVBindGroup),o.draw(3),o.end()}resize(){this.createTextures()}}const Cn=`// Bloom brightness extraction

struct BloomParams {
  threshold: f32,
  knee: f32,
  _pad0: f32,
  _pad1: f32,
};

@group(0) @binding(0) var inputTex: texture_2d<f32>;
@group(0) @binding(1) var linearSampler: sampler;
@group(0) @binding(2) var<uniform> params: BloomParams;

// Fullscreen triangle vertex shader
// Generates a single triangle that covers the entire screen using vertex_index.

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

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let color = textureSampleLevel(inputTex, linearSampler, input.uv, 0.0).rgb;
  let brightness = dot(color, vec3<f32>(0.2126, 0.7152, 0.0722));
  let contribution = max(brightness - params.threshold, 0.0);
  let softKnee = contribution / (contribution + params.knee + 0.0001);
  return vec4<f32>(color * softKnee, 1.0);
}
`,Gn=`// Bloom downsample (Karis average for first pass, box filter for subsequent)

@group(0) @binding(0) var inputTex: texture_2d<f32>;
@group(0) @binding(1) var linearSampler: sampler;

// Fullscreen triangle vertex shader
// Generates a single triangle that covers the entire screen using vertex_index.

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

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let texelSize = 1.0 / vec2<f32>(textureDimensions(inputTex));

  // 13-tap downsample (from Call of Duty method)
  let a = textureSampleLevel(inputTex, linearSampler, input.uv + vec2<f32>(-2.0, -2.0) * texelSize, 0.0).rgb;
  let b = textureSampleLevel(inputTex, linearSampler, input.uv + vec2<f32>( 0.0, -2.0) * texelSize, 0.0).rgb;
  let c = textureSampleLevel(inputTex, linearSampler, input.uv + vec2<f32>( 2.0, -2.0) * texelSize, 0.0).rgb;
  let d = textureSampleLevel(inputTex, linearSampler, input.uv + vec2<f32>(-2.0,  0.0) * texelSize, 0.0).rgb;
  let e = textureSampleLevel(inputTex, linearSampler, input.uv, 0.0).rgb;
  let f = textureSampleLevel(inputTex, linearSampler, input.uv + vec2<f32>( 2.0,  0.0) * texelSize, 0.0).rgb;
  let g = textureSampleLevel(inputTex, linearSampler, input.uv + vec2<f32>(-2.0,  2.0) * texelSize, 0.0).rgb;
  let h = textureSampleLevel(inputTex, linearSampler, input.uv + vec2<f32>( 0.0,  2.0) * texelSize, 0.0).rgb;
  let i = textureSampleLevel(inputTex, linearSampler, input.uv + vec2<f32>( 2.0,  2.0) * texelSize, 0.0).rgb;
  let j = textureSampleLevel(inputTex, linearSampler, input.uv + vec2<f32>(-1.0, -1.0) * texelSize, 0.0).rgb;
  let k = textureSampleLevel(inputTex, linearSampler, input.uv + vec2<f32>( 1.0, -1.0) * texelSize, 0.0).rgb;
  let l = textureSampleLevel(inputTex, linearSampler, input.uv + vec2<f32>(-1.0,  1.0) * texelSize, 0.0).rgb;
  let m = textureSampleLevel(inputTex, linearSampler, input.uv + vec2<f32>( 1.0,  1.0) * texelSize, 0.0).rgb;

  var result = e * 0.125;
  result += (a + c + g + i) * 0.03125;
  result += (b + d + f + h) * 0.0625;
  result += (j + k + l + m) * 0.125;

  return vec4<f32>(result, 1.0);
}
`,An=`// Bloom upsample (tent filter with additive blending)

struct BloomUpParams {
  filterRadius: f32,
  _pad0: f32,
  _pad1: f32,
  _pad2: f32,
};

@group(0) @binding(0) var inputTex: texture_2d<f32>;
@group(0) @binding(1) var linearSampler: sampler;
@group(0) @binding(2) var<uniform> params: BloomUpParams;

// Fullscreen triangle vertex shader
// Generates a single triangle that covers the entire screen using vertex_index.

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

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let r = params.filterRadius;
  let texelSize = 1.0 / vec2<f32>(textureDimensions(inputTex));

  // 9-tap tent filter
  var result = vec3<f32>(0.0);
  result += textureSampleLevel(inputTex, linearSampler, input.uv + vec2<f32>(-r, -r) * texelSize, 0.0).rgb * 1.0;
  result += textureSampleLevel(inputTex, linearSampler, input.uv + vec2<f32>( 0.0, -r) * texelSize, 0.0).rgb * 2.0;
  result += textureSampleLevel(inputTex, linearSampler, input.uv + vec2<f32>( r, -r) * texelSize, 0.0).rgb * 1.0;
  result += textureSampleLevel(inputTex, linearSampler, input.uv + vec2<f32>(-r,  0.0) * texelSize, 0.0).rgb * 2.0;
  result += textureSampleLevel(inputTex, linearSampler, input.uv, 0.0).rgb * 4.0;
  result += textureSampleLevel(inputTex, linearSampler, input.uv + vec2<f32>( r,  0.0) * texelSize, 0.0).rgb * 2.0;
  result += textureSampleLevel(inputTex, linearSampler, input.uv + vec2<f32>(-r,  r) * texelSize, 0.0).rgb * 1.0;
  result += textureSampleLevel(inputTex, linearSampler, input.uv + vec2<f32>( 0.0,  r) * texelSize, 0.0).rgb * 2.0;
  result += textureSampleLevel(inputTex, linearSampler, input.uv + vec2<f32>( r,  r) * texelSize, 0.0).rgb * 1.0;
  result /= 16.0;

  return vec4<f32>(result, 1.0);
}
`,Ln=`// ACES Filmic Tone Mapping + Color Grading + Gamma Correction

struct TonemapParams {
  bloomIntensity: f32,
  exposure: f32,
  timeOfDay: f32,  // 0=midnight, 0.25=sunrise, 0.5=noon, 0.75=sunset
  autoExposureEnabled: f32,
  underwaterDepth: f32,  // 0 = not underwater, >0 = camera depth below water
  pad0: f32,
  pad1: f32,
  pad2: f32,
};

@group(0) @binding(0) var hdrTex: texture_2d<f32>;
@group(0) @binding(1) var bloomTex: texture_2d<f32>;
@group(0) @binding(2) var linearSampler: sampler;
@group(0) @binding(3) var<uniform> params: TonemapParams;
@group(0) @binding(4) var adaptedLumTex: texture_2d<f32>;

// Fullscreen triangle vertex shader
// Generates a single triangle that covers the entire screen using vertex_index.

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

// ACES Filmic Tone Mapping (Narkowicz approximation)
fn acesFilm(x: vec3<f32>) -> vec3<f32> {
  let a = 2.51;
  let b = 0.03;
  let c = 2.43;
  let d = 0.59;
  let e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), vec3<f32>(0.0), vec3<f32>(1.0));
}

// Complementary Reimagined-style cinematic color grading
fn colorGrade(color: vec3f, timeOfDay: f32) -> vec3f {
  var c = color;

  // 1. Color temperature: warm golden during day, stronger cool blue at night
  let dayFactor = smoothstep(0.2, 0.3, timeOfDay) * (1.0 - smoothstep(0.7, 0.8, timeOfDay));
  let warmth = mix(vec3f(0.85, 0.9, 1.2), vec3f(1.05, 1.02, 0.95), dayFactor);
  c *= warmth;

  // 2. Sunrise/sunset golden hour tint (derived from sun height for accuracy)
  let sunHeight = sin((timeOfDay - 0.25) * 2.0 * 3.14159265359);
  let goldenHour = smoothstep(0.0, 0.15, sunHeight) * smoothstep(0.3, 0.15, sunHeight);
  c = mix(c, c * vec3f(1.15, 0.95, 0.8), goldenHour * 0.4);

  // 3. Vibrance with scotopic effect (reduced saturation at night)
  let luminance = dot(c, vec3f(0.2126, 0.7152, 0.0722));
  let nightAmount = 1.0 - dayFactor;
  let saturationBoost = mix(0.85, 1.15, dayFactor);
  c = mix(vec3f(luminance), c, saturationBoost);

  // 4. Soft contrast S-curve
  c = c - 0.5;
  c = c * 1.05;
  c = c + 0.5;

  // 5. Lift/Gamma/Gain — extra blue lift at night for moonlit atmosphere
  let nightBlueLift = vec3f(0.0, 0.0, 0.02) * nightAmount;
  let lift = vec3f(0.01, 0.01, 0.015) + nightBlueLift;
  let gain = vec3f(1.0, 0.99, 0.97);
  c = max(vec3f(0.0), c * gain + lift);

  return c;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  // Chromatic Aberration — radial RGB channel offset
  let caStrength = 0.002;
  let caDir = (input.uv - 0.5) * caStrength;
  let hdrR = textureSampleLevel(hdrTex, linearSampler, input.uv + caDir, 0.0).r;
  let hdrB = textureSampleLevel(hdrTex, linearSampler, input.uv - caDir, 0.0).b;
  let hdrG = textureSampleLevel(hdrTex, linearSampler, input.uv, 0.0).g;
  let hdrColor = vec3f(hdrR, hdrG, hdrB);

  let bloomR = textureSampleLevel(bloomTex, linearSampler, input.uv + caDir, 0.0).r;
  let bloomB = textureSampleLevel(bloomTex, linearSampler, input.uv - caDir, 0.0).b;
  let bloomG = textureSampleLevel(bloomTex, linearSampler, input.uv, 0.0).g;
  let bloomColor = vec3f(bloomR, bloomG, bloomB);

  var color = hdrColor + bloomColor * params.bloomIntensity;
  let autoExp = textureSampleLevel(adaptedLumTex, linearSampler, vec2f(0.5), 0.0).r;
  let exposure = select(params.exposure, autoExp, params.autoExposureEnabled > 0.5);

  // Night exposure boost: raise exposure at night so moonlit scenes have adequate brightness
  let nightFactor = 1.0 - smoothstep(0.2, 0.3, params.timeOfDay) * (1.0 - smoothstep(0.7, 0.8, params.timeOfDay));
  let nightExposureBoost = mix(1.0, 1.4, nightFactor);
  color *= exposure * nightExposureBoost;

  // Color grade in linear space before tonemapping for physically correct color science
  color = colorGrade(color, params.timeOfDay);

  // ACES tone mapping
  color = acesFilm(color);

  // Gamma correction (linear → sRGB)
  color = pow(color, vec3<f32>(1.0 / 2.2));

  // Vignette — smooth radial darkening from screen edges
  let vignetteCoord = input.uv * 2.0 - 1.0;
  let vignetteDist = length(vignetteCoord);
  let vignette = 1.0 - smoothstep(0.5, 1.5, vignetteDist);
  color *= mix(1.0, vignette, 0.4);

  // Underwater post-processing
  if (params.underwaterDepth > 0.0) {
    // Stronger vignette underwater (simulate water surface light cone)
    let uwVignette = 1.0 - smoothstep(0.3, 1.2, vignetteDist);
    let uwVignetteStrength = min(params.underwaterDepth * 0.15, 0.6);
    color *= mix(1.0, uwVignette, uwVignetteStrength);

    // Blue-green underwater tint
    let tintStrength = min(params.underwaterDepth * 0.08, 0.25);
    color = mix(color, color * vec3f(0.7, 0.9, 1.0), tintStrength);
  }

  return vec4<f32>(color, 1.0);
}
`,Mn=`// ======================== Volumetric Light Shafts (God Rays) ========================
// Screen-space ray marching with shadow map sampling

struct VolumetricUniforms {
  invViewProj: mat4x4<f32>,       // 64
  cameraPos: vec4<f32>,           // 16  (xyz=position, w=seaLevel)
  sunDir: vec4<f32>,              // 16  (xyz=direction, w=frameIndex)
  sunColor: vec4<f32>,            // 16  (rgb=color, w=intensity)
  params: vec4<f32>,              // 16  (x=density, y=scatterG, z=maxDist, w=numSteps)
};

struct ShadowUniforms {
  lightViewProj: array<mat4x4<f32>, 3>,  // 192
  cascadeSplits: vec4<f32>,               // 16
};

@group(0) @binding(0) var<uniform> uniforms: VolumetricUniforms;
@group(0) @binding(1) var depthTex: texture_depth_2d;
@group(0) @binding(2) var<uniform> shadow: ShadowUniforms;
@group(0) @binding(3) var shadowMap: texture_depth_2d_array;
@group(0) @binding(4) var shadowSampler: sampler_comparison;
@group(0) @binding(5) var linearSampler: sampler;

// Shared mathematical and PBR constants
const PI: f32 = 3.14159265359;
const TWO_PI: f32 = 6.28318530718;
const INV_PI: f32 = 0.31830988618;
const F0_DIELECTRIC: f32 = 0.04;

// Atmospheric scattering phase functions
// Requires: PI (from common/constants.wgsl)

fn rayleighPhase(cosTheta: f32) -> f32 {
  return 3.0 / (16.0 * PI) * (1.0 + cosTheta * cosTheta);
}

fn hgPhase(cosTheta: f32, g: f32) -> f32 {
  let g2 = g * g;
  let num = 1.0 - g2;
  let base = max(1.0 + g2 - 2.0 * g * cosTheta, 0.0);
  let denom = max(4.0 * PI * pow(base, 1.5), 0.0001);
  return num / denom;
}

// Sample shadow map at world position (simplified, single cascade lookup)
fn sampleShadowAt(worldPos: vec3<f32>) -> f32 {
  let camDist = distance(uniforms.cameraPos.xyz, worldPos);
  let splits = shadow.cascadeSplits;

  var cascadeIdx = 0u;
  if (camDist > splits.y) {
    cascadeIdx = 2u;
  } else if (camDist > splits.x) {
    cascadeIdx = 1u;
  }

  let lightSpacePos = shadow.lightViewProj[cascadeIdx] * vec4<f32>(worldPos, 1.0);
  let projCoords = lightSpacePos.xyz / lightSpacePos.w;
  let shadowUV = vec2<f32>(projCoords.x * 0.5 + 0.5, 1.0 - (projCoords.y * 0.5 + 0.5));

  if (shadowUV.x < 0.0 || shadowUV.x > 1.0 || shadowUV.y < 0.0 || shadowUV.y > 1.0) {
    return 1.0;
  }

  let currentDepth = projCoords.z;
  if (currentDepth > 1.0 || currentDepth < 0.0) {
    return 1.0;
  }

  // Single tap (no PCF for volumetric, performance)
  return textureSampleCompareLevel(
    shadowMap, shadowSampler,
    shadowUV,
    i32(cascadeIdx),
    currentDepth - 0.003
  );
}

// Reconstruct world position from screen UV + depth + inverse view-projection matrix.

fn reconstructWorldPos(uv: vec2<f32>, depth: f32, invViewProj: mat4x4<f32>) -> vec3<f32> {
  let ndc = vec4<f32>(uv * 2.0 - 1.0, depth, 1.0);
  let ndcFlipped = vec4<f32>(ndc.x, -ndc.y, ndc.z, 1.0);
  let worldH = invViewProj * ndcFlipped;
  return worldH.xyz / worldH.w;
}

// Fullscreen triangle vertex shader
// Generates a single triangle that covers the entire screen using vertex_index.

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

// Dual-lobe Henyey-Greenstein: forward scatter + back scatter
fn dualLobeHG(cosTheta: f32) -> f32 {
  let forward = hgPhase(cosTheta, 0.75);
  let back    = hgPhase(cosTheta, -0.3);
  return mix(back, forward, 0.7);
}

// Exponential height fog density
fn heightFogDensity(height: f32, seaLevel: f32) -> f32 {
  let heightAboveSea = height - seaLevel;
  let heightFalloff = 0.08;       // steeper falloff — fog clears faster above sea level
  let referenceDensity = 0.6;     // reduced from 1.0 to prevent washout
  if (heightAboveSea <= 0.0) {
    // Below sea level: denser, but not full 1.0 (let density param control overall)
    return referenceDensity * (1.0 + min(-heightAboveSea * 0.02, 0.4));
  }
  return referenceDensity * exp(-heightFalloff * heightAboveSea);
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let depth = textureLoad(depthTex, vec2<i32>(input.position.xy), 0);

  let density = uniforms.params.x;
  let maxDist = uniforms.params.z;
  let numSteps = i32(uniforms.params.w);

  let seaLevel = uniforms.cameraPos.w;

  // Reconstruct world position of pixel
  let worldPos = reconstructWorldPos(input.uv, depth, uniforms.invViewProj);
  let camPos = uniforms.cameraPos.xyz;

  // Ray from camera to pixel
  let rayDir = worldPos - camPos;
  let rayLength = length(rayDir);
  let rayDirNorm = rayDir / max(rayLength, 0.001);

  // Clamp march distance
  let marchDist = min(rayLength, maxDist);
  let stepSize = marchDist / f32(numSteps);

  // Phase function with dual-lobe HG
  let sunDir = normalize(uniforms.sunDir.xyz);
  let cosTheta = dot(rayDirNorm, sunDir);
  let phase = max(dualLobeHG(cosTheta), 0.001);

  // Fog color variation: warm near sun, cool away from sun (kept dim to avoid over-brightening)
  let warmFogColor = vec3<f32>(0.85, 0.75, 0.55);
  let coolFogColor = vec3<f32>(0.45, 0.5, 0.65);
  // Use a 0-1 blend based on phase contribution (normalized roughly)
  let phaseNorm = saturate((phase - 0.05) / 0.4);
  let fogTint = mix(coolFogColor, warmFogColor, phaseNorm);

  // Ambient scattering constant (keep very subtle to avoid washout)
  let ambientAmount = 0.03;

  // Underwater suppression: if camera is below sea level, reduce volumetric
  let camUnderwaterFactor = saturate(1.0 - saturate((seaLevel - camPos.y) * 0.1));

  // Accumulate scattered light via ray marching
  var sunAccum = 0.0;
  var ambientAccum = 0.0;

  // Temporal dithered start offset to reduce banding
  let frameIndex = uniforms.sunDir.w;
  let ditherPattern = fract(dot(input.position.xy, vec2<f32>(0.7548776662, 0.56984029)) + fract(frameIndex * 0.7548));
  let startOffset = ditherPattern * stepSize;

  for (var i = 0; i < numSteps; i++) {
    let t = startOffset + f32(i) * stepSize;
    let samplePos = camPos + rayDirNorm * t;

    // Exponential height-based density
    let fogDens = heightFogDensity(samplePos.y, seaLevel);

    // Underwater suppression for sample points below sea level
    let sampleUnderwaterSuppression = saturate(1.0 + (samplePos.y - seaLevel) * 0.05);
    let effectiveDensity = fogDens * mix(0.2, 1.0, sampleUnderwaterSuppression);

    let shadowVal = sampleShadowAt(samplePos);

    // Sun-directed scattering (modulated by shadow visibility)
    sunAccum += shadowVal * effectiveDensity;

    // Ambient scattering (always present, independent of shadow)
    ambientAccum += effectiveDensity;
  }

  sunAccum *= density * stepSize * phase;
  ambientAccum *= density * stepSize * ambientAmount;

  // Apply sun color and intensity
  let sunColor = uniforms.sunColor.rgb * uniforms.sunColor.w;

  // Sun-directed contribution tinted by fog color
  let sunContrib = sunColor * fogTint * sunAccum;
  // Ambient contribution with cool fog tint
  let ambientContrib = sunColor * coolFogColor * ambientAccum;

  let volumetricColor = (sunContrib + ambientContrib) * camUnderwaterFactor;

  return vec4<f32>(volumetricColor, 1.0);
}
`,Rn=`// Screen-Space Reflections (SSR)
// Ray marches in screen space using G-Buffer depth to find reflected geometry.
// Only active for low-roughness surfaces (ice, wet stone, etc.)

struct SSRUniforms {
  viewProjection: mat4x4<f32>,   // 64
  invViewProjection: mat4x4<f32>, // 64
  cameraPos: vec4<f32>,           // 16  (xyz=pos, w=unused)
  screenSize: vec4<f32>,          // 16  (xy=width/height, zw=unused)
};

@group(0) @binding(0) var<uniform> ssr: SSRUniforms;
@group(0) @binding(1) var gNormal: texture_2d<f32>;
@group(0) @binding(2) var gMaterial: texture_2d<f32>;
@group(0) @binding(3) var gDepth: texture_depth_2d;
@group(0) @binding(4) var hdrInput: texture_2d<f32>;
@group(0) @binding(5) var linearSampler: sampler;

const MAX_STEPS: u32 = 32u;
const STEP_SIZE: f32 = 0.5;
const BINARY_STEPS: u32 = 5u;
const THICKNESS: f32 = 0.3;
const ROUGHNESS_CUTOFF: f32 = 0.5;

// Fullscreen triangle vertex shader
// Generates a single triangle that covers the entire screen using vertex_index.

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

// Reconstruct world position from screen UV + depth + inverse view-projection matrix.

fn reconstructWorldPos(uv: vec2<f32>, depth: f32, invViewProj: mat4x4<f32>) -> vec3<f32> {
  let ndc = vec4<f32>(uv * 2.0 - 1.0, depth, 1.0);
  let ndcFlipped = vec4<f32>(ndc.x, -ndc.y, ndc.z, 1.0);
  let worldH = invViewProj * ndcFlipped;
  return worldH.xyz / worldH.w;
}

fn worldToScreen(worldPos: vec3<f32>) -> vec3<f32> {
  let clip = ssr.viewProjection * vec4<f32>(worldPos, 1.0);
  let ndc = clip.xyz / clip.w;
  // ndc.xy: -1..1, ndc.z: 0..1 (depth)
  let screenUV = vec2<f32>(ndc.x * 0.5 + 0.5, 1.0 - (ndc.y * 0.5 + 0.5));
  return vec3<f32>(screenUV, ndc.z);
}

fn fresnelSchlick(cosTheta: f32, F0: vec3<f32>) -> vec3<f32> {
  return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let pixelCoord = vec2<i32>(input.position.xy);
  let screenSize = ssr.screenSize.xy;

  // Base scene color (ping-pong: pass through for non-reflective pixels)
  let baseColor = textureSampleLevel(hdrInput, linearSampler, input.uv, 0.0);

  // Read material roughness
  let materialSample = textureLoad(gMaterial, pixelCoord, 0);
  let roughness = materialSample.r;
  let metallic = materialSample.g;

  // Early exit for rough surfaces — pass through base scene
  if (roughness > ROUGHNESS_CUTOFF) {
    return baseColor;
  }

  // Read depth
  let depth = textureLoad(gDepth, pixelCoord, 0);
  if (depth >= 1.0) {
    return baseColor;
  }

  // Read normal
  let normalSample = textureLoad(gNormal, pixelCoord, 0);
  let normal = normalize(normalSample.rgb * 2.0 - 1.0);

  // Reconstruct world position
  let worldPos = reconstructWorldPos(input.uv, depth, ssr.invViewProjection);
  let viewDir = normalize(ssr.cameraPos.xyz - worldPos);

  // Reflection direction
  let reflectDir = reflect(-viewDir, normal);

  // Fresnel for reflection intensity
  let albedoSample = vec3<f32>(0.04); // approximate F0 for dielectrics
  let F0 = mix(albedoSample, vec3<f32>(1.0), metallic);
  let NdotV = max(dot(normal, viewDir), 0.0);
  let fresnel = fresnelSchlick(NdotV, F0);

  // Roughness-based fade: smoother surfaces reflect more
  let roughnessFade = 1.0 - smoothstep(0.0, ROUGHNESS_CUTOFF, roughness);

  // Ray march in world space, project to screen space each step
  var rayPos = worldPos + reflectDir * 0.1; // offset to avoid self-intersection

  var hitColor = vec3<f32>(0.0);
  var hitAlpha = 0.0;
  var stepSize = STEP_SIZE;

  for (var i = 0u; i < MAX_STEPS; i++) {
    rayPos += reflectDir * stepSize;

    // Project to screen
    let screenCoord = worldToScreen(rayPos);
    let rayUV = screenCoord.xy;
    let rayDepth = screenCoord.z;

    // Check screen bounds
    if (rayUV.x < 0.0 || rayUV.x > 1.0 || rayUV.y < 0.0 || rayUV.y > 1.0) {
      break;
    }

    // Sample scene depth at this screen position
    let sampleCoord = vec2<i32>(rayUV * screenSize);
    let sceneDepth = textureLoad(gDepth, sampleCoord, 0);

    // Compare in world-space distance (linear) to avoid NDC nonlinearity
    if (sceneDepth > 0.0 && sceneDepth < 1.0) {
      let sceneWorldPos = reconstructWorldPos(rayUV, sceneDepth, ssr.invViewProjection);
      let linearRay = distance(ssr.cameraPos.xyz, rayPos);
      let linearScene = distance(ssr.cameraPos.xyz, sceneWorldPos);
      let diff = linearRay - linearScene;

      if (diff > 0.0 && diff < THICKNESS * stepSize * f32(i + 1u) * 0.5 + THICKNESS) {
        // Binary refinement (lo/hi bisection) for precision
        var lo = rayPos - reflectDir * stepSize;
        var hi = rayPos;
        for (var j = 0u; j < BINARY_STEPS; j++) {
          let mid = (lo + hi) * 0.5;
          let refScreen = worldToScreen(mid);
          if (refScreen.x < 0.0 || refScreen.x > 1.0 || refScreen.y < 0.0 || refScreen.y > 1.0) {
            break;
          }
          let refSampleCoord = vec2<i32>(refScreen.xy * screenSize);
          let refSceneDepth = textureLoad(gDepth, refSampleCoord, 0);
          let refSceneWorld = reconstructWorldPos(refScreen.xy, refSceneDepth, ssr.invViewProjection);
          if (distance(ssr.cameraPos.xyz, mid) > distance(ssr.cameraPos.xyz, refSceneWorld)) {
            hi = mid;  // ray behind surface -> move backward
          } else {
            lo = mid;  // ray in front -> move forward
          }
        }

        // Sample HDR color at refined hit point
        let finalScreen = worldToScreen((lo + hi) * 0.5);
        let finalUV = finalScreen.xy;
        if (finalUV.x >= 0.0 && finalUV.x <= 1.0 && finalUV.y >= 0.0 && finalUV.y <= 1.0) {
          let reflectedColor = textureSampleLevel(hdrInput, linearSampler, finalUV, 0.0).rgb;

          // Edge fade: fade out reflections near screen edges
          let edgeFade = 1.0 - pow(max(abs(finalUV.x * 2.0 - 1.0), abs(finalUV.y * 2.0 - 1.0)), 4.0);

          hitAlpha = clamp(edgeFade * roughnessFade, 0.0, 1.0);
          hitColor = reflectedColor * fresnel;
        }
        break;
      }
    }

    // Increase step size slightly for distant rays (acceleration)
    stepSize *= 1.05;
  }

  // Manual compositing: blend reflection over base scene color (ping-pong)
  let composited = mix(baseColor.rgb, hitColor, hitAlpha);
  return vec4<f32>(composited, 1.0);
}
`,En=`// Per-pixel Motion Blur with center-weighted, velocity-adaptive sampling

struct MotionBlurParams {
  strength: f32,
  samples: f32,  // max number of samples (8)
  _pad0: f32,
  _pad1: f32,
};

@group(0) @binding(0) var hdrTex: texture_2d<f32>;
@group(0) @binding(1) var velocityTex: texture_2d<f32>;
@group(0) @binding(2) var linearSampler: sampler;
@group(0) @binding(3) var<uniform> params: MotionBlurParams;

// Fullscreen triangle vertex shader
// Generates a single triangle that covers the entire screen using vertex_index.

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

// Soft maximum blur radius in UV space to prevent excessive stretching
const MAX_BLUR_RADIUS: f32 = 0.05;

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let centerColor = textureSampleLevel(hdrTex, linearSampler, input.uv, 0.0);
  let velocity = textureSampleLevel(velocityTex, linearSampler, input.uv, 0.0).rg;
  let speed = length(velocity);

  // Early-out for static or near-static pixels
  if (speed < 0.002) {
    return centerColor;
  }

  // Scale velocity by strength, then soft-clamp magnitude
  var scaledVelocity = velocity * params.strength;
  let scaledSpeed = length(scaledVelocity);

  // Soft clamp: smoothly limit blur radius to MAX_BLUR_RADIUS
  // Uses tanh-like curve: r * maxR / (r + maxR) approaches maxR asymptotically
  let clampedSpeed = scaledSpeed * MAX_BLUR_RADIUS / (scaledSpeed + MAX_BLUR_RADIUS);
  scaledVelocity = scaledVelocity * (clampedSpeed / max(scaledSpeed, 0.0001));

  // Adaptive sample count: scale with velocity magnitude
  // Fewer samples for slow motion, full samples for fast motion
  let maxSamples = i32(params.samples);
  let adaptiveFactor = clamp(scaledSpeed / MAX_BLUR_RADIUS, 0.0, 1.0);
  let numSamples = max(3, i32(f32(maxSamples) * adaptiveFactor));

  let halfSamples = f32(numSamples - 1) * 0.5;

  // Center-weighted accumulation with triangle filter kernel
  var colorAccum = vec3f(0.0);
  var weightAccum = 0.0;
  let centerVelocity = velocity;

  for (var i = 0; i < numSamples; i++) {
    let t = (f32(i) / f32(numSamples - 1)) - 0.5; // range: -0.5 to 0.5
    let sampleUV = clamp(input.uv + scaledVelocity * t, vec2f(0.0), vec2f(1.0));

    // Triangle weight: peaks at center (t=0), falls linearly to edges
    let dist = abs(t) * 2.0; // 0 at center, 1 at edges
    var weight = 1.0 - dist * 0.7; // center=1.0, edges=0.3

    // Velocity-based edge detection: compare sample velocity to center velocity
    // Large velocity difference indicates a depth discontinuity (foreground/background edge)
    let sampleVelocity = textureSampleLevel(velocityTex, linearSampler, sampleUV, 0.0).rg;
    let velocityDiff = length(sampleVelocity - centerVelocity);
    // Reduce weight for samples across velocity discontinuities
    let edgeFade = 1.0 / (1.0 + velocityDiff * 200.0);
    weight *= edgeFade;

    let sampleColor = textureSampleLevel(hdrTex, linearSampler, sampleUV, 0.0).rgb;
    colorAccum += sampleColor * weight;
    weightAccum += weight;
  }

  let blurredColor = colorAccum / max(weightAccum, 0.001);

  return vec4f(blurredColor, 1.0);
}
`,Fn=`// Depth of Field with signed Circle of Confusion (near/far separation)

struct DoFParams {
  focusDistance: f32,  // world-space focus distance
  aperture: f32,      // aperture size (controls blur amount)
  maxBlur: f32,       // max blur radius in pixels
  nearPlane: f32,
  farPlane: f32,
  _pad0: f32,
  _pad1: f32,
  _pad2: f32,
};

@group(0) @binding(0) var hdrTex: texture_2d<f32>;
@group(0) @binding(1) var depthTex: texture_depth_2d;
@group(0) @binding(2) var linearSampler: sampler;
@group(0) @binding(3) var<uniform> params: DoFParams;

// Fullscreen triangle vertex shader
// Generates a single triangle that covers the entire screen using vertex_index.

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

fn linearizeDepth(d: f32) -> f32 {
  let near = params.nearPlane;
  let far = params.farPlane;
  return near * far / (far - d * (far - near));
}

// Signed CoC: negative = foreground (near), positive = background (far)
fn calcSignedCoC(linearDepth: f32) -> f32 {
  return (linearDepth - params.focusDistance) * params.aperture / max(linearDepth, 0.001);
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let pixelCoord = vec2i(input.position.xy);
  let rawDepth = textureLoad(depthTex, pixelCoord, 0);
  let linearDepth = linearizeDepth(rawDepth);
  let dims = vec2f(textureDimensions(hdrTex));
  let texelSize = 1.0 / dims;

  // Sky detection: raw depth ~1.0 means infinitely far
  let isSky = rawDepth >= 0.999;

  // Signed CoC for this pixel
  var signedCoC: f32;
  if (isSky) {
    // Sky is infinitely far -> max far CoC
    signedCoC = params.maxBlur;
  } else {
    signedCoC = calcSignedCoC(linearDepth);
  }

  let absCoC = min(abs(signedCoC), params.maxBlur);

  // Skip blur if well within focus
  if (absCoC < 0.5) {
    return textureSampleLevel(hdrTex, linearSampler, input.uv, 0.0);
  }

  let centerIsNear = signedCoC < 0.0;

  // Vogel disk: golden angle spiral gives near-uniform disc distribution without grid artifacts
  let goldenAngle = 2.39996323;
  let numSamples = 32;

  var nearColor  = vec3f(0.0);
  var nearWeight = 0.0;
  var farColor   = vec3f(0.0);
  var farWeight  = 0.0;

  for (var i = 0; i < numSamples; i++) {
    // Uniform disc distribution via square-root spacing
    let fi = f32(i);
    let fn_count = f32(numSamples);
    let r = sqrt((fi + 0.5) / fn_count);
    let theta = fi * goldenAngle;
    let unitOffset = vec2f(cos(theta), sin(theta)) * r;

    let sampleOffset = unitOffset * absCoC * texelSize;
    let sampleUV = clamp(input.uv + sampleOffset, vec2f(0.001), vec2f(0.999));

    // Read sample color and depth
    let sampleColor = textureSampleLevel(hdrTex, linearSampler, sampleUV, 0.0).rgb;
    let samplePixel = vec2i(sampleUV * dims);
    let sampleRawDepth = textureLoad(depthTex, samplePixel, 0);
    let sampleLinear = linearizeDepth(sampleRawDepth);
    let sampleIsSky = sampleRawDepth >= 0.999;

    // Signed CoC of the sample
    var sampleSCoC: f32;
    if (sampleIsSky) {
      sampleSCoC = params.maxBlur;
    } else {
      sampleSCoC = calcSignedCoC(sampleLinear);
    }
    let sampleAbsCoC = min(abs(sampleSCoC), params.maxBlur);

    // Soft circular kernel weight: attenuate samples near disc edge
    let kernelWeight = 1.0 - smoothstep(0.8, 1.0, r);

    // Near field (foreground): spreads OVER in-focus regions
    // Use max(sampleCoC, centerCoC) trick so foreground bokeh bleeds outward
    if (sampleSCoC < 0.0 || centerIsNear) {
      let nearCoC = select(absCoC, max(sampleAbsCoC, absCoC), sampleSCoC < 0.0);
      let w = kernelWeight * smoothstep(0.0, 2.0, nearCoC);
      nearColor += sampleColor * w;
      nearWeight += w;
    }

    // Far field (background): only gather from background or in-focus pixels
    if (sampleSCoC >= 0.0) {
      let w = kernelWeight * smoothstep(0.0, 2.0, sampleAbsCoC);
      farColor += sampleColor * w;
      farWeight += w;
    }
  }

  // Normalize accumulated colors
  if (nearWeight > 0.0) {
    nearColor /= nearWeight;
  }
  if (farWeight > 0.0) {
    farColor /= farWeight;
  }

  // Compose near and far layers
  var blurred: vec3f;
  if (centerIsNear) {
    // Foreground pixel: near field dominates, blend in far if available
    let farMix = select(0.0, 0.3, farWeight > 0.0);
    blurred = mix(nearColor, farColor, farMix);
  } else {
    // Background pixel: far field dominates, near can bleed over
    if (nearWeight > 0.0 && nearWeight > farWeight * 0.5) {
      // Strong foreground presence -> blend near over far
      let nearInfluence = saturate(nearWeight / (nearWeight + farWeight));
      blurred = mix(farColor, nearColor, nearInfluence * 0.6);
    } else {
      blurred = farColor;
    }
  }

  // Handle edge case where no samples accumulated
  let hasAny = (nearWeight + farWeight) > 0.0;
  if (!hasAny) {
    blurred = textureSampleLevel(hdrTex, linearSampler, input.uv, 0.0).rgb;
  }

  // Smooth transition from sharp to blurred (wider range avoids hard edges)
  let original = textureSampleLevel(hdrTex, linearSampler, input.uv, 0.0).rgb;
  let blendFactor = smoothstep(0.5, 3.0, absCoC);
  let finalColor = mix(original, blurred, blendFactor);

  return vec4f(finalColor, 1.0);
}
`,Dn=`// Luminance extraction: HDR → log2(luminance) at quarter resolution
// Bilinear sampling provides natural 2x2 downscale

@group(0) @binding(0) var hdrTex: texture_2d<f32>;
@group(0) @binding(1) var linearSampler: sampler;

// Fullscreen triangle vertex shader
// Generates a single triangle that covers the entire screen using vertex_index.

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

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let color = textureSampleLevel(hdrTex, linearSampler, input.uv, 0.0).rgb;
  let luminance = dot(color, vec3f(0.2126, 0.7152, 0.0722));
  let logLum = log2(luminance + 0.0001);
  return vec4f(logLum, 0.0, 0.0, 1.0);
}
`,Un=`// Simple bilinear downsample for luminance mip chain (r16float)

@group(0) @binding(0) var srcTex: texture_2d<f32>;
@group(0) @binding(1) var linearSampler: sampler;

// Fullscreen triangle vertex shader
// Generates a single triangle that covers the entire screen using vertex_index.

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

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let val = textureSampleLevel(srcTex, linearSampler, input.uv, 0.0).r;
  return vec4f(val, 0.0, 0.0, 1.0);
}
`,On=`// Temporal adaptation: smoothly adjust exposure based on scene luminance

struct AdaptParams {
  adaptSpeed: f32,
  keyValue: f32,
  minExposure: f32,
  maxExposure: f32,
  dt: f32,
  _pad0: f32,
  _pad1: f32,
  _pad2: f32,
};

@group(0) @binding(0) var currentLumTex: texture_2d<f32>;
@group(0) @binding(1) var prevAdaptedTex: texture_2d<f32>;
@group(0) @binding(2) var linearSampler: sampler;
@group(0) @binding(3) var<uniform> params: AdaptParams;

// Fullscreen triangle vertex shader
// Generates a single triangle that covers the entire screen using vertex_index.

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

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let logLum = textureSampleLevel(currentLumTex, linearSampler, vec2f(0.5), 0.0).r;
  let avgLum = exp2(logLum);
  let targetExposure = clamp(
    params.keyValue / (avgLum + 0.0001),
    params.minExposure,
    params.maxExposure,
  );

  let prevExposure = textureSampleLevel(prevAdaptedTex, linearSampler, vec2f(0.5), 0.0).r;

  // First frame: snap immediately (prevExposure is 0 from cleared texture)
  var adaptedExposure: f32;
  if (prevExposure < 0.001) {
    adaptedExposure = targetExposure;
  } else {
    let alpha = 1.0 - exp(-params.adaptSpeed * params.dt);
    adaptedExposure = mix(prevExposure, targetExposure, alpha);
  }

  return vec4f(adaptedExposure, 0.0, 0.0, 1.0);
}
`,gt=32,Vn=16,In=32,vt=128,xt=160;class Nn{ctx;hdrTextures;hdrViews;hdrCurrent=0;get hdrTexture(){return this.hdrTextures[this.hdrCurrent]}get hdrTextureView(){return this.hdrViews[this.hdrCurrent]}get hdrCopyTexture(){return this.hdrTextures[1-this.hdrCurrent]}get hdrCopyTextureView(){return this.hdrViews[1-this.hdrCurrent]}get hdrOtherView(){return this.hdrViews[1-this.hdrCurrent]}get hdrOtherTexture(){return this.hdrTextures[1-this.hdrCurrent]}swapHdr(){this.hdrCurrent=1-this.hdrCurrent}getHdrView(e){return this.hdrViews[e]}get hdrCurrentIndex(){return this.hdrCurrent}bloomMips=[];bloomMipViews=[];thresholdPipeline;downsamplePipeline;upsamplePipeline;tonemapPipeline;volumetricPipeline;ssrPipeline;thresholdBGL;downsampleBGL;upsampleBGL;tonemapBGL;volumetricBGL;ssrBGL;bloomParamsBuffer;bloomUpParamsBuffer;tonemapParamsBuffer;volumetricUniformBuffer;volumetricF32=new Float32Array(vt/4);ssrUniformBuffer;ssrF32=new Float32Array(xt/4);linearSampler;thresholdBindGroups=null;downsampleBindGroups=[];upsampleBindGroups=[];tonemapBindGroups=null;volumetricBindGroup=null;ssrBindGroups=null;depthTextureView=null;shadowUniformBuffer=null;shadowTextureView=null;shadowSampler=null;ssrNormalView=null;ssrMaterialView=null;ssrDepthView=null;motionBlurPipeline;motionBlurBGL;motionBlurParamsBuffer;motionBlurBindGroups=null;motionBlurVelocityView=null;dofPipeline;dofBGL;dofParamsBuffer;dofBindGroups=null;dofDepthView=null;lumExtractPipeline;lumDownsamplePipeline;lumAdaptPipeline;lumExtractBGL;lumDownsampleBGL;lumAdaptBGL;lumMips=[];lumMipViews=[];adaptedLumTextures=null;adaptedLumViews=null;adaptParamsBuffer;adaptParamsF32=new Float32Array(gt/4);lumExtractBindGroups=null;lumDownsampleBindGroups=[];lumAdaptBindGroups=null;adaptPingPong=0;constructor(e){this.ctx=e,this.createSampler(),this.createUniformBuffers(),this.createPipelines(),this.createMotionBlurPipeline(),this.createDoFPipeline(),this.createAutoExposurePipelines(),this.createTextures()}createSampler(){this.linearSampler=this.ctx.device.createSampler({magFilter:"linear",minFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"})}createUniformBuffers(){const e=this.ctx.device,t=T.data.rendering.bloom;this.bloomParamsBuffer=e.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),e.queue.writeBuffer(this.bloomParamsBuffer,0,new Float32Array([t.threshold,.5,0,0])),this.bloomUpParamsBuffer=e.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),e.queue.writeBuffer(this.bloomUpParamsBuffer,0,new Float32Array([1,0,0,0])),this.tonemapParamsBuffer=e.createBuffer({size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),e.queue.writeBuffer(this.tonemapParamsBuffer,0,new Float32Array([t.intensity,.7,0,0,0,0,0,0])),this.volumetricUniformBuffer=e.createBuffer({size:vt,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.ssrUniformBuffer=e.createBuffer({size:xt,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.motionBlurParamsBuffer=e.createBuffer({size:Vn,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});const n=T.data.rendering.motionBlur;e.queue.writeBuffer(this.motionBlurParamsBuffer,0,new Float32Array([n.strength,8,0,0])),this.dofParamsBuffer=e.createBuffer({size:In,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});const r=T.data.rendering.dof;e.queue.writeBuffer(this.dofParamsBuffer,0,new Float32Array([r.focusDistance,r.aperture,r.maxBlur,T.data.camera.near,T.data.camera.far,0,0,0])),this.adaptParamsBuffer=e.createBuffer({size:gt,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})}createPipelines(){const e=this.ctx.device;this.thresholdBGL=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,sampler:{}},{binding:2,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]});const t=e.createShaderModule({code:Cn});this.thresholdPipeline=e.createRenderPipeline({layout:e.createPipelineLayout({bindGroupLayouts:[this.thresholdBGL]}),vertex:{module:t,entryPoint:"vs_main"},fragment:{module:t,entryPoint:"fs_main",targets:[{format:te}]},primitive:{topology:"triangle-list"}}),this.downsampleBGL=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,sampler:{}}]});const n=e.createShaderModule({code:Gn});this.downsamplePipeline=e.createRenderPipeline({layout:e.createPipelineLayout({bindGroupLayouts:[this.downsampleBGL]}),vertex:{module:n,entryPoint:"vs_main"},fragment:{module:n,entryPoint:"fs_main",targets:[{format:te}]},primitive:{topology:"triangle-list"}}),this.upsampleBGL=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,sampler:{}},{binding:2,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]});const r=e.createShaderModule({code:An});this.upsamplePipeline=e.createRenderPipeline({layout:e.createPipelineLayout({bindGroupLayouts:[this.upsampleBGL]}),vertex:{module:r,entryPoint:"vs_main"},fragment:{module:r,entryPoint:"fs_main",targets:[{format:te,blend:{color:{srcFactor:"one",dstFactor:"one",operation:"add"},alpha:{srcFactor:"one",dstFactor:"one",operation:"add"}}}]},primitive:{topology:"triangle-list"}}),this.tonemapBGL=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,sampler:{}},{binding:3,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:4,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}}]});const s=e.createShaderModule({code:Ln});this.tonemapPipeline=e.createRenderPipeline({layout:e.createPipelineLayout({bindGroupLayouts:[this.tonemapBGL]}),vertex:{module:s,entryPoint:"vs_main"},fragment:{module:s,entryPoint:"fs_main",targets:[{format:this.ctx.format}]},primitive:{topology:"triangle-list"}}),this.volumetricBGL=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"depth"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:3,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"depth",viewDimension:"2d-array"}},{binding:4,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"comparison"}},{binding:5,visibility:GPUShaderStage.FRAGMENT,sampler:{}}]});const o=e.createShaderModule({code:Mn});this.volumetricPipeline=e.createRenderPipeline({layout:e.createPipelineLayout({bindGroupLayouts:[this.volumetricBGL]}),vertex:{module:o,entryPoint:"vs_main"},fragment:{module:o,entryPoint:"fs_main",targets:[{format:te,blend:{color:{srcFactor:"one",dstFactor:"one",operation:"add"},alpha:{srcFactor:"zero",dstFactor:"one",operation:"add"}}}]},primitive:{topology:"triangle-list"}}),this.ssrBGL=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:3,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"depth"}},{binding:4,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:5,visibility:GPUShaderStage.FRAGMENT,sampler:{}}]});const l=e.createShaderModule({code:Rn});this.ssrPipeline=e.createRenderPipeline({layout:e.createPipelineLayout({bindGroupLayouts:[this.ssrBGL]}),vertex:{module:l,entryPoint:"vs_main"},fragment:{module:l,entryPoint:"fs_main",targets:[{format:te}]},primitive:{topology:"triangle-list"}})}createMotionBlurPipeline(){const e=this.ctx.device;this.motionBlurBGL=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,sampler:{}},{binding:3,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]});const t=e.createShaderModule({code:En});this.motionBlurPipeline=e.createRenderPipeline({layout:e.createPipelineLayout({bindGroupLayouts:[this.motionBlurBGL]}),vertex:{module:t,entryPoint:"vs_main"},fragment:{module:t,entryPoint:"fs_main",targets:[{format:te}]},primitive:{topology:"triangle-list"}})}createDoFPipeline(){const e=this.ctx.device;this.dofBGL=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"depth"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,sampler:{}},{binding:3,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]});const t=e.createShaderModule({code:Fn});this.dofPipeline=e.createRenderPipeline({layout:e.createPipelineLayout({bindGroupLayouts:[this.dofBGL]}),vertex:{module:t,entryPoint:"vs_main"},fragment:{module:t,entryPoint:"fs_main",targets:[{format:te}]},primitive:{topology:"triangle-list"}})}createAutoExposurePipelines(){const e=this.ctx.device;this.lumExtractBGL=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,sampler:{}}]});const t=e.createShaderModule({code:Dn});this.lumExtractPipeline=e.createRenderPipeline({layout:e.createPipelineLayout({bindGroupLayouts:[this.lumExtractBGL]}),vertex:{module:t,entryPoint:"vs_main"},fragment:{module:t,entryPoint:"fs_main",targets:[{format:ge}]},primitive:{topology:"triangle-list"}}),this.lumDownsampleBGL=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,sampler:{}}]});const n=e.createShaderModule({code:Un});this.lumDownsamplePipeline=e.createRenderPipeline({layout:e.createPipelineLayout({bindGroupLayouts:[this.lumDownsampleBGL]}),vertex:{module:n,entryPoint:"vs_main"},fragment:{module:n,entryPoint:"fs_main",targets:[{format:ge}]},primitive:{topology:"triangle-list"}}),this.lumAdaptBGL=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,sampler:{}},{binding:3,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]});const r=e.createShaderModule({code:On});this.lumAdaptPipeline=e.createRenderPipeline({layout:e.createPipelineLayout({bindGroupLayouts:[this.lumAdaptBGL]}),vertex:{module:r,entryPoint:"vs_main"},fragment:{module:r,entryPoint:"fs_main",targets:[{format:ge}]},primitive:{topology:"triangle-list"}})}createTextures(){const e=T.data.rendering.bloom.mipLevels;this.hdrTextures&&(this.hdrTextures[0].destroy(),this.hdrTextures[1].destroy());for(const m of this.bloomMips)m.destroy();this.bloomMips=[],this.bloomMipViews=[];for(const m of this.lumMips)m.destroy();this.lumMips=[],this.lumMipViews=[],this.adaptedLumTextures&&(this.adaptedLumTextures[0].destroy(),this.adaptedLumTextures[1].destroy(),this.adaptedLumTextures=null,this.adaptedLumViews=null);const t=this.ctx.canvas.width,n=this.ctx.canvas.height,r=GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_SRC|GPUTextureUsage.COPY_DST,s=this.ctx.device.createTexture({size:[t,n],format:te,usage:r}),o=this.ctx.device.createTexture({size:[t,n],format:te,usage:r});this.hdrTextures=[s,o],this.hdrViews=[s.createView(),o.createView()],this.hdrCurrent=0;let l=Math.max(1,Math.floor(t/2)),a=Math.max(1,Math.floor(n/2));for(let m=0;m<e;m++){const v=this.ctx.device.createTexture({size:[l,a],format:te,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING});this.bloomMips.push(v),this.bloomMipViews.push(v.createView()),l=Math.max(1,Math.floor(l/2)),a=Math.max(1,Math.floor(a/2))}let c=Math.max(1,Math.floor(t/4)),u=Math.max(1,Math.floor(n/4));for(;c>1||u>1;){const m=this.ctx.device.createTexture({size:[c,u],format:ge,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING});this.lumMips.push(m),this.lumMipViews.push(m.createView()),c=Math.max(1,Math.floor(c/2)),u=Math.max(1,Math.floor(u/2))}const d=this.ctx.device.createTexture({size:[1,1],format:ge,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING});this.lumMips.push(d),this.lumMipViews.push(d.createView());const f=this.ctx.device.createTexture({size:[1,1],format:ge,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING}),h=this.ctx.device.createTexture({size:[1,1],format:ge,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING});this.adaptedLumTextures=[f,h],this.adaptedLumViews=[f.createView(),h.createView()],this.adaptPingPong=0,this.rebuildBindGroups()}rebuildBindGroups(){const e=T.data.rendering.bloom.mipLevels;this.thresholdBindGroups=[this.ctx.device.createBindGroup({layout:this.thresholdBGL,entries:[{binding:0,resource:this.hdrViews[0]},{binding:1,resource:this.linearSampler},{binding:2,resource:{buffer:this.bloomParamsBuffer}}]}),this.ctx.device.createBindGroup({layout:this.thresholdBGL,entries:[{binding:0,resource:this.hdrViews[1]},{binding:1,resource:this.linearSampler},{binding:2,resource:{buffer:this.bloomParamsBuffer}}]})],this.downsampleBindGroups=[];for(let t=1;t<e;t++)this.downsampleBindGroups.push(this.ctx.device.createBindGroup({layout:this.downsampleBGL,entries:[{binding:0,resource:this.bloomMipViews[t-1]},{binding:1,resource:this.linearSampler}]}));this.upsampleBindGroups=[];for(let t=e-1;t>0;t--)this.upsampleBindGroups.push(this.ctx.device.createBindGroup({layout:this.upsampleBGL,entries:[{binding:0,resource:this.bloomMipViews[t]},{binding:1,resource:this.linearSampler},{binding:2,resource:{buffer:this.bloomUpParamsBuffer}}]}));this.rebuildTonemapBindGroup(),this.rebuildAutoExposureBindGroups()}rebuildTonemapBindGroup(){const e=this.adaptedLumViews?this.adaptedLumViews[this.adaptPingPong]:null;e&&(this.tonemapBindGroups=[this.ctx.device.createBindGroup({layout:this.tonemapBGL,entries:[{binding:0,resource:this.hdrViews[0]},{binding:1,resource:this.bloomMipViews[0]},{binding:2,resource:this.linearSampler},{binding:3,resource:{buffer:this.tonemapParamsBuffer}},{binding:4,resource:e}]}),this.ctx.device.createBindGroup({layout:this.tonemapBGL,entries:[{binding:0,resource:this.hdrViews[1]},{binding:1,resource:this.bloomMipViews[0]},{binding:2,resource:this.linearSampler},{binding:3,resource:{buffer:this.tonemapParamsBuffer}},{binding:4,resource:e}]})])}rebuildAutoExposureBindGroups(){if(!this.adaptedLumViews||this.lumMipViews.length===0)return;this.lumExtractBindGroups=[this.ctx.device.createBindGroup({layout:this.lumExtractBGL,entries:[{binding:0,resource:this.hdrViews[0]},{binding:1,resource:this.linearSampler}]}),this.ctx.device.createBindGroup({layout:this.lumExtractBGL,entries:[{binding:0,resource:this.hdrViews[1]},{binding:1,resource:this.linearSampler}]})],this.lumDownsampleBindGroups=[];for(let t=1;t<this.lumMipViews.length;t++)this.lumDownsampleBindGroups.push(this.ctx.device.createBindGroup({layout:this.lumDownsampleBGL,entries:[{binding:0,resource:this.lumMipViews[t-1]},{binding:1,resource:this.linearSampler}]}));const e=this.lumMipViews[this.lumMipViews.length-1];this.lumAdaptBindGroups=[this.ctx.device.createBindGroup({layout:this.lumAdaptBGL,entries:[{binding:0,resource:e},{binding:1,resource:this.adaptedLumViews[0]},{binding:2,resource:this.linearSampler},{binding:3,resource:{buffer:this.adaptParamsBuffer}}]}),this.ctx.device.createBindGroup({layout:this.lumAdaptBGL,entries:[{binding:0,resource:e},{binding:1,resource:this.adaptedLumViews[1]},{binding:2,resource:this.linearSampler},{binding:3,resource:{buffer:this.adaptParamsBuffer}}]})]}setVolumetricResources(e,t,n,r){this.depthTextureView=e,this.shadowUniformBuffer=t,this.shadowTextureView=n,this.shadowSampler=r,this.rebuildVolumetricBindGroup()}rebuildVolumetricBindGroup(){!this.depthTextureView||!this.shadowUniformBuffer||!this.shadowTextureView||!this.shadowSampler||(this.volumetricBindGroup=this.ctx.device.createBindGroup({layout:this.volumetricBGL,entries:[{binding:0,resource:{buffer:this.volumetricUniformBuffer}},{binding:1,resource:this.depthTextureView},{binding:2,resource:{buffer:this.shadowUniformBuffer}},{binding:3,resource:this.shadowTextureView},{binding:4,resource:this.shadowSampler},{binding:5,resource:this.linearSampler}]}))}updateVolumetric(e,t,n,r,s,o,l){const a=this.volumetricF32;a.set(e,0),a[16]=t[0],a[17]=t[1],a[18]=t[2],a[19]=o,a[20]=n[0],a[21]=n[1],a[22]=n[2],a[23]=l,a[24]=r[0],a[25]=r[1],a[26]=r[2],a[27]=s,a[28]=.04,a[29]=.75,a[30]=120,a[31]=16,this.ctx.device.queue.writeBuffer(this.volumetricUniformBuffer,0,a)}renderVolumetric(e){if(!this.volumetricBindGroup)return;const t=e.beginRenderPass({colorAttachments:[{view:this.hdrTextureView,loadOp:"load",storeOp:"store"}]});t.setPipeline(this.volumetricPipeline),t.setBindGroup(0,this.volumetricBindGroup),t.draw(3),t.end()}setSSRResources(e,t,n){this.ssrNormalView=e,this.ssrMaterialView=t,this.ssrDepthView=n,this.rebuildSSRBindGroup()}rebuildSSRBindGroup(){!this.ssrNormalView||!this.ssrMaterialView||!this.ssrDepthView||(this.ssrBindGroups=[this.ctx.device.createBindGroup({layout:this.ssrBGL,entries:[{binding:0,resource:{buffer:this.ssrUniformBuffer}},{binding:1,resource:this.ssrNormalView},{binding:2,resource:this.ssrMaterialView},{binding:3,resource:this.ssrDepthView},{binding:4,resource:this.hdrViews[0]},{binding:5,resource:this.linearSampler}]}),this.ctx.device.createBindGroup({layout:this.ssrBGL,entries:[{binding:0,resource:{buffer:this.ssrUniformBuffer}},{binding:1,resource:this.ssrNormalView},{binding:2,resource:this.ssrMaterialView},{binding:3,resource:this.ssrDepthView},{binding:4,resource:this.hdrViews[1]},{binding:5,resource:this.linearSampler}]})])}updateSSR(e,t,n){const r=this.ssrF32;r.set(e,0),r.set(t,16),r[32]=n[0],r[33]=n[1],r[34]=n[2],r[35]=0,r[36]=this.ctx.canvas.width,r[37]=this.ctx.canvas.height,r[38]=0,r[39]=0,this.ctx.device.queue.writeBuffer(this.ssrUniformBuffer,0,r)}renderSSR(e){if(!this.ssrBindGroups)return;const t=this.ssrBindGroups[this.hdrCurrent],n=e.beginRenderPass({colorAttachments:[{view:this.hdrOtherView,clearValue:{r:0,g:0,b:0,a:1},loadOp:"clear",storeOp:"store"}]});n.setPipeline(this.ssrPipeline),n.setBindGroup(0,t),n.draw(3),n.end(),this.swapHdr()}updateTimeOfDay(e){this.ctx.device.queue.writeBuffer(this.tonemapParamsBuffer,8,new Float32Array([e]))}updateUnderwaterDepth(e){this.ctx.device.queue.writeBuffer(this.tonemapParamsBuffer,16,new Float32Array([e]))}updateBloomParams(){const e=T.data.rendering.bloom,t=T.data.rendering.autoExposure;this.ctx.device.queue.writeBuffer(this.bloomParamsBuffer,0,new Float32Array([e.threshold,.5,0,0])),this.ctx.device.queue.writeBuffer(this.tonemapParamsBuffer,0,new Float32Array([e.intensity,.7,0,t.enabled?1:0]));const n=T.data.rendering.motionBlur;this.ctx.device.queue.writeBuffer(this.motionBlurParamsBuffer,0,new Float32Array([n.strength,8,0,0]));const r=T.data.rendering.dof;this.ctx.device.queue.writeBuffer(this.dofParamsBuffer,0,new Float32Array([r.focusDistance,r.aperture,r.maxBlur,T.data.camera.near,T.data.camera.far,0,0,0]))}renderMotionBlur(e,t){this.motionBlurVelocityView!==t&&(this.motionBlurVelocityView=t,this.motionBlurBindGroups=[this.ctx.device.createBindGroup({layout:this.motionBlurBGL,entries:[{binding:0,resource:this.hdrViews[0]},{binding:1,resource:t},{binding:2,resource:this.linearSampler},{binding:3,resource:{buffer:this.motionBlurParamsBuffer}}]}),this.ctx.device.createBindGroup({layout:this.motionBlurBGL,entries:[{binding:0,resource:this.hdrViews[1]},{binding:1,resource:t},{binding:2,resource:this.linearSampler},{binding:3,resource:{buffer:this.motionBlurParamsBuffer}}]})]);const n=this.motionBlurBindGroups[this.hdrCurrent],r=e.beginRenderPass({colorAttachments:[{view:this.hdrOtherView,clearValue:{r:0,g:0,b:0,a:1},loadOp:"clear",storeOp:"store"}]});r.setPipeline(this.motionBlurPipeline),r.setBindGroup(0,n),r.draw(3),r.end(),this.swapHdr()}renderDoF(e,t){this.dofDepthView!==t&&(this.dofDepthView=t,this.dofBindGroups=[this.ctx.device.createBindGroup({layout:this.dofBGL,entries:[{binding:0,resource:this.hdrViews[0]},{binding:1,resource:t},{binding:2,resource:this.linearSampler},{binding:3,resource:{buffer:this.dofParamsBuffer}}]}),this.ctx.device.createBindGroup({layout:this.dofBGL,entries:[{binding:0,resource:this.hdrViews[1]},{binding:1,resource:t},{binding:2,resource:this.linearSampler},{binding:3,resource:{buffer:this.dofParamsBuffer}}]})]);const n=this.dofBindGroups[this.hdrCurrent],r=e.beginRenderPass({colorAttachments:[{view:this.hdrOtherView,clearValue:{r:0,g:0,b:0,a:1},loadOp:"clear",storeOp:"store"}]});r.setPipeline(this.dofPipeline),r.setBindGroup(0,n),r.draw(3),r.end(),this.swapHdr()}renderAutoExposure(e,t){if(!T.data.rendering.autoExposure.enabled||!this.lumExtractBindGroups||!this.lumAdaptBindGroups||!this.adaptedLumViews)return;const n=T.data.rendering.autoExposure,r=this.adaptParamsF32;r[0]=n.adaptSpeed,r[1]=n.keyValue,r[2]=n.minExposure,r[3]=n.maxExposure,r[4]=t,this.ctx.device.queue.writeBuffer(this.adaptParamsBuffer,0,r);{const l=e.beginRenderPass({colorAttachments:[{view:this.lumMipViews[0],clearValue:{r:0,g:0,b:0,a:0},loadOp:"clear",storeOp:"store"}]});l.setPipeline(this.lumExtractPipeline),l.setBindGroup(0,this.lumExtractBindGroups[this.hdrCurrent]),l.draw(3),l.end()}for(let l=1;l<this.lumMipViews.length;l++){const a=e.beginRenderPass({colorAttachments:[{view:this.lumMipViews[l],clearValue:{r:0,g:0,b:0,a:0},loadOp:"clear",storeOp:"store"}]});a.setPipeline(this.lumDownsamplePipeline),a.setBindGroup(0,this.lumDownsampleBindGroups[l-1]),a.draw(3),a.end()}const s=this.adaptPingPong,o=1-this.adaptPingPong;{const l=e.beginRenderPass({colorAttachments:[{view:this.adaptedLumViews[o],clearValue:{r:0,g:0,b:0,a:0},loadOp:"clear",storeOp:"store"}]});l.setPipeline(this.lumAdaptPipeline),l.setBindGroup(0,this.lumAdaptBindGroups[s]),l.draw(3),l.end()}this.adaptPingPong=o,this.rebuildTonemapBindGroup()}renderBloomAndTonemap(e,t){const n=T.data.rendering.bloom.mipLevels;{const r=e.beginRenderPass({colorAttachments:[{view:this.bloomMipViews[0],clearValue:{r:0,g:0,b:0,a:0},loadOp:"clear",storeOp:"store"}]});r.setPipeline(this.thresholdPipeline),r.setBindGroup(0,this.thresholdBindGroups[this.hdrCurrent]),r.draw(3),r.end()}for(let r=1;r<n;r++){const s=e.beginRenderPass({colorAttachments:[{view:this.bloomMipViews[r],clearValue:{r:0,g:0,b:0,a:0},loadOp:"clear",storeOp:"store"}]});s.setPipeline(this.downsamplePipeline),s.setBindGroup(0,this.downsampleBindGroups[r-1]),s.draw(3),s.end()}for(let r=n-1;r>0;r--){const s=e.beginRenderPass({colorAttachments:[{view:this.bloomMipViews[r-1],loadOp:"load",storeOp:"store"}]});s.setPipeline(this.upsamplePipeline),s.setBindGroup(0,this.upsampleBindGroups[n-1-r]),s.draw(3),s.end()}{const r=e.beginRenderPass({colorAttachments:[{view:t,clearValue:{r:0,g:0,b:0,a:1},loadOp:"clear",storeOp:"store"}]});r.setPipeline(this.tonemapPipeline),r.setBindGroup(0,this.tonemapBindGroups[this.hdrCurrent]),r.draw(3),r.end()}}resize(){this.createTextures(),this.rebuildSSRBindGroup(),this.motionBlurBindGroups=null,this.motionBlurVelocityView=null,this.dofBindGroups=null,this.dofDepthView=null}}async function Te(i,e){const t=await e.getCompilationInfo();for(const n of t.messages){if(n.type==="error")throw new Error(`[${i}] shader error (line ${n.lineNum}): ${n.message}`);console.warn(`[${i}] ${n.type}: ${n.message} (line ${n.lineNum})`)}}const kn=`// Velocity pass: compute per-pixel motion vectors from depth reprojection

struct VelocityUniforms {
  invViewProj: mat4x4<f32>,      // current frame (unjittered)
  prevViewProj: mat4x4<f32>,     // previous frame (unjittered)
};

@group(0) @binding(0) var<uniform> uniforms: VelocityUniforms;
@group(0) @binding(1) var depthTex: texture_depth_2d;

// Fullscreen triangle vertex shader
// Generates a single triangle that covers the entire screen using vertex_index.

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

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec2<f32> {
  let pixelCoord = vec2<i32>(input.position.xy);
  let depth = textureLoad(depthTex, pixelCoord, 0);

  // Sky pixels: zero velocity
  if (depth >= 1.0) {
    return vec2<f32>(0.0, 0.0);
  }

  // Reconstruct world position from depth (unjittered)
  let ndc = vec4<f32>(
    input.uv.x * 2.0 - 1.0,
    -(input.uv.y * 2.0 - 1.0),
    depth,
    1.0
  );
  let worldH = uniforms.invViewProj * ndc;
  let worldPos = worldH.xyz / worldH.w;

  // Reproject to previous frame
  let prevClip = uniforms.prevViewProj * vec4<f32>(worldPos, 1.0);
  let prevNDC = prevClip.xyz / prevClip.w;
  let prevUV = vec2<f32>(prevNDC.x * 0.5 + 0.5, 0.5 - prevNDC.y * 0.5);

  // Velocity = current UV - previous UV
  let velocity = input.uv - prevUV;

  return velocity;
}
`,_n=`// TAA Resolve: blend current frame with clamped history

struct TAAUniforms {
  blendFactor: f32,
  _pad0: f32,
  _pad1: f32,
  _pad2: f32,
};

@group(0) @binding(0) var<uniform> uniforms: TAAUniforms;
@group(0) @binding(1) var currentTex: texture_2d<f32>;
@group(0) @binding(2) var historyTex: texture_2d<f32>;
@group(0) @binding(3) var velocityTex: texture_2d<f32>;
@group(0) @binding(4) var linearSampler: sampler;

// Fullscreen triangle vertex shader
// Generates a single triangle that covers the entire screen using vertex_index.

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

// Clip color to AABB (Playdead-style)
fn clipAABB(aabbMin: vec3<f32>, aabbMax: vec3<f32>, color: vec3<f32>) -> vec3<f32> {
  let center = (aabbMin + aabbMax) * 0.5;
  let extent = (aabbMax - aabbMin) * 0.5 + vec3<f32>(0.0001);
  let offset = color - center;
  let ts = abs(extent / (abs(offset) + vec3<f32>(0.0001)));
  let t = min(min(ts.x, ts.y), ts.z);
  if (t < 1.0) {
    return center + offset * t;
  }
  return color;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let pixelCoord = vec2<i32>(input.position.xy);
  let dims = textureDimensions(currentTex);

  // Current color
  let currentColor = textureLoad(currentTex, pixelCoord, 0).rgb;

  // Velocity
  let velocity = textureLoad(velocityTex, pixelCoord, 0).rg;

  // History UV (reprojected)
  let historyUV = input.uv - velocity;

  // Check if history UV is valid
  if (historyUV.x < 0.0 || historyUV.x > 1.0 || historyUV.y < 0.0 || historyUV.y > 1.0) {
    return vec4<f32>(currentColor, 1.0);
  }

  // Sample history (bilinear)
  let historyColor = textureSampleLevel(historyTex, linearSampler, historyUV, 0.0).rgb;

  // 3x3 neighborhood min/max for anti-ghosting
  var nMin = currentColor;
  var nMax = currentColor;

  for (var ox = -1i; ox <= 1i; ox++) {
    for (var oy = -1i; oy <= 1i; oy++) {
      let coord = clamp(pixelCoord + vec2<i32>(ox, oy), vec2<i32>(0), vec2<i32>(dims) - vec2<i32>(1));
      let s = textureLoad(currentTex, coord, 0).rgb;
      nMin = min(nMin, s);
      nMax = max(nMax, s);
    }
  }

  // Clip history to neighborhood AABB
  let clampedHistory = clipAABB(nMin, nMax, historyColor);

  // Blend
  let result = mix(currentColor, clampedHistory, uniforms.blendFactor);

  return vec4<f32>(result, 1.0);
}
`,yt=128,bt=16;function wt(i,e){let t=0,n=1/e,r=i;for(;r>0;)t+=n*(r%e),r=Math.floor(r/e),n/=e;return t}class zn{ctx;velocityTexture;velocityTextureView;historyA;historyAView;historyB;historyBView;resolveTarget;resolveTargetView;pingPong=0;velocityPipeline;resolvePipeline;velocityBGL;resolveBGL;velocityUniformBuffer;taaUniformBuffer;velocityF32=new Float32Array(yt/4);taaF32=new Float32Array(bt/4);linearSampler;velocityBindGroup=null;resolveBindGroupCache=null;depthView=null;hdrViews=null;shaderChecks=[];frameIndex=0;prevViewProj=se();constructor(e){this.ctx=e,this.createSampler(),this.createUniformBuffers(),this.createPipelines(),this.createTextures()}createSampler(){this.linearSampler=this.ctx.device.createSampler({magFilter:"linear",minFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"})}createUniformBuffers(){const e=this.ctx.device;this.velocityUniformBuffer=e.createBuffer({size:yt,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.taaUniformBuffer=e.createBuffer({size:bt,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})}createPipelines(){const e=this.ctx.device;this.velocityBGL=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"depth"}}]});const t=e.createShaderModule({code:kn});this.shaderChecks.push(Te("velocity",t)),this.velocityPipeline=e.createRenderPipeline({layout:e.createPipelineLayout({bindGroupLayouts:[this.velocityBGL]}),vertex:{module:t,entryPoint:"vs_main"},fragment:{module:t,entryPoint:"fs_main",targets:[{format:mt}]},primitive:{topology:"triangle-list"}}),this.resolveBGL=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:3,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:4,visibility:GPUShaderStage.FRAGMENT,sampler:{}}]});const n=e.createShaderModule({code:_n});this.shaderChecks.push(Te("taa_resolve",n)),this.resolvePipeline=e.createRenderPipeline({layout:e.createPipelineLayout({bindGroupLayouts:[this.resolveBGL]}),vertex:{module:n,entryPoint:"vs_main"},fragment:{module:n,entryPoint:"fs_main",targets:[{format:te}]},primitive:{topology:"triangle-list"}})}createTextures(){this.velocityTexture&&this.velocityTexture.destroy(),this.historyA&&this.historyA.destroy(),this.historyB&&this.historyB.destroy(),this.resolveTarget&&this.resolveTarget.destroy();const e=this.ctx.canvas.width,t=this.ctx.canvas.height;this.velocityTexture=this.ctx.device.createTexture({size:[e,t],format:mt,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING}),this.velocityTextureView=this.velocityTexture.createView(),this.historyA=this.ctx.device.createTexture({size:[e,t],format:te,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST}),this.historyAView=this.historyA.createView(),this.historyB=this.ctx.device.createTexture({size:[e,t],format:te,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST}),this.historyBView=this.historyB.createView(),this.resolveTarget=this.ctx.device.createTexture({size:[e,t],format:te,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_SRC}),this.resolveTargetView=this.resolveTarget.createView(),this.pingPong=0,this.frameIndex=0,this.velocityBindGroup=null,this.resolveBindGroupCache=null}getJitter(e,t){if(!T.data.rendering.taa.enabled)return[0,0];const n=this.frameIndex%16+1,r=wt(n,2)-.5,s=wt(n,3)-.5;return[r*2/e,s*2/t]}setResources(e,t,n){(this.depthView!==e||!this.hdrViews||this.hdrViews[0]!==t||this.hdrViews[1]!==n)&&(this.depthView=e,this.hdrViews=[t,n],this.velocityBindGroup=null,this.resolveBindGroupCache=null)}ensureBindGroups(){if(!(!this.depthView||!this.hdrViews)&&(this.velocityBindGroup||(this.velocityBindGroup=this.ctx.device.createBindGroup({layout:this.velocityBGL,entries:[{binding:0,resource:{buffer:this.velocityUniformBuffer}},{binding:1,resource:this.depthView}]})),!this.resolveBindGroupCache)){const e=(t,n)=>this.ctx.device.createBindGroup({layout:this.resolveBGL,entries:[{binding:0,resource:{buffer:this.taaUniformBuffer}},{binding:1,resource:n},{binding:2,resource:t},{binding:3,resource:this.velocityTextureView},{binding:4,resource:this.linearSampler}]});this.resolveBindGroupCache=[[e(this.historyBView,this.hdrViews[0]),e(this.historyBView,this.hdrViews[1])],[e(this.historyAView,this.hdrViews[0]),e(this.historyAView,this.hdrViews[1])]]}}updateUniforms(e){const t=se();ut(t,e);const n=this.velocityF32;n.set(t,0),n.set(this.prevViewProj,16),this.ctx.device.queue.writeBuffer(this.velocityUniformBuffer,0,n);const r=this.taaF32;r[0]=T.data.rendering.taa.blendFactor,r[1]=0,r[2]=0,r[3]=0,this.ctx.device.queue.writeBuffer(this.taaUniformBuffer,0,r)}renderVelocity(e){if(this.ensureBindGroups(),!this.velocityBindGroup)return;const t=e.beginRenderPass({colorAttachments:[{view:this.velocityTextureView,clearValue:{r:0,g:0,b:0,a:0},loadOp:"clear",storeOp:"store"}]});t.setPipeline(this.velocityPipeline),t.setBindGroup(0,this.velocityBindGroup),t.draw(3),t.end()}renderResolve(e,t){if(this.ensureBindGroups(),!this.resolveBindGroupCache)return;const n=this.resolveBindGroupCache[this.pingPong][t],r=e.beginRenderPass({colorAttachments:[{view:this.resolveTargetView,clearValue:{r:0,g:0,b:0,a:1},loadOp:"clear",storeOp:"store"}]});r.setPipeline(this.resolvePipeline),r.setBindGroup(0,n),r.draw(3),r.end()}copyResolvedToHDR(e,t){const n=this.ctx.canvas.width,r=this.ctx.canvas.height;e.copyTextureToTexture({texture:this.resolveTarget},{texture:t},[n,r]);const s=this.pingPong===0?this.historyA:this.historyB;e.copyTextureToTexture({texture:this.resolveTarget},{texture:s},[n,r])}swapHistory(){this.pingPong=1-this.pingPong,this.frameIndex=(this.frameIndex+1)%256}get velocityView(){return this.velocityTextureView}storePrevViewProj(e){Ae(this.prevViewProj,e)}resize(){this.createTextures()}}const Hn=`// 3D Cloud noise texture generator (compute shader)
// Generates multi-octave FBM based on Simplex noise into 3D textures.
// FBM is centered: snoise3d [0,1] → [-1,1] → sum → remap [0,1]
// This gives wider distribution (std ≈ 0.25) vs the uncentered version (std ≈ 0.05).

// 3D Simplex Noise (Ashima Arts / Stefan Gustavson)
// Permutation-free GPU implementation

fn mod289_3(x: vec3<f32>) -> vec3<f32> { return x - floor(x * (1.0 / 289.0)) * 289.0; }
fn mod289_4(x: vec4<f32>) -> vec4<f32> { return x - floor(x * (1.0 / 289.0)) * 289.0; }
fn permute4(x: vec4<f32>) -> vec4<f32> { return mod289_4(((x * 34.0) + 10.0) * x); }
fn taylorInvSqrt4(r: vec4<f32>) -> vec4<f32> { return 1.79284291400159 - 0.85373472095314 * r; }

fn snoise3d(v: vec3<f32>) -> f32 {
  let C = vec2<f32>(1.0 / 6.0, 1.0 / 3.0);
  let D = vec4<f32>(0.0, 0.5, 1.0, 2.0);

  // First corner
  var i = floor(v + dot(v, vec3<f32>(C.y)));
  let x0 = v - i + dot(i, vec3<f32>(C.x));

  // Other corners
  let g = step(x0.yzx, x0.xyz);
  let l = 1.0 - g;
  let i1 = min(g.xyz, l.zxy);
  let i2 = max(g.xyz, l.zxy);

  let x1 = x0 - i1 + C.x;
  let x2 = x0 - i2 + C.y;   // 2.0 * C.x = 1/3
  let x3 = x0 - D.yyy;       // -1.0 + 3.0 * C.x = -0.5

  // Permutations
  i = mod289_3(i);
  let p = permute4(permute4(permute4(
    i.z + vec4<f32>(0.0, i1.z, i2.z, 1.0))
  + i.y + vec4<f32>(0.0, i1.y, i2.y, 1.0))
  + i.x + vec4<f32>(0.0, i1.x, i2.x, 1.0));

  // Gradients: 7x7 points over a square, mapped onto an octahedron
  let n_ = 0.142857142857; // 1.0 / 7.0
  let ns = n_ * D.wyz - D.xzx;

  let j = p - 49.0 * floor(p * ns.z * ns.z);

  let x_ = floor(j * ns.z);
  let y_ = floor(j - 7.0 * x_);

  let x = x_ * ns.x + ns.y;
  let y = y_ * ns.x + ns.y;
  let h = 1.0 - abs(x) - abs(y);

  let b0 = vec4<f32>(x.xy, y.xy);
  let b1 = vec4<f32>(x.zw, y.zw);

  let s0 = floor(b0) * 2.0 + 1.0;
  let s1 = floor(b1) * 2.0 + 1.0;
  let sh = -step(h, vec4<f32>(0.0));

  let a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  let a1 = b1.xzyw + s1.xzyw * sh.zzww;

  var p0 = vec3<f32>(a0.xy, h.x);
  var p1 = vec3<f32>(a0.zw, h.y);
  var p2 = vec3<f32>(a1.xy, h.z);
  var p3 = vec3<f32>(a1.zw, h.w);

  // Normalise gradients
  let norm = taylorInvSqrt4(vec4<f32>(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  // Mix final noise value
  var m = max(vec4<f32>(0.6) - vec4<f32>(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), vec4<f32>(0.0));
  m = m * m;
  // Returns [-1, 1], remap to [0, 1]
  return 42.0 * dot(m * m, vec4<f32>(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3))) * 0.5 + 0.5;
}

@group(0) @binding(0) var outputTex: texture_storage_3d<rgba8unorm, write>;

struct Params {
  texSize: f32,
  baseFreq: f32,
  isDetail: f32,  // 0 = shape, 1 = detail
  pad: f32,
};
@group(0) @binding(1) var<uniform> params: Params;

fn fbm4(p: vec3<f32>, freq: f32) -> f32 {
  var value = 0.0;
  var amplitude = 0.5;
  var pos = p * freq;
  for (var i = 0u; i < 4u; i++) {
    let n = snoise3d(pos) * 2.0 - 1.0;
    value += n * amplitude;
    pos *= 2.0;
    amplitude *= 0.5;
  }
  return clamp(value * 0.5 + 0.5, 0.0, 1.0);
}

@compute @workgroup_size(4, 4, 4)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let size = u32(params.texSize);
  if (id.x >= size || id.y >= size || id.z >= size) {
    return;
  }

  let uvw = vec3<f32>(id) / params.texSize;
  let freq = params.baseFreq;

  var result: vec4<f32>;
  if (params.isDetail < 0.5) {
    // Shape noise (128^3): 4 channels at increasing frequencies
    result = vec4<f32>(
      fbm4(uvw, freq * 4.0),    // R: base shape
      fbm4(uvw, freq * 8.0),    // G: mid detail
      fbm4(uvw, freq * 16.0),   // B: fine detail
      fbm4(uvw, freq * 2.0),    // A: coverage modulation
    );
  } else {
    // Detail noise (32^3): high-frequency FBM
    result = vec4<f32>(
      fbm4(uvw, freq * 8.0),
      fbm4(uvw, freq * 16.0),
      fbm4(uvw, freq * 32.0),
      1.0,
    );
  }

  textureStore(outputTex, id, result);
}
`,ve=128,xe=32,Be=4;class Wn{ctx;pipeline;bindGroupLayout;paramsBuffer;shapeTexture;detailTexture;shapeView;detailView;shaderCheck;constructor(e){this.ctx=e;const t=e.device;this.bindGroupLayout=t.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,storageTexture:{access:"write-only",format:"rgba8unorm",viewDimension:"3d"}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}}]});const n=t.createShaderModule({code:Hn});this.shaderCheck=Te("cloud_noise_gen",n),this.pipeline=t.createComputePipeline({layout:t.createPipelineLayout({bindGroupLayouts:[this.bindGroupLayout]}),compute:{module:n,entryPoint:"main"}}),this.paramsBuffer=t.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.shapeTexture=t.createTexture({size:[ve,ve,ve],format:"rgba8unorm",dimension:"3d",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.STORAGE_BINDING}),this.shapeView=this.shapeTexture.createView(),this.detailTexture=t.createTexture({size:[xe,xe,xe],format:"rgba8unorm",dimension:"3d",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.STORAGE_BINDING}),this.detailView=this.detailTexture.createView()}async generate(){await this.shaderCheck;const e=this.ctx.device,t=e.createCommandEncoder();{const n=new Float32Array([ve,1,0,0]);e.queue.writeBuffer(this.paramsBuffer,0,n);const r=e.createBindGroup({layout:this.bindGroupLayout,entries:[{binding:0,resource:this.shapeView},{binding:1,resource:{buffer:this.paramsBuffer}}]}),s=t.beginComputePass();s.setPipeline(this.pipeline),s.setBindGroup(0,r),s.dispatchWorkgroups(ve/Be,ve/Be,ve/Be),s.end()}{const n=new Float32Array([xe,1,1,0]);e.queue.writeBuffer(this.paramsBuffer,0,n);const r=e.createBindGroup({layout:this.bindGroupLayout,entries:[{binding:0,resource:this.detailView},{binding:1,resource:{buffer:this.paramsBuffer}}]}),s=t.beginComputePass();s.setPipeline(this.pipeline),s.setBindGroup(0,r),s.dispatchWorkgroups(xe/Be,xe/Be,xe/Be),s.end()}e.queue.submit([t.finish()]),await e.queue.onSubmittedWorkDone(),console.log("[CloudNoise] Generated shape (128^3) + detail (32^3) textures")}}const Yn=`// Volumetric cloud ray-march shader (half-res fullscreen fragment)
// Perlin-Worley FBM: simplex for large shape, Worley for cumulus erosion.

// Shared mathematical and PBR constants
const PI: f32 = 3.14159265359;
const TWO_PI: f32 = 6.28318530718;
const INV_PI: f32 = 0.31830988618;
const F0_DIELECTRIC: f32 = 0.04;

// 3D Simplex Noise (Ashima Arts / Stefan Gustavson)
// Permutation-free GPU implementation

fn mod289_3(x: vec3<f32>) -> vec3<f32> { return x - floor(x * (1.0 / 289.0)) * 289.0; }
fn mod289_4(x: vec4<f32>) -> vec4<f32> { return x - floor(x * (1.0 / 289.0)) * 289.0; }
fn permute4(x: vec4<f32>) -> vec4<f32> { return mod289_4(((x * 34.0) + 10.0) * x); }
fn taylorInvSqrt4(r: vec4<f32>) -> vec4<f32> { return 1.79284291400159 - 0.85373472095314 * r; }

fn snoise3d(v: vec3<f32>) -> f32 {
  let C = vec2<f32>(1.0 / 6.0, 1.0 / 3.0);
  let D = vec4<f32>(0.0, 0.5, 1.0, 2.0);

  // First corner
  var i = floor(v + dot(v, vec3<f32>(C.y)));
  let x0 = v - i + dot(i, vec3<f32>(C.x));

  // Other corners
  let g = step(x0.yzx, x0.xyz);
  let l = 1.0 - g;
  let i1 = min(g.xyz, l.zxy);
  let i2 = max(g.xyz, l.zxy);

  let x1 = x0 - i1 + C.x;
  let x2 = x0 - i2 + C.y;   // 2.0 * C.x = 1/3
  let x3 = x0 - D.yyy;       // -1.0 + 3.0 * C.x = -0.5

  // Permutations
  i = mod289_3(i);
  let p = permute4(permute4(permute4(
    i.z + vec4<f32>(0.0, i1.z, i2.z, 1.0))
  + i.y + vec4<f32>(0.0, i1.y, i2.y, 1.0))
  + i.x + vec4<f32>(0.0, i1.x, i2.x, 1.0));

  // Gradients: 7x7 points over a square, mapped onto an octahedron
  let n_ = 0.142857142857; // 1.0 / 7.0
  let ns = n_ * D.wyz - D.xzx;

  let j = p - 49.0 * floor(p * ns.z * ns.z);

  let x_ = floor(j * ns.z);
  let y_ = floor(j - 7.0 * x_);

  let x = x_ * ns.x + ns.y;
  let y = y_ * ns.x + ns.y;
  let h = 1.0 - abs(x) - abs(y);

  let b0 = vec4<f32>(x.xy, y.xy);
  let b1 = vec4<f32>(x.zw, y.zw);

  let s0 = floor(b0) * 2.0 + 1.0;
  let s1 = floor(b1) * 2.0 + 1.0;
  let sh = -step(h, vec4<f32>(0.0));

  let a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  let a1 = b1.xzyw + s1.xzyw * sh.zzww;

  var p0 = vec3<f32>(a0.xy, h.x);
  var p1 = vec3<f32>(a0.zw, h.y);
  var p2 = vec3<f32>(a1.xy, h.z);
  var p3 = vec3<f32>(a1.zw, h.w);

  // Normalise gradients
  let norm = taylorInvSqrt4(vec4<f32>(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  // Mix final noise value
  var m = max(vec4<f32>(0.6) - vec4<f32>(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), vec4<f32>(0.0));
  m = m * m;
  // Returns [-1, 1], remap to [0, 1]
  return 42.0 * dot(m * m, vec4<f32>(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3))) * 0.5 + 0.5;
}

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
`,jn=`// Temporal reprojection for volumetric clouds (half-res fullscreen fragment)
// Blends current frame with reprojected history using neighborhood clamping.

struct TemporalUniforms {
  invViewProj: mat4x4<f32>,     // 0: current frame
  prevViewProj: mat4x4<f32>,    // 64: previous frame
  screenSize: vec4<f32>,        // 128: x=halfW, y=halfH, z=1/halfW, w=1/halfH
  pad: vec4<f32>,               // 144
};

@group(0) @binding(0) var<uniform> temporal: TemporalUniforms;
@group(0) @binding(1) var cloudRaw: texture_2d<f32>;
@group(0) @binding(2) var cloudHistory: texture_2d<f32>;
@group(0) @binding(3) var linearSampler: sampler;

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

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let current = textureSampleLevel(cloudRaw, linearSampler, input.uv, 0.0);

  // Reconstruct world position on far plane from current UV
  let ndc = vec4<f32>(
    input.uv.x * 2.0 - 1.0,
    -(input.uv.y * 2.0 - 1.0),
    1.0,
    1.0,
  );
  let worldH = temporal.invViewProj * ndc;
  let worldPos = worldH.xyz / worldH.w;

  // Reproject world position into previous frame's screen space
  let prevClip = temporal.prevViewProj * vec4<f32>(worldPos, 1.0);
  let prevNDC = prevClip.xy / prevClip.w;
  let prevUV = vec2<f32>(prevNDC.x * 0.5 + 0.5, 1.0 - (prevNDC.y * 0.5 + 0.5));

  // Out-of-bounds check — use current only
  if (prevUV.x < 0.0 || prevUV.x > 1.0 || prevUV.y < 0.0 || prevUV.y > 1.0) {
    return current;
  }

  // Sample history at reprojected UV
  var history = textureSampleLevel(cloudHistory, linearSampler, prevUV, 0.0);

  // Neighborhood clamping (3x3 AABB of current frame)
  let texelSize = temporal.screenSize.zw;
  var minColor = current;
  var maxColor = current;

  for (var dy = -1; dy <= 1; dy++) {
    for (var dx = -1; dx <= 1; dx++) {
      if (dx == 0 && dy == 0) { continue; }
      let offset = vec2<f32>(f32(dx), f32(dy)) * texelSize;
      let neighbor = textureSampleLevel(cloudRaw, linearSampler, input.uv + offset, 0.0);
      minColor = min(minColor, neighbor);
      maxColor = max(maxColor, neighbor);
    }
  }

  // Clamp history to neighborhood AABB
  history = clamp(history, minColor, maxColor);

  // Blend: 5% current, 95% history for temporal stability
  return mix(history, current, 0.05);
}
`,St=160,Pt=160;class Xn{ctx;cloudRaw;cloudRawView;cloudHistory;cloudHistoryViews;historyIndex=0;cloudUniformBuffer;temporalUniformBuffer;cloudF32=new Float32Array(St/4);temporalF32=new Float32Array(Pt/4);raymarchPipeline;temporalPipeline;raymarchBindGroupLayout;temporalBindGroupLayout;raymarchBindGroup=null;temporalBindGroups=null;bindGroupsDirty=!0;linearSampler;prevViewProj=se();hasPrevViewProj=!1;depthView=null;shaderChecks=[];constructor(e){this.ctx=e;const t=e.device;this.cloudUniformBuffer=t.createBuffer({size:St,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.temporalUniformBuffer=t.createBuffer({size:Pt,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.linearSampler=t.createSampler({magFilter:"linear",minFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"}),this.createTextures(),this.createRaymarchPipeline(t),this.createTemporalPipeline(t)}getHalfSize(){return[Math.max(1,Math.ceil(this.ctx.canvas.width/2)),Math.max(1,Math.ceil(this.ctx.canvas.height/2))]}createTextures(){const e=this.ctx.device,[t,n]=this.getHalfSize();this.cloudRaw=e.createTexture({size:[t,n],format:Ge,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING}),this.cloudRawView=this.cloudRaw.createView(),this.cloudHistory=[e.createTexture({size:[t,n],format:Ge,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING}),e.createTexture({size:[t,n],format:Ge,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING})],this.cloudHistoryViews=[this.cloudHistory[0].createView(),this.cloudHistory[1].createView()]}createRaymarchPipeline(e){this.raymarchBindGroupLayout=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"depth"}}]});const t=e.createShaderModule({code:Yn});this.shaderChecks.push(Te("cloud_raymarch",t)),this.raymarchPipeline=e.createRenderPipeline({layout:e.createPipelineLayout({bindGroupLayouts:[this.raymarchBindGroupLayout]}),vertex:{module:t,entryPoint:"vs_main"},fragment:{module:t,entryPoint:"fs_main",targets:[{format:Ge}]},primitive:{topology:"triangle-list"}})}createTemporalPipeline(e){this.temporalBindGroupLayout=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:3,visibility:GPUShaderStage.FRAGMENT,sampler:{}}]});const t=e.createShaderModule({code:jn});this.shaderChecks.push(Te("cloud_temporal",t)),this.temporalPipeline=e.createRenderPipeline({layout:e.createPipelineLayout({bindGroupLayouts:[this.temporalBindGroupLayout]}),vertex:{module:t,entryPoint:"vs_main"},fragment:{module:t,entryPoint:"fs_main",targets:[{format:Ge}]},primitive:{topology:"triangle-list"}})}ensureBindGroups(){if(!this.bindGroupsDirty||!this.depthView)return;this.bindGroupsDirty=!1;const e=this.ctx.device;this.raymarchBindGroup=e.createBindGroup({layout:this.raymarchBindGroupLayout,entries:[{binding:0,resource:{buffer:this.cloudUniformBuffer}},{binding:1,resource:this.depthView}]}),this.temporalBindGroups=[e.createBindGroup({layout:this.temporalBindGroupLayout,entries:[{binding:0,resource:{buffer:this.temporalUniformBuffer}},{binding:1,resource:this.cloudRawView},{binding:2,resource:this.cloudHistoryViews[1]},{binding:3,resource:this.linearSampler}]}),e.createBindGroup({layout:this.temporalBindGroupLayout,entries:[{binding:0,resource:{buffer:this.temporalUniformBuffer}},{binding:1,resource:this.cloudRawView},{binding:2,resource:this.cloudHistoryViews[0]},{binding:3,resource:this.linearSampler}]})]}setDepthView(e){this.depthView=e,this.bindGroupsDirty=!0}get resolvedCloudView(){return this.cloudHistoryViews[1-this.historyIndex]}get resolvedHistoryIndex(){return 1-this.historyIndex}get historyViews(){return this.cloudHistoryViews}updateUniforms(e,t,n,r,s,o,l,a,c,u,d,f,h,m,v){const g=this.cloudF32;g.set(e,0),g[16]=t[0],g[17]=t[1],g[18]=t[2],g[19]=l,g[20]=n[0],g[21]=n[1],g[22]=n[2],g[23]=r,g[24]=s[0],g[25]=s[1],g[26]=s[2],g[27]=o,g[28]=a,g[29]=c,g[30]=u,g[31]=d,g[32]=f,g[33]=h,g[34]=m,g[35]=v,g[36]=.7,g[37]=.3,g[38]=.8,g[39]=-.3,this.ctx.device.queue.writeBuffer(this.cloudUniformBuffer,0,g)}updateTemporalUniforms(e){const[t,n]=this.getHalfSize(),r=this.temporalF32;r.set(e,0),r.set(this.prevViewProj,16),r[32]=t,r[33]=n,r[34]=1/t,r[35]=1/n,r[36]=0,r[37]=0,r[38]=0,r[39]=0,this.ctx.device.queue.writeBuffer(this.temporalUniformBuffer,0,r)}storePrevViewProj(e){Ae(this.prevViewProj,e),this.hasPrevViewProj=!0}render(e){if(this.ensureBindGroups(),!(!this.raymarchBindGroup||!this.temporalBindGroups)){{const t=e.beginRenderPass({colorAttachments:[{view:this.cloudRawView,clearValue:{r:0,g:0,b:0,a:1},loadOp:"clear",storeOp:"store"}]});t.setPipeline(this.raymarchPipeline),t.setBindGroup(0,this.raymarchBindGroup),t.draw(3),t.end()}{const t=this.historyIndex,n=e.beginRenderPass({colorAttachments:[{view:this.cloudHistoryViews[t],loadOp:"clear",clearValue:{r:0,g:0,b:0,a:1},storeOp:"store"}]});n.setPipeline(this.temporalPipeline),n.setBindGroup(0,this.temporalBindGroups[t]),n.draw(3),n.end()}this.historyIndex=1-this.historyIndex}}resize(){this.cloudRaw.destroy(),this.cloudHistory[0].destroy(),this.cloudHistory[1].destroy(),this.createTextures(),this.bindGroupsDirty=!0,this.hasPrevViewProj=!1}invalidateBindGroups(){this.bindGroupsDirty=!0}}const qn=`struct Camera {
  viewProj: mat4x4<f32>,
  cameraPos: vec4<f32>,
  fogParams: vec4<f32>,
  time: vec4<f32>,
};

@group(0) @binding(0) var<uniform> camera: Camera;

struct VertexInput {
  @location(0) position: vec3<f32>,
  @location(1) normalIndex: u32,
  @location(2) texCoord: vec2<f32>,
  @location(3) ao: f32,
};

struct VertexOutput {
  @builtin(position) clipPos: vec4<f32>,
  @location(0) worldPos: vec3<f32>,
  @location(1) texCoord: vec2<f32>,
  @location(2) @interpolate(flat) normalIndex: u32,
  @location(3) ao: f32,
};

@vertex
fn main(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;

  let faceIdx = input.normalIndex & 0xFFu;
  let blockType = input.normalIndex >> 8u;

  var worldPos = input.position;

  // Leaves wind animation (BlockType.LEAVES = 51)
  if (blockType == 51u) {
    let windTime = camera.time.x % 628.318; // wrap to avoid sin() precision loss
    let windStrength = 0.03;
    let freq1 = worldPos.x * 0.8 + worldPos.z * 0.4 + windTime * 1.2;
    let freq2 = worldPos.x * 0.5 + worldPos.z * 0.7 + windTime * 0.9;
    worldPos.x += sin(freq1) * windStrength;
    worldPos.z += cos(freq2) * windStrength * 0.7;
    worldPos.y += sin(freq1 + freq2) * windStrength * 0.2;
  }

  // Vegetation wind animation (TALL_GRASS=80, POPPY=81, DANDELION=82)
  if (blockType >= 80u && blockType <= 82u) {
    let windTime = camera.time.x % 628.318; // wrap to avoid sin() precision loss
    // Use original Y for height factor (stable, pre-wind)
    let heightFactor = fract(input.position.y); // ~0.01 at bottom, ~0.99 at top
    let windStrength = 0.12 * heightFactor;
    let freq1 = input.position.x * 1.8 + input.position.z * 0.9 + windTime * 3.0;
    let freq2 = input.position.x * 0.6 + input.position.z * 1.6 + windTime * 2.2;
    worldPos.x += sin(freq1) * windStrength;
    worldPos.z += cos(freq2) * windStrength * 0.8;
  }

  // Torch flame flicker animation (BlockType.TORCH = 93)
  if (blockType == 93u) {
    let windTime = camera.time.x % 628.318;
    let heightFactor = fract(input.position.y); // ~0.01 at bottom, ~0.99 at top
    let flickerStrength = 0.04 * heightFactor;
    let freq1 = input.position.x * 5.0 + input.position.z * 3.0 + windTime * 8.0;
    let freq2 = input.position.x * 4.0 + input.position.z * 5.5 + windTime * 6.5;
    worldPos.x += sin(freq1) * flickerStrength;
    worldPos.z += cos(freq2) * flickerStrength * 0.6;
  }

  output.clipPos = camera.viewProj * vec4<f32>(worldPos, 1.0);
  output.worldPos = worldPos;
  output.texCoord = input.texCoord;
  output.normalIndex = input.normalIndex;
  output.ao = input.ao;
  return output;
}
`,Zn=`struct GBufferOutput {
  @location(0) albedo: vec4<f32>,    // RGB=albedo, A=emissive
  @location(1) normal: vec4<f32>,    // RGB=world normal (signed)
  @location(2) material: vec4<f32>,  // R=roughness, G=metallic, B=AO(1.0 default)
};

@group(1) @binding(0) var atlasSampler: sampler;
@group(1) @binding(1) var atlasTexture: texture_2d<f32>;
@group(1) @binding(2) var materialAtlas: texture_2d<f32>;
@group(1) @binding(3) var normalAtlas: texture_2d<f32>;

// Alpha cutout for leaves (51), vegetation (80-82), and torches (93).
// Atlas alpha is baked at texture generation time for stable, flicker-free results.
// Requires: atlasSampler, atlasTexture bindings declared before inclusion.

fn applyCutout(blockType: u32, texCoord: vec2<f32>) {
  if (blockType == 51u || (blockType >= 80u && blockType <= 82u) || blockType == 93u) {
    let cutoutAlpha = textureSampleLevel(atlasTexture, atlasSampler, texCoord, 0.0).a;
    if (cutoutAlpha < 0.5) { discard; }
  }
}

// Face normals: TOP, BOTTOM, NORTH(+Z), SOUTH(-Z), EAST(+X), WEST(-X)
const FACE_NORMALS = array<vec3<f32>, 6>(
  vec3<f32>(0.0, 1.0, 0.0),
  vec3<f32>(0.0, -1.0, 0.0),
  vec3<f32>(0.0, 0.0, 1.0),
  vec3<f32>(0.0, 0.0, -1.0),
  vec3<f32>(1.0, 0.0, 0.0),
  vec3<f32>(-1.0, 0.0, 0.0),
);

// Build TBN matrix from face index
fn buildTBN(faceIdx: u32) -> mat3x3<f32> {
  var N: vec3<f32>;
  var T: vec3<f32>;
  var B: vec3<f32>;

  switch(faceIdx) {
    case 0u: { N = vec3f(0,1,0); T = vec3f(1,0,0); B = vec3f(0,0,1); }   // TOP
    case 1u: { N = vec3f(0,-1,0); T = vec3f(1,0,0); B = vec3f(0,0,-1); }  // BOTTOM
    case 2u: { N = vec3f(0,0,1); T = vec3f(-1,0,0); B = vec3f(0,1,0); }   // NORTH (+Z)
    case 3u: { N = vec3f(0,0,-1); T = vec3f(1,0,0); B = vec3f(0,1,0); }   // SOUTH (-Z)
    case 4u: { N = vec3f(1,0,0); T = vec3f(0,0,1); B = vec3f(0,1,0); }    // EAST (+X)
    case 5u: { N = vec3f(-1,0,0); T = vec3f(0,0,-1); B = vec3f(0,1,0); }  // WEST (-X)
    default: { N = vec3f(0,1,0); T = vec3f(1,0,0); B = vec3f(0,0,1); }
  }
  return mat3x3<f32>(T, B, N);
}

// Atlas constants
const ATLAS_TILES: f32 = 16.0;
const TILE_UV_SIZE: f32 = 1.0 / 16.0;
const HALF_TEXEL: f32 = 0.5 / 256.0;  // half texel for 256px atlas

// Convert tiled UV [0..W]x[0..H] to atlas UV for a given blockType.
// For cutout blocks (leaves/veg), texCoord is already in atlas space.
fn tiledUVtoAtlas(texCoord: vec2<f32>, blockType: u32) -> vec2<f32> {
  let tileX = f32(blockType % u32(ATLAS_TILES));
  let tileY = f32(blockType / u32(ATLAS_TILES));
  let tileBase = vec2<f32>(tileX * TILE_UV_SIZE, tileY * TILE_UV_SIZE);

  // fract() gives the position within each tile [0..1]
  let localUV = fract(texCoord);

  // Apply half-texel inset to prevent tile bleeding at boundaries
  let insetUV = clamp(localUV, vec2<f32>(HALF_TEXEL), vec2<f32>(1.0 - HALF_TEXEL));

  return tileBase + insetUV * TILE_UV_SIZE;
}

struct VertexOutput {
  @builtin(position) clipPos: vec4<f32>,
  @location(0) worldPos: vec3<f32>,
  @location(1) texCoord: vec2<f32>,
  @location(2) @interpolate(flat) normalIndex: u32,
  @location(3) ao: f32,
};

@fragment
fn main(input: VertexOutput, @builtin(front_facing) frontFacing: bool) -> GBufferOutput {
  var output: GBufferOutput;

  // Extract face index and block type from packed normalIndex
  let faceIdx = input.normalIndex & 0xFFu;
  let blockType = input.normalIndex >> 8u;

  // Determine if this is a cutout block (uses direct atlas UV, not tiled)
  let isCutout = (blockType == 51u) || (blockType >= 80u && blockType <= 82u) || (blockType == 93u);

  // Compute atlas UV: cutout blocks use texCoord directly, others use tiled conversion
  var atlasUV: vec2<f32>;
  if (isCutout) {
    atlasUV = input.texCoord;
  } else {
    atlasUV = tiledUVtoAtlas(input.texCoord, blockType);
  }

  // Alpha cutout: leaves (51) and vegetation (80-82) use atlas texture alpha.
  applyCutout(blockType, atlasUV);

  let albedo = textureSampleLevel(atlasTexture, atlasSampler, atlasUV, 0.0);
  let mat = textureSampleLevel(materialAtlas, atlasSampler, atlasUV, 0.0);
  let normalSample = textureSampleLevel(normalAtlas, atlasSampler, atlasUV, 0.0).rgb;

  let idx = min(faceIdx, 5u);

  var worldNormal: vec3<f32>;
  if ((blockType >= 80u && blockType <= 82u) || blockType == 93u) {
    // Vegetation/Torch: use face normal from geometry, oriented toward camera
    worldNormal = FACE_NORMALS[idx];
    if (!frontFacing) { worldNormal = -worldNormal; }
  } else {
    // Solid blocks: transform tangent-space normal via TBN
    let tangentNormal = normalSample * 2.0 - 1.0;
    let tbn = buildTBN(idx);
    worldNormal = normalize(tbn * tangentNormal);
  }

  output.albedo = vec4<f32>(albedo.rgb, mat.b);  // A = emissive
  output.normal = vec4<f32>(worldNormal * 0.5 + 0.5, 1.0);
  output.material = vec4<f32>(mat.r, mat.g, input.ao, 1.0);  // B=vertex AO

  return output;
}
`,Kn=`// ======================== Deferred PBR Lighting ========================
// Cook-Torrance BRDF with shadow mapping, SSAO, and day-night cycle

// Shared SceneUniforms struct — included by sky.wgsl, lighting.wgsl, etc.
// Total size: 256 bytes (16-byte aligned)

struct SceneUniforms {
  invViewProj: mat4x4<f32>,          // 64  bytes (offset 0)
  cameraPos: vec4<f32>,              // 16  bytes (offset 64)  — xyz=position, w=waterLevel
  lightDir: vec4<f32>,               // 16  bytes (offset 80)  — xyz=sun(day)/moon(night), w=elapsedTime
  sunColor: vec4<f32>,               // 16  bytes (offset 96)  — rgb=color, w=intensity
  ambientColor: vec4<f32>,           // 16  bytes (offset 112) — rgb=ambient, w=groundFactor
  fogParams: vec4<f32>,              // 16  bytes (offset 128) — x=start, y=end, z=skyPackedParams, w=cloudCoverage
  cloudParams: vec4<f32>,            // 16  bytes (offset 144) — x=baseNoiseScale, y=extinction, z=multiScatterFloor, w=detailStrength
  viewProj: mat4x4<f32>,            // 64  bytes (offset 160) — unjittered viewProj for contact shadow / velocity
  contactShadowParams: vec4<f32>,    // 16  bytes (offset 224) — x=enabled, y=maxSteps, z=rayLength, w=thickness
  skyNightParams: vec4<f32>,         // 16  bytes (offset 240) — x=moonPhase, y=moonBrightness, z=elapsedTime, w=trueSunHeight
};

struct ShadowUniforms {
  lightViewProj: array<mat4x4<f32>, 3>,  // 192
  cascadeSplits: vec4<f32>,               // 16 (x,y,z = split distances)
};

@group(0) @binding(0) var<uniform> scene: SceneUniforms;

// G-Buffer textures
@group(1) @binding(0) var gAlbedo: texture_2d<f32>;
@group(1) @binding(1) var gNormal: texture_2d<f32>;
@group(1) @binding(2) var gMaterial: texture_2d<f32>;
@group(1) @binding(3) var gDepth: texture_depth_2d;

// Shadow + SSAO
@group(2) @binding(0) var<uniform> shadow: ShadowUniforms;
@group(2) @binding(1) var shadowMap: texture_depth_2d_array;
@group(2) @binding(2) var shadowSampler: sampler_comparison;
@group(2) @binding(3) var ssaoTexture: texture_2d<f32>;
@group(2) @binding(4) var linearSampler: sampler;

// Point Lights
struct PointLight {
  position: vec3f,
  radius: f32,
  color: vec3f,
  intensity: f32,
};

struct PointLightBuffer {
  count: u32,
  _pad0: u32,
  _pad1: u32,
  _pad2: u32,
  lights: array<PointLight, 128>,
};

@group(3) @binding(0) var<storage, read> pointLights: PointLightBuffer;

// ====================== Constants ======================
// Shared mathematical and PBR constants
const PI: f32 = 3.14159265359;
const TWO_PI: f32 = 6.28318530718;
const INV_PI: f32 = 0.31830988618;
const F0_DIELECTRIC: f32 = 0.04;

const SHADOW_LIGHT_SIZE: f32 = 3.0;

// ====================== Atmospheric Scattering (Fog) ======================
// Atmospheric scattering phase functions
// Requires: PI (from common/constants.wgsl)

fn rayleighPhase(cosTheta: f32) -> f32 {
  return 3.0 / (16.0 * PI) * (1.0 + cosTheta * cosTheta);
}

fn hgPhase(cosTheta: f32, g: f32) -> f32 {
  let g2 = g * g;
  let num = 1.0 - g2;
  let base = max(1.0 + g2 - 2.0 * g * cosTheta, 0.0);
  let denom = max(4.0 * PI * pow(base, 1.5), 0.0001);
  return num / denom;
}

fn atmosphericFogColor(viewDir: vec3f, sunDir: vec3f) -> vec3f {
  let cosTheta = dot(normalize(viewDir), sunDir);
  // trueSunHeight: CPU-computed, immune to day/night lightDir switching
  let trueSunHeight = scene.skyNightParams.w;
  // Rayleigh (blue sky)
  let rayleigh = rayleighPhase(cosTheta);
  let rayleighColor = vec3f(0.3, 0.55, 0.95) * rayleigh;
  // Mie (warm forward scatter)
  let mie = hgPhase(cosTheta, 0.76);
  let mieColor = vec3f(1.0, 0.95, 0.85) * mie * 0.02;
  // Horizon base + scattering
  var fogColor = vec3f(0.60, 0.75, 0.92) + rayleighColor * 0.8 + mieColor;
  // Sunset warming
  let sunsetFactor = 1.0 - clamp(abs(trueSunHeight) * 3.0, 0.0, 1.0);
  fogColor += vec3f(1.2, 0.5, 0.15) * sunsetFactor * max(cosTheta, 0.0) * 0.5;
  // Night darkening
  let dayFactor = smoothstep(-0.15, 0.1, trueSunHeight);
  fogColor *= dayFactor;
  // Night fog: ambient base + moonlight Mie forward scattering
  let nightFogColor = scene.ambientColor.rgb * 0.3;
  let moonMie = hgPhase(cosTheta, 0.76) * 0.03;
  let nightMoonFog = vec3f(0.15, 0.18, 0.30) * moonMie * scene.skyNightParams.y;
  fogColor += (nightFogColor + nightMoonFog) * (1.0 - dayFactor);
  return fogColor;
}

// ====================== Fullscreen Vertex ======================
// Fullscreen triangle vertex shader
// Generates a single triangle that covers the entire screen using vertex_index.

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

// ====================== World position reconstruction ======================
// Reconstruct world position from screen UV + depth + inverse view-projection matrix.

fn reconstructWorldPos(uv: vec2<f32>, depth: f32, invViewProj: mat4x4<f32>) -> vec3<f32> {
  let ndc = vec4<f32>(uv * 2.0 - 1.0, depth, 1.0);
  let ndcFlipped = vec4<f32>(ndc.x, -ndc.y, ndc.z, 1.0);
  let worldH = invViewProj * ndcFlipped;
  return worldH.xyz / worldH.w;
}

// ====================== PBR Functions ======================

// GGX/Trowbridge-Reitz Normal Distribution
fn distributionGGX(NdotH: f32, roughness: f32) -> f32 {
  let a = roughness * roughness;
  let a2 = a * a;
  let denom = NdotH * NdotH * (a2 - 1.0) + 1.0;
  return a2 / (PI * denom * denom);
}

// Smith-Schlick Geometry Function
fn geometrySmithSchlick(NdotV: f32, NdotL: f32, roughness: f32) -> f32 {
  let r = roughness + 1.0;
  let k = (r * r) / 8.0;
  let ggx1 = NdotV / (NdotV * (1.0 - k) + k);
  let ggx2 = NdotL / (NdotL * (1.0 - k) + k);
  return ggx1 * ggx2;
}

// Schlick Fresnel Approximation
fn fresnelSchlick(cosTheta: f32, F0: vec3<f32>) -> vec3<f32> {
  return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

// ====================== Shadow Sampling ======================
fn sampleShadow(worldPos: vec3<f32>, viewDist: f32) -> f32 {
  let splits = shadow.cascadeSplits;

  var cascadeIdx = 0u;
  if (viewDist > splits.y) {
    cascadeIdx = 2u;
  } else if (viewDist > splits.x) {
    cascadeIdx = 1u;
  }

  let lightSpacePos = shadow.lightViewProj[cascadeIdx] * vec4<f32>(worldPos, 1.0);
  let projCoords = lightSpacePos.xyz / lightSpacePos.w;
  let shadowUV = vec2<f32>(projCoords.x * 0.5 + 0.5, 1.0 - (projCoords.y * 0.5 + 0.5));

  if (shadowUV.x < 0.0 || shadowUV.x > 1.0 || shadowUV.y < 0.0 || shadowUV.y > 1.0) {
    return 1.0;
  }

  let currentDepth = projCoords.z;
  if (currentDepth > 1.0 || currentDepth < 0.0) {
    return 1.0;
  }

  // PCSS (Percentage Closer Soft Shadows)
  let texelSize = 1.0 / 2048.0;
  let lightSize = SHADOW_LIGHT_SIZE;
  let bias = 0.002;

  // Poisson disk samples (16 points)
  let poissonDisk = array<vec2f, 16>(
    vec2f(-0.94201624, -0.39906216), vec2f(0.94558609, -0.76890725),
    vec2f(-0.09418410, -0.92938870), vec2f(0.34495938, 0.29387760),
    vec2f(-0.91588581, 0.45771432), vec2f(-0.81544232, -0.87912464),
    vec2f(-0.38277543, 0.27676845), vec2f(0.97484398, 0.75648379),
    vec2f(0.44323325, -0.97511554), vec2f(0.53742981, -0.47373420),
    vec2f(-0.26496911, -0.41893023), vec2f(0.79197514, 0.19090188),
    vec2f(-0.24188840, 0.99706507), vec2f(-0.81409955, 0.91437590),
    vec2f(0.19984126, 0.78641367), vec2f(0.14383161, -0.14100790)
  );

  // Step 1: Blocker search — estimate average blocker ratio
  let searchRadius = lightSize * texelSize;
  var blockerCount = 0.0;
  for (var i = 0; i < 16; i++) {
    let sampleUV = shadowUV + poissonDisk[i] * searchRadius;
    let lit = textureSampleCompareLevel(
      shadowMap, shadowSampler, sampleUV, i32(cascadeIdx), currentDepth - bias
    );
    if (lit < 0.5) {
      blockerCount += 1.0;
    }
  }

  // No blockers — fully lit
  if (blockerCount < 0.5) { return 1.0; }

  // Step 2: Penumbra estimation — more blockers = wider penumbra
  let blockerRatio = blockerCount / 16.0;
  let penumbraWidth = lightSize * blockerRatio;

  // Step 3: Variable-size PCF filtering with Poisson disk
  let filterRadius = max(penumbraWidth * texelSize, texelSize);
  var shadowFactor = 0.0;
  for (var i = 0; i < 16; i++) {
    let sampleUV = shadowUV + poissonDisk[i] * filterRadius;
    shadowFactor += textureSampleCompareLevel(
      shadowMap, shadowSampler, sampleUV, i32(cascadeIdx), currentDepth - bias
    );
  }
  return shadowFactor / 16.0;
}

// ====================== Contact Shadow ======================
fn contactShadow(worldPos: vec3f, sunDir: vec3f) -> f32 {
  let enabled = scene.contactShadowParams.x;
  if (enabled < 0.5) {
    return 1.0;
  }

  let maxSteps = i32(scene.contactShadowParams.y);
  let rayLength = scene.contactShadowParams.z;
  let thickness = scene.contactShadowParams.w;
  let dims = textureDimensions(gDepth);

  // March along sunDir in world space, project each sample to screen
  let stepSize = rayLength / f32(maxSteps);

  for (var i = 1; i <= maxSteps; i++) {
    let samplePos = worldPos + sunDir * stepSize * f32(i);

    // Project to clip space using unjittered viewProj
    let clipPos = scene.viewProj * vec4f(samplePos, 1.0);
    let ndc = clipPos.xyz / clipPos.w;

    // NDC to UV (flip Y for WebGPU)
    let uv = vec2f(ndc.x * 0.5 + 0.5, 0.5 - ndc.y * 0.5);

    // Skip if outside screen
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
      continue;
    }

    let texCoord = vec2i(vec2f(f32(dims.x), f32(dims.y)) * uv);
    let sceneDepth = textureLoad(gDepth, texCoord, 0);

    // Compare: ray depth vs scene depth
    let rayDepth = ndc.z;
    let depthDiff = rayDepth - sceneDepth;

    // Occluded if ray is behind surface within thickness
    if (depthDiff > 0.0 && depthDiff < thickness) {
      // Fade based on march distance
      let t = f32(i) / f32(maxSteps);
      return mix(0.3, 1.0, t * t);
    }
  }

  return 1.0;
}

// ====================== Water Caustics ======================
fn waterCaustics(worldPos: vec3f, time: f32, underwaterDepth: f32) -> f32 {
  // Eclipse-style: project underwater position to water surface along sun direction
  let sunDir = normalize(scene.lightDir.xyz);
  let waterLevel = scene.cameraPos.w;
  let projectedPos = worldPos.xz + sunDir.xz / max(abs(sunDir.y), 0.01) * underwaterDepth;

  // Domain warping for organic patterns
  let rawP = projectedPos;
  let warpedP = rawP + vec2f(
    sin(rawP.y * 0.3 + time * 0.2),
    cos(rawP.x * 0.3 + time * 0.15)
  ) * 0.5;

  // Depth-dependent frequency: shallow = sharper/finer, deep = softer/larger
  let freqScale = mix(1.5, 0.5, smoothstep(0.0, 5.0, underwaterDepth));
  let p = warpedP * freqScale;

  // Octave 1: large slow waves
  var wave1 = 0.0;
  wave1 += sin(dot(p, vec2f(0.8, 0.6)) * 0.4 + time * 0.6);
  wave1 += sin(dot(p, vec2f(-0.5, 0.9)) * 0.5 + time * 0.45);
  wave1 += sin(dot(p, vec2f(0.9, -0.4)) * 0.35 + time * 0.55);
  let c1 = pow(1.0 - abs(sin(wave1 * 1.2)), 2.0);

  // Octave 2: medium fast detail
  var wave2 = 0.0;
  wave2 += sin(dot(p, vec2f(1.2, -0.8)) * 0.9 + time * 1.1);
  wave2 += sin(dot(p, vec2f(-0.7, 1.3)) * 1.1 + time * 0.9);
  wave2 += sin(dot(p, vec2f(0.6, 1.1)) * 0.8 + time * 1.3);
  let c2 = pow(1.0 - abs(sin(wave2 * 1.5)), 2.0);

  // Octave 3: fine high-frequency detail
  var wave3 = 0.0;
  wave3 += sin(dot(p, vec2f(1.8, -1.2)) * 1.6 + time * 1.8);
  wave3 += sin(dot(p, vec2f(-1.1, 1.7)) * 1.9 + time * 1.5);
  wave3 += sin(dot(p, vec2f(1.4, 1.5)) * 1.4 + time * 2.0);
  let c3 = pow(1.0 - abs(sin(wave3 * 1.8)), 2.0);

  // Weighted combination with minimum brightness floor
  let combined = c1 * 0.5 + c2 * 0.35 + c3 * 0.15;

  // Temporal shimmer
  let shimmer = 0.9 + 0.1 * sin(time * 3.0 + rawP.x * 0.5);

  // Minimum brightness floor so dark areas aren't completely black
  return max(combined * shimmer, 0.05);
}

// ====================== Fragment Shader ======================
@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let pixelCoord = vec2<i32>(input.position.xy);
  let dims = textureDimensions(gAlbedo);

  // Sample G-Buffer
  let albedoSample = textureLoad(gAlbedo, pixelCoord, 0);
  let normalSample = textureLoad(gNormal, pixelCoord, 0);
  let materialSample = textureLoad(gMaterial, pixelCoord, 0);
  let depth = textureLoad(gDepth, pixelCoord, 0);

  // Early sky detection (nothing written to G-Buffer)
  if (depth >= 1.0) {
    discard;
  }

  // sRGB → linear approximation (slightly lifted for voxel aesthetic)
  let albedo = pow(albedoSample.rgb, vec3<f32>(2.2));
  let emissive = albedoSample.a;
  let normal = normalize(normalSample.rgb * 2.0 - 1.0);
  let roughness = materialSample.r;
  let metallic = materialSample.g;

  // Sample SSAO
  let uv = input.uv;
  let ao = textureSampleLevel(ssaoTexture, linearSampler, uv, 0.0).r;

  // Reconstruct world position
  let worldPos = reconstructWorldPos(uv, depth, scene.invViewProj);
  let V = normalize(scene.cameraPos.xyz - worldPos);
  let N = normal;
  let L = normalize(scene.lightDir.xyz);
  let H = normalize(V + L);

  let NdotL = max(dot(N, L), 0.0);
  let NdotV = max(dot(N, V), 0.001);
  let NdotH = max(dot(N, H), 0.0);
  let HdotV = max(dot(H, V), 0.0);

  // Metallic workflow: F0
  let F0 = mix(vec3<f32>(F0_DIELECTRIC), albedo, metallic);

  // Cook-Torrance Specular BRDF
  let D = distributionGGX(NdotH, roughness);
  let G = geometrySmithSchlick(NdotV, NdotL, roughness);
  let F = fresnelSchlick(HdotV, F0);

  let numerator = D * G * F;
  let denominator = 4.0 * NdotV * NdotL + 0.0001;
  let specular = numerator / denominator;

  // Energy-conserving diffuse
  let kD = (vec3<f32>(1.0) - F) * (1.0 - metallic);
  let diffuse = kD * albedo / PI;

  // Shadow
  let viewDist = distance(scene.cameraPos.xyz, worldPos);
  let shadowFactor = sampleShadow(worldPos, viewDist);

  // Contact shadow
  let contactFactor = contactShadow(worldPos, L);

  // Direct lighting
  let sunColor = scene.sunColor.rgb * scene.sunColor.w;
  let directLight = (diffuse + specular) * sunColor * NdotL * shadowFactor * contactFactor;

  // Hemisphere ambient
  let skyAmbient = scene.ambientColor.rgb;
  let groundAmbient = skyAmbient * scene.ambientColor.w;
  let ambientBlend = dot(N, vec3<f32>(0.0, 1.0, 0.0)) * 0.5 + 0.5;
  let ambient = mix(groundAmbient, skyAmbient, ambientBlend) * albedo * ao;

  // Emissive
  let emissiveColor = albedo * emissive * 5.0;

  // Point Lights
  var pointLightContrib = vec3<f32>(0.0, 0.0, 0.0);
  let lightCount = min(pointLights.count, 128u);
  for (var i = 0u; i < lightCount; i++) {
    let light = pointLights.lights[i];
    let lightVec = light.position - worldPos;
    let dist = length(lightVec);
    if (dist > light.radius) { continue; }

    let L_p = normalize(lightVec);
    let falloff = dist / light.radius;
    let attenuation = (1.0 - falloff * falloff) * (1.0 - falloff * falloff) / (1.0 + dist * dist * 0.15);
    let NdotL_p = max(dot(N, L_p), 0.0);

    // Diffuse contribution
    let pointDiffuse = albedo * light.color * light.intensity * NdotL_p * attenuation;

    // Simple specular (Blinn-Phong for point lights to keep cost low)
    let H_p = normalize(V + L_p);
    let NdotH_p = max(dot(N, H_p), 0.0);
    let specPower = mix(8.0, 64.0, 1.0 - roughness);
    let pointSpecular = light.color * light.intensity * pow(NdotH_p, specPower) * attenuation * (1.0 - roughness) * 0.3;

    pointLightContrib += pointDiffuse + pointSpecular;
  }

  var finalColor = directLight + ambient + emissiveColor + pointLightContrib;

  // Water caustics (underwater surfaces only)
  let waterLevel = scene.cameraPos.w;
  let waterTime = scene.lightDir.w;
  if (worldPos.y < waterLevel) {
    let underwaterDepth = waterLevel - worldPos.y;
    let shoreFade = smoothstep(0.0, 0.5, underwaterDepth);
    let depthAtten = exp(-underwaterDepth * 0.15) * shoreFade;
    let normalUp = max(dot(N, vec3f(0.0, 1.0, 0.0)), 0.0);
    let causticPattern = waterCaustics(worldPos, waterTime, underwaterDepth);
    // Sun angle influence: stronger when sun is high, weaker at sunset/night
    let sunHeightFactor = smoothstep(-0.1, 0.5, L.y);
    let causticLight = sunColor * causticPattern * depthAtten * normalUp * shadowFactor * sunHeightFactor * 0.35;
    finalColor += causticLight;
  }

  // Fog: smooth blend between atmospheric and underwater (0.3-unit transition zone)
  let camDepthBelow = scene.cameraPos.w - scene.cameraPos.y;
  let uwBlend = smoothstep(-0.3, 0.3, camDepthBelow);

  // Atmospheric scattering fog (always computed)
  let fogStart = scene.fogParams.x;
  let fogEnd = scene.fogParams.y;
  let fogFactor = clamp((viewDist - fogStart) / (fogEnd - fogStart), 0.0, 1.0);
  let viewDir = worldPos - scene.cameraPos.xyz;
  let sunDir3 = normalize(scene.lightDir.xyz);
  let fogColor = atmosphericFogColor(viewDir, sunDir3);
  let atmosResult = mix(finalColor, fogColor, fogFactor);

  // Underwater Beer-Lambert absorption + scattering
  let uwAbsorb = vec3f(0.39, 0.11, 0.07);
  let uwTransmittance = exp(-uwAbsorb * min(viewDist, 60.0));
  let uwDayFactor = smoothstep(-0.1, 0.3, sunDir3.y);
  let uwScatterColor = vec3f(0.0, 0.03, 0.07) * uwDayFactor;
  let uwResult = (finalColor * uwTransmittance + uwScatterColor * (1.0 - uwTransmittance.b))
               * exp(-max(camDepthBelow, 0.0) * 0.06);

  finalColor = mix(atmosResult, uwResult, uwBlend);

  return vec4<f32>(finalColor, 1.0);
}
`,$n=`// Atmospheric scattering sky with day-night cycle — orchestrator

// Shared SceneUniforms struct — included by sky.wgsl, lighting.wgsl, etc.
// Total size: 256 bytes (16-byte aligned)

struct SceneUniforms {
  invViewProj: mat4x4<f32>,          // 64  bytes (offset 0)
  cameraPos: vec4<f32>,              // 16  bytes (offset 64)  — xyz=position, w=waterLevel
  lightDir: vec4<f32>,               // 16  bytes (offset 80)  — xyz=sun(day)/moon(night), w=elapsedTime
  sunColor: vec4<f32>,               // 16  bytes (offset 96)  — rgb=color, w=intensity
  ambientColor: vec4<f32>,           // 16  bytes (offset 112) — rgb=ambient, w=groundFactor
  fogParams: vec4<f32>,              // 16  bytes (offset 128) — x=start, y=end, z=skyPackedParams, w=cloudCoverage
  cloudParams: vec4<f32>,            // 16  bytes (offset 144) — x=baseNoiseScale, y=extinction, z=multiScatterFloor, w=detailStrength
  viewProj: mat4x4<f32>,            // 64  bytes (offset 160) — unjittered viewProj for contact shadow / velocity
  contactShadowParams: vec4<f32>,    // 16  bytes (offset 224) — x=enabled, y=maxSteps, z=rayLength, w=thickness
  skyNightParams: vec4<f32>,         // 16  bytes (offset 240) — x=moonPhase, y=moonBrightness, z=elapsedTime, w=trueSunHeight
};

@group(0) @binding(0) var<uniform> scene: SceneUniforms;
@group(0) @binding(1) var gDepth: texture_depth_2d;
@group(0) @binding(2) var cloudTexture: texture_2d<f32>;
@group(0) @binding(3) var cloudSampler: sampler;

// Shared mathematical and PBR constants
const PI: f32 = 3.14159265359;
const TWO_PI: f32 = 6.28318530718;
const INV_PI: f32 = 0.31830988618;
const F0_DIELECTRIC: f32 = 0.04;

// Fullscreen triangle vertex shader
// Generates a single triangle that covers the entire screen using vertex_index.

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

// Atmospheric scattering phase functions
// Requires: PI (from common/constants.wgsl)

fn rayleighPhase(cosTheta: f32) -> f32 {
  return 3.0 / (16.0 * PI) * (1.0 + cosTheta * cosTheta);
}

fn hgPhase(cosTheta: f32, g: f32) -> f32 {
  let g2 = g * g;
  let num = 1.0 - g2;
  let base = max(1.0 + g2 - 2.0 * g * cosTheta, 0.0);
  let denom = max(4.0 * PI * pow(base, 1.5), 0.0001);
  return num / denom;
}

// Hash functions for star field and meteor systems

fn hash(p: vec2<f32>) -> f32 {
  var p3 = fract(vec3<f32>(p.x, p.y, p.x) * 0.1031);
  p3 += dot(p3, vec3<f32>(p3.y + 33.33, p3.z + 33.33, p3.x + 33.33));
  return fract((p3.x + p3.y) * p3.z);
}

fn hash2(p: vec2<f32>) -> vec2<f32> {
  var p3 = fract(vec3<f32>(p.x, p.y, p.x) * vec3<f32>(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract(vec2<f32>((p3.x + p3.y) * p3.z, (p3.x + p3.z) * p3.y));
}

// 3D Simplex Noise (Ashima Arts / Stefan Gustavson)
// Permutation-free GPU implementation

fn mod289_3(x: vec3<f32>) -> vec3<f32> { return x - floor(x * (1.0 / 289.0)) * 289.0; }
fn mod289_4(x: vec4<f32>) -> vec4<f32> { return x - floor(x * (1.0 / 289.0)) * 289.0; }
fn permute4(x: vec4<f32>) -> vec4<f32> { return mod289_4(((x * 34.0) + 10.0) * x); }
fn taylorInvSqrt4(r: vec4<f32>) -> vec4<f32> { return 1.79284291400159 - 0.85373472095314 * r; }

fn snoise3d(v: vec3<f32>) -> f32 {
  let C = vec2<f32>(1.0 / 6.0, 1.0 / 3.0);
  let D = vec4<f32>(0.0, 0.5, 1.0, 2.0);

  // First corner
  var i = floor(v + dot(v, vec3<f32>(C.y)));
  let x0 = v - i + dot(i, vec3<f32>(C.x));

  // Other corners
  let g = step(x0.yzx, x0.xyz);
  let l = 1.0 - g;
  let i1 = min(g.xyz, l.zxy);
  let i2 = max(g.xyz, l.zxy);

  let x1 = x0 - i1 + C.x;
  let x2 = x0 - i2 + C.y;   // 2.0 * C.x = 1/3
  let x3 = x0 - D.yyy;       // -1.0 + 3.0 * C.x = -0.5

  // Permutations
  i = mod289_3(i);
  let p = permute4(permute4(permute4(
    i.z + vec4<f32>(0.0, i1.z, i2.z, 1.0))
  + i.y + vec4<f32>(0.0, i1.y, i2.y, 1.0))
  + i.x + vec4<f32>(0.0, i1.x, i2.x, 1.0));

  // Gradients: 7x7 points over a square, mapped onto an octahedron
  let n_ = 0.142857142857; // 1.0 / 7.0
  let ns = n_ * D.wyz - D.xzx;

  let j = p - 49.0 * floor(p * ns.z * ns.z);

  let x_ = floor(j * ns.z);
  let y_ = floor(j - 7.0 * x_);

  let x = x_ * ns.x + ns.y;
  let y = y_ * ns.x + ns.y;
  let h = 1.0 - abs(x) - abs(y);

  let b0 = vec4<f32>(x.xy, y.xy);
  let b1 = vec4<f32>(x.zw, y.zw);

  let s0 = floor(b0) * 2.0 + 1.0;
  let s1 = floor(b1) * 2.0 + 1.0;
  let sh = -step(h, vec4<f32>(0.0));

  let a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  let a1 = b1.xzyw + s1.xzyw * sh.zzww;

  var p0 = vec3<f32>(a0.xy, h.x);
  var p1 = vec3<f32>(a0.zw, h.y);
  var p2 = vec3<f32>(a1.xy, h.z);
  var p3 = vec3<f32>(a1.zw, h.w);

  // Normalise gradients
  let norm = taylorInvSqrt4(vec4<f32>(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  // Mix final noise value
  var m = max(vec4<f32>(0.6) - vec4<f32>(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), vec4<f32>(0.0));
  m = m * m;
  // Returns [-1, 1], remap to [0, 1]
  return 42.0 * dot(m * m, vec4<f32>(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3))) * 0.5 + 0.5;
}

// Multi-layer star field with color temperature and Kolmogorov twinkling
// Requires: hash(), hash2(), PI

fn starColor(h: f32) -> vec3<f32> {
  if (h < 0.15) { return vec3<f32>(0.7, 0.8, 1.0); }       // blue-white (B/A)
  else if (h < 0.60) { return vec3<f32>(1.0, 1.0, 0.95); }  // white (F/G)
  else if (h < 0.85) { return vec3<f32>(1.0, 0.9, 0.7); }   // yellow-white (G/K)
  else { return vec3<f32>(1.0, 0.75, 0.5); }                 // orange (K/M)
}

// Multi-frequency star scintillation (Kolmogorov spectrum approximation)
fn starTwinkle(starTime: f32, phase: f32, elevation: f32) -> f32 {
  var t = sin(starTime * 1.7 + phase) * 0.35;
  t += sin(starTime * 4.3 + phase * 2.1) * 0.2;
  t += sin(starTime * 7.1 + phase * 3.7) * 0.12;
  t += sin(starTime * 13.0 + phase * 5.3) * 0.08;
  let elevFactor = mix(1.5, 0.5, smoothstep(0.0, 0.5, elevation));
  return clamp(0.75 + t * elevFactor, 0.3, 1.4);
}

fn sampleStarField(rayDir: vec3<f32>, elapsedTime: f32) -> vec3<f32> {
  let theta = atan2(rayDir.z, rayDir.x);
  let phi = asin(clamp(rayDir.y, -1.0, 1.0));
  let starTime = elapsedTime % 628.318;
  let elevation = max(rayDir.y, 0.0);

  var stars = vec3<f32>(0.0);

  // Layer 1: bright stars (large cells, ~6% density)
  let scale1 = 70.0;
  let uv1 = vec2<f32>(theta * scale1 / PI, phi * scale1 / (PI * 0.5));
  let cell1 = floor(uv1);
  let h1 = hash2(cell1);
  let offset1 = h1 - 0.5;
  let cellCenter1 = cell1 + 0.5 + offset1 * 0.8;
  let dist1 = length(uv1 - cellCenter1);
  let brightness1 = hash(cell1 + vec2<f32>(7.31, 3.17));
  if (brightness1 > 0.94) {
    let falloff1 = exp(-dist1 * dist1 * 80.0);
    let colorHash1 = hash(cell1 + vec2<f32>(13.7, 29.3));
    let col1 = starColor(colorHash1);
    let twinkle1 = starTwinkle(starTime, brightness1 * 100.0, elevation);
    let intensity1 = (brightness1 - 0.94) / 0.06 * 2.5;
    stars += col1 * falloff1 * twinkle1 * intensity1;
  }

  // Layer 2: medium stars (medium cells, ~3% density)
  let scale2 = 200.0;
  let uv2 = vec2<f32>(theta * scale2 / PI, phi * scale2 / (PI * 0.5));
  let cell2 = floor(uv2);
  let h2 = hash2(cell2);
  let offset2 = h2 - 0.5;
  let cellCenter2 = cell2 + 0.5 + offset2 * 0.8;
  let dist2 = length(uv2 - cellCenter2);
  let brightness2 = hash(cell2 + vec2<f32>(11.13, 5.71));
  if (brightness2 > 0.97) {
    let falloff2 = exp(-dist2 * dist2 * 120.0);
    let colorHash2 = hash(cell2 + vec2<f32>(17.1, 23.9));
    let col2 = starColor(colorHash2);
    let twinkle2 = starTwinkle(starTime, brightness2 * 77.0, elevation);
    let intensity2 = (brightness2 - 0.97) / 0.03 * 1.2;
    stars += col2 * falloff2 * twinkle2 * intensity2;
  }

  // Layer 3: star dust (fine cells, ~4% density, no twinkling)
  let scale3 = 500.0;
  let uv3 = vec2<f32>(theta * scale3 / PI, phi * scale3 / (PI * 0.5));
  let cell3 = floor(uv3);
  let h3 = hash2(cell3);
  let offset3 = h3 - 0.5;
  let cellCenter3 = cell3 + 0.5 + offset3 * 0.8;
  let dist3 = length(uv3 - cellCenter3);
  let brightness3 = hash(cell3 + vec2<f32>(19.37, 7.93));
  if (brightness3 > 0.96) {
    let falloff3 = exp(-dist3 * dist3 * 200.0);
    let intensity3 = (brightness3 - 0.96) / 0.04 * 0.3;
    stars += vec3<f32>(0.9, 0.92, 1.0) * falloff3 * intensity3;
  }

  return stars;
}

// Night Nebula / Milky Way (3-layer FBM Simplex)
// Requires: snoise3d()

fn sampleNebula(rayDir: vec3<f32>, time: f32) -> vec3<f32> {
  if (rayDir.y < 0.05) { return vec3<f32>(0.0); }

  // Galactic plane: tilted band across the sky (Milky Way-like)
  let galacticNormal = normalize(vec3<f32>(0.35, 0.7, 0.55));
  let galacticDist = abs(dot(rayDir, galacticNormal));
  let bandMask = smoothstep(0.55, 0.15, galacticDist);
  if (bandMask < 0.01) { return vec3<f32>(0.0); }

  // Use ray direction as 3D noise coordinate (seamless on sphere)
  let coord = rayDir * 3.0;
  let t = time * 0.004;

  // Layer 1: Deep blue-violet (dominant nebula mass)
  let p1 = coord + vec3<f32>(0.0, 0.0, t);
  var n1 = snoise3d(p1)         * 0.5
         + snoise3d(p1 * 2.03)  * 0.25
         + snoise3d(p1 * 4.01)  * 0.125
         + snoise3d(p1 * 8.05)  * 0.0625;
  n1 = smoothstep(0.38, 0.65, n1);

  // Layer 2: Warm emission pockets (amber/orange)
  let p2 = coord * 1.3 + vec3<f32>(43.0, 17.0, t * 0.7);
  var n2 = snoise3d(p2)         * 0.5
         + snoise3d(p2 * 1.97)  * 0.25
         + snoise3d(p2 * 3.89)  * 0.125
         + snoise3d(p2 * 7.83)  * 0.0625;
  n2 = smoothstep(0.42, 0.7, n2);

  // Layer 3: Bright blue-white core (star-forming regions, finer detail)
  let p3 = coord * 0.8 + vec3<f32>(91.0, 53.0, t * 0.5);
  var n3 = snoise3d(p3)         * 0.5
         + snoise3d(p3 * 2.11)  * 0.25
         + snoise3d(p3 * 4.27)  * 0.125
         + snoise3d(p3 * 8.53)  * 0.0625
         + snoise3d(p3 * 17.1)  * 0.03125;
  n3 = smoothstep(0.4, 0.68, n3);

  // Color composition
  let col1 = vec3<f32>(0.06, 0.03, 0.14) * n1;  // blue-violet
  let col2 = vec3<f32>(0.10, 0.05, 0.02) * n2;  // warm amber
  let col3 = vec3<f32>(0.05, 0.06, 0.10) * n3;  // blue-white

  // Horizon atmospheric extinction
  let horizFade = smoothstep(0.05, 0.25, rayDir.y);

  return (col1 + col2 + col3) * bandMask * horizFade;
}

// Procedural moon: albedo, N·L shading, Mie glow
// Requires: snoise3d(), PI

fn moonAlbedo(sp: vec3<f32>) -> vec3<f32> {
  let highland = vec3<f32>(0.75, 0.73, 0.70);
  let maria = vec3<f32>(0.35, 0.33, 0.30);

  let m1 = snoise3d(sp * 1.8 + vec3<f32>(42.0, 17.0, 0.0));
  let m2 = snoise3d(sp * 0.9 + vec3<f32>(7.0, 31.0, 0.0));
  let mariaMask = smoothstep(0.35, 0.65, m1 * 0.6 + m2 * 0.4);
  var albedo = mix(maria, highland, mariaMask);

  let c1 = snoise3d(sp * 5.0 + vec3<f32>(100.0, 0.0, 0.0));
  albedo += vec3<f32>(smoothstep(0.42, 0.48, c1) * 0.15);
  let c2 = snoise3d(sp * 12.0 + vec3<f32>(0.0, 100.0, 0.0));
  albedo += vec3<f32>(smoothstep(0.40, 0.50, c2) * 0.10);
  albedo += vec3<f32>((snoise3d(sp * 25.0 + vec3<f32>(0.0, 0.0, 100.0)) - 0.5) * 0.08);

  return albedo;
}

// Moon shading: N·L diffuse on sphere — phase + 3D shape in one
fn moonShading(nx: f32, ny: f32, moonPhase: f32) -> vec3<f32> {
  let r2 = nx * nx + ny * ny;
  if (r2 > 1.0) { return vec3<f32>(0.0); }

  let nz = sqrt(1.0 - r2);
  let N = vec3<f32>(nx, ny, nz);

  // Light direction from phase (moon-local space)
  let L = vec3<f32>(sin(moonPhase * 2.0 * PI), 0.0, -cos(moonPhase * 2.0 * PI));

  let NdotL = dot(N, L);
  let diffuse = smoothstep(-0.02, 0.08, NdotL);

  let albedo = moonAlbedo(N);
  let litColor = albedo * vec3<f32>(1.1, 1.15, 1.3) * diffuse * 2.2;
  let earthshine = albedo * vec3<f32>(0.012, 0.013, 0.018) * (1.0 - diffuse);

  return litColor + earthshine;
}

// Continuous Mie-based moon glow (no discontinuities)
fn moonGlow(moonDot: f32, moonBrightness: f32) -> vec3<f32> {
  let angle = acos(clamp(moonDot, -1.0, 1.0));
  let inner = exp(-angle * angle * 8000.0) * vec3<f32>(0.20, 0.22, 0.30);
  let corona = exp(-angle * angle * 800.0) * vec3<f32>(0.08, 0.09, 0.15);
  let halo = exp(-angle * 60.0) * vec3<f32>(0.015, 0.018, 0.035);
  return (inner + corona + halo) * moonBrightness;
}

// Deterministic meteor (shooting star) system — no state needed
// Requires: hash2(), PI

fn sampleMeteor(rayDir: vec3<f32>, time: f32) -> vec3<f32> {
  var result = vec3<f32>(0.0);
  for (var i = 0u; i < 4u; i++) {
    let slot = f32(i);
    // Per-slot period: 15~25 second intervals
    let period = 18.0 + slot * 3.7;
    let phase = floor(time / period);
    let localT = fract(time / period);
    // Active window: 0.0~0.08 (~8% of period = ~1.5s visible)
    if (localT > 0.08) { continue; }
    let t = localT / 0.08; // 0→1 over lifetime

    // Start point: hash-determined on upper hemisphere
    let h = hash2(vec2<f32>(phase * 17.3 + slot * 7.1, slot * 13.7 + 0.5));
    let theta0 = h.x * 2.0 * PI;
    let phi0 = 0.3 + h.y * 0.5; // elevation 17°~46°
    let startDir = vec3<f32>(cos(theta0) * cos(phi0), sin(phi0), sin(theta0) * cos(phi0));

    // Drift direction (slightly downward)
    let h2 = hash2(vec2<f32>(phase * 31.1 + slot, slot * 23.3));
    let drift = normalize(vec3<f32>(h2.x - 0.5, -0.3, h2.y - 0.5));
    let trailLen = 0.06;
    let headPos = normalize(startDir + drift * t * 0.3);

    let headDot = dot(rayDir, headPos);
    let headAngle = acos(clamp(headDot, -1.0, 1.0));

    let tailPos = normalize(startDir + drift * max(t - trailLen, 0.0) * 0.3);

    let brightness = smoothstep(0.0, 0.15, t) * smoothstep(1.0, 0.5, t);
    let glow = exp(-headAngle * headAngle * 15000.0) * brightness * 3.0;

    let midPos = normalize(mix(headPos, tailPos, 0.5));
    let midDot = dot(rayDir, midPos);
    let midAngle = acos(clamp(midDot, -1.0, 1.0));
    let tailGlow = exp(-midAngle * midAngle * 5000.0) * brightness * 1.0;

    let meteorColor = vec3<f32>(0.9, 0.85, 0.7);
    result += meteorColor * (glow + tailGlow);
  }
  return result;
}

// Night sky gradient (zenith to horizon)
fn nightSkyGradient(up: f32) -> vec3<f32> {
  let zenith = vec3<f32>(0.003, 0.005, 0.018);
  let horizon = vec3<f32>(0.012, 0.015, 0.028);
  return mix(horizon, zenith, pow(max(up, 0.0), 0.5));
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  // Only render where depth == 1.0 (sky pixels)
  let pixelCoord = vec2<i32>(input.position.xy);
  let depth = textureLoad(gDepth, pixelCoord, 0);
  if (depth < 1.0) {
    discard;
  }

  // Reconstruct ray direction
  let ndc = vec4<f32>(
    input.uv.x * 2.0 - 1.0,
    -(input.uv.y * 2.0 - 1.0),
    1.0,
    1.0
  );
  let worldH = scene.invViewProj * ndc;
  let rayDir = normalize(worldH.xyz / worldH.w - scene.cameraPos.xyz);

  let lightDir = normalize(scene.lightDir.xyz);
  let up = rayDir.y;
  let cosTheta = dot(rayDir, lightDir);
  let lightHeight = lightDir.y;

  // trueSunHeight: CPU-computed real sun position, immune to day/night lightDir switching
  let trueSunHeight = scene.skyNightParams.w;
  let dayFactor = smoothstep(-0.15, 0.1, trueSunHeight);
  let nightFactor = 1.0 - dayFactor;

  // === Rayleigh scattering ===
  let rayleigh = rayleighPhase(cosTheta);
  let altitude = max(up, 0.0);
  let opticalDepth = exp(-altitude * 4.0);
  let rayleighColor = vec3<f32>(0.3, 0.55, 0.95) * rayleigh * opticalDepth;

  // === Mie scattering (sun halo) ===
  let mie = hgPhase(cosTheta, 0.76);
  let mieColor = vec3<f32>(1.0, 0.95, 0.85) * mie * 0.02;

  // === Day sky ===
  let zenithColor = vec3<f32>(0.22, 0.40, 0.85);
  let horizonColor = vec3<f32>(0.60, 0.75, 0.92);

  var skyColor: vec3<f32>;
  if (up > 0.0) {
    let t = pow(up, 0.45);
    skyColor = mix(horizonColor, zenithColor, t);
  } else {
    let groundColor = vec3<f32>(0.55, 0.62, 0.70);
    let t = pow(-up, 0.7);
    skyColor = mix(horizonColor, groundColor, t);
  }

  skyColor += rayleighColor * 0.8 + mieColor;

  // === Horizon warming (sunset/sunrise tint) ===
  let sunsetFactor = 1.0 - clamp(abs(trueSunHeight) * 3.0, 0.0, 1.0);
  let horizonWarm = vec3<f32>(1.2, 0.5, 0.15) * sunsetFactor * max(cosTheta, 0.0) * 0.5;
  let horizonBand = exp(-abs(up) * 8.0);
  skyColor += horizonWarm * horizonBand;

  // Dim day sky toward night
  skyColor *= dayFactor;

  // === Sun disc ===
  let sunRight = normalize(cross(lightDir, vec3<f32>(0.0, 1.0, 0.001)));
  let sunUp = normalize(cross(sunRight, lightDir));
  let sunLocalX = dot(rayDir - lightDir * cosTheta, sunRight);
  let sunLocalY = dot(rayDir - lightDir * cosTheta, sunUp);
  let sunDist = length(vec2<f32>(sunLocalX, sunLocalY));
  let sunSize = 0.038;

  if (sunDist < sunSize && cosTheta > 0.9 && dayFactor > 0.01) {
    let edge = smoothstep(sunSize, sunSize * 0.85, sunDist);
    let sunDiscColor = vec3<f32>(10.0, 8.0, 5.0) * dayFactor;
    skyColor = mix(skyColor, sunDiscColor, edge);
  }

  // Sun glow (round, soft)
  let glowRadius = 0.97;
  if (cosTheta > glowRadius && dayFactor > 0.01) {
    let t = (cosTheta - glowRadius) / (1.0 - glowRadius);
    let glowStr = t * t * 0.6 * max(trueSunHeight + 0.1, 0.0);
    let glowColor = mix(vec3<f32>(1.2, 0.6, 0.2), vec3<f32>(1.5, 1.3, 0.9), clamp(lightHeight * 3.0, 0.0, 1.0));
    skyColor += glowColor * glowStr;
  }

  // === Night sky ===
  if (nightFactor > 0.01) {
    let moonPhase = scene.skyNightParams.x;
    let moonBright = scene.skyNightParams.y;
    let starTime = scene.skyNightParams.z;

    // Moon disc mask
    let moonDir = lightDir;
    let moonDot2 = dot(rayDir, moonDir);
    let moonRight = normalize(cross(moonDir, vec3<f32>(0.0, 1.0, 0.001)));
    let moonUpDir = normalize(cross(moonRight, moonDir));
    let moonLocalX = dot(rayDir - moonDir * moonDot2, moonRight);
    let moonLocalY = dot(rayDir - moonDir * moonDot2, moonUpDir);
    let moonDist = length(vec2<f32>(moonLocalX, moonLocalY));
    let moonSize = 0.030;
    var moonEdge = 0.0;
    if (moonDist < moonSize && moonDot2 > 0.9) {
      moonEdge = smoothstep(moonSize, moonSize * 0.9, moonDist);
    }
    let moonOcclusion = 1.0 - moonEdge;

    // Night sky gradient
    skyColor += nightSkyGradient(up) * nightFactor;

    // Horizon atmospheric glow
    let horizAtmo = exp(-abs(up) * 5.0);
    let horizGlowColor = vec3<f32>(0.010, 0.013, 0.028) + vec3<f32>(0.005, 0.006, 0.010) * moonBright;
    skyColor += horizGlowColor * horizAtmo * nightFactor;

    // Unpack sky params from fogParams.z (2x f16 packed as u32)
    let skyPacked = unpack2x16float(bitcast<u32>(scene.fogParams.z));
    let starBrightness = skyPacked.x;
    let nebulaIntensity = skyPacked.y;

    // Nebula / Milky Way (moonOcclusion only — cloud handled in final composite)
    if (up > 0.05 && nebulaIntensity > 0.001) {
      var nebulaColor = sampleNebula(rayDir, starTime);
      nebulaColor *= 1.0 - 0.3 * moonBright;
      skyColor += nebulaColor * nightFactor * moonOcclusion * nebulaIntensity;
    }

    // Stars (moonOcclusion only)
    if (up > 0.0 && starBrightness > 0.001) {
      var starFieldColor = sampleStarField(rayDir, starTime);
      let horizFade = smoothstep(0.0, 0.15, up);
      starFieldColor *= horizFade;
      starFieldColor *= 1.0 - 0.4 * moonBright;
      skyColor += starFieldColor * nightFactor * moonOcclusion * starBrightness;
    }

    // Meteors (moonOcclusion only)
    if (up > 0.05) {
      skyColor += sampleMeteor(rayDir, starTime) * nightFactor * moonOcclusion;
    }

    // Moon disc
    if (moonEdge > 0.0) {
      let normX = moonLocalX / moonSize;
      let normY = moonLocalY / moonSize;
      let moonColor = moonShading(normX, normY, moonPhase);
      skyColor += moonColor * moonEdge * nightFactor;
    }

    // Moon glow
    skyColor += moonGlow(moonDot2, moonBright) * nightFactor;
  }

  // === Cloud composite ===
  // All sky elements (day gradient, sun, stars, moon, etc.) are behind clouds.
  // Apply cloud transmittance to entire sky, then add cloud scattered light.
  let cloudData = textureSampleLevel(cloudTexture, cloudSampler, input.uv, 0.0);
  skyColor = skyColor * cloudData.a + cloudData.rgb;

  return vec4<f32>(skyColor, 1.0);
}
`,Qn=`struct Uniforms {
  viewProjection: mat4x4f,
  time: f32,
}
@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexInput {
  @location(0) position: vec3f,
  @location(1) uv: vec2f,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) worldPos: vec3f,
  @location(1) uv: vec2f,
}

@vertex
fn main(input: VertexInput) -> VertexOutput {
  var out: VertexOutput;
  var pos = input.position;

  // Multi-frequency wave displacement (matches fragment normal derivatives)
  let t = uniforms.time;
  let wave = sin(pos.x * 0.8 + t * 1.2) * 0.08
           + sin(pos.z * 1.2 + t * 0.9) * 0.06
           + sin((pos.x + pos.z) * 2.0 + t * 2.5) * 0.03
           + sin((pos.x - pos.z) * 3.0 + t * 1.8) * 0.015
           // Medium-frequency ripples
           + sin(pos.x * 5.3 + pos.z * 1.7 + t * 3.1) * 0.005
           + sin(pos.z * 4.9 - pos.x * 2.3 + t * 2.7) * 0.005;
  pos.y += wave;

  out.position = uniforms.viewProjection * vec4f(pos, 1.0);
  out.worldPos = pos;
  out.uv = input.uv;
  return out;
}
`,Jn=`// ======================== Water Fragment Shader ========================
// Physical water rendering: SSR reflections (blocks + sky/clouds),
// procedural refraction, Fresnel compositing, Snell's window, edge foam
//
// sceneColorTex 사용 규칙 (SSAO artifact 방지):
//   - 굴절(아래 보기): 절대 금지 → procedural 색상만 사용
//   - SSR 반사(ray-march hit): OK → 수면 위 지오메트리의 SSAO는 로컬하게 올바름
//   - 하늘/구름 반사(depth>0.999): OK → 하늘 픽셀에는 SSAO 없음
//   - 수중 Snell's window: OK → 위를 올려다보는 것이므로 정상

// Shared mathematical and PBR constants
const PI: f32 = 3.14159265359;
const TWO_PI: f32 = 6.28318530718;
const INV_PI: f32 = 0.31830988618;
const F0_DIELECTRIC: f32 = 0.04;

struct FragUniforms {
  cameraPos: vec3f,
  time: f32,
  sunDirection: vec3f,
  sunIntensity: f32,
  sunColor: vec3f,
  nearPlane: f32,
  fogColor: vec3f,
  farPlane: f32,
  fogStart: f32,
  fogEnd: f32,
  screenSize: vec2f,
  waterLevel: f32,
  pad0: f32,
  pad1: f32,
  pad2: f32,
  viewProjection: mat4x4f,
  invViewProjection: mat4x4f,
}

@group(0) @binding(1) var<uniform> frag: FragUniforms;
@group(0) @binding(2) var sceneColorTex: texture_2d<f32>;
@group(0) @binding(3) var sceneDepthTex: texture_depth_2d;
@group(0) @binding(4) var texSampler: sampler;

struct FragInput {
  @builtin(position) position: vec4f,
  @location(0) worldPos: vec3f,
  @location(1) uv: vec2f,
}

const WATER_ABSORB = vec3f(0.39, 0.11, 0.07);

fn linearizeDepth(d: f32) -> f32 {
  let near = frag.nearPlane;
  let far = frag.farPlane;
  return near * far / (far - d * (far - near));
}

// ---- Noise functions for organic water normals ----

fn hash2d(p: vec2f) -> f32 {
  var p3 = fract(vec3f(p.x, p.y, p.x) * vec3f(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

fn smoothNoise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);

  let a = hash2d(i);
  let b = hash2d(i + vec2f(1.0, 0.0));
  let c = hash2d(i + vec2f(0.0, 1.0));
  let d = hash2d(i + vec2f(1.0, 1.0));

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

fn waterFBM(p: vec2f) -> f32 {
  var value = 0.0;
  var amplitude = 0.5;
  var pos = p;
  let rot = mat2x2f(0.8, 0.6, -0.6, 0.8);

  for (var i = 0; i < 4; i = i + 1) {
    value += amplitude * smoothNoise(pos);
    pos = rot * pos * 2.05 + vec2f(1.7, 9.2);
    amplitude *= 0.5;
  }
  return value;
}

fn waterNormal(pos: vec3f, t: f32) -> vec3f {
  let eps = 0.08;
  let strength = 0.35;

  let flow1 = vec2f(t * 0.4, t * 0.3);
  let flow2 = vec2f(-t * 0.25, t * 0.35);
  let scale1 = 0.8;
  let scale2 = 1.6;
  let uv = pos.xz;

  let h00 = waterFBM(uv * scale1 + flow1) * 0.7
           + waterFBM(uv * scale2 + flow2) * 0.3;
  let h10 = waterFBM((uv + vec2f(eps, 0.0)) * scale1 + flow1) * 0.7
           + waterFBM((uv + vec2f(eps, 0.0)) * scale2 + flow2) * 0.3;
  let h01 = waterFBM((uv + vec2f(0.0, eps)) * scale1 + flow1) * 0.7
           + waterFBM((uv + vec2f(0.0, eps)) * scale2 + flow2) * 0.3;

  let dhdx = (h10 - h00) / eps * strength;
  let dhdz = (h01 - h00) / eps * strength;

  return normalize(vec3f(-dhdx, 1.0, -dhdz));
}

// ---- SSR ----

// Project world position → screen UV + NDC depth
fn worldToScreen(wp: vec3f) -> vec3f {
  let clip = frag.viewProjection * vec4f(wp, 1.0);
  // Behind camera guard
  if (clip.w <= 0.0) { return vec3f(-1.0, -1.0, 0.0); }
  let ndc = clip.xyz / clip.w;
  // WebGPU framebuffer: (0,0) = top-left, Y flipped from NDC
  let uv = vec2f(ndc.x * 0.5 + 0.5, 1.0 - (ndc.y * 0.5 + 0.5));
  return vec3f(uv, ndc.z);
}

// SSR ray march — returns (reflectedColor, confidence)
// Only hits above-water geometry → sceneColorTex safe (SSAO locally correct)
fn waterSSR(worldPos: vec3f, N: vec3f, V: vec3f) -> vec4f {
  let R = reflect(-V, N);

  // Skip downward / nearly-horizontal reflections
  if (R.y < 0.02) { return vec4f(0.0); }

  // --- Parameters ---
  let THICKNESS = 0.5;  // world-space units (compared in linear depth)

  var rayPos = worldPos;
  var prevRayPos = rayPos;
  var stepSize = 0.4;
  var hit = false;
  var hitUV = vec2f(0.0);

  // --- Linear march ---
  for (var i = 0; i < 48; i = i + 1) {
    prevRayPos = rayPos;
    rayPos += R * stepSize;
    stepSize *= 1.08;

    let scr = worldToScreen(rayPos);

    // Off-screen → stop
    if (scr.x < 0.0 || scr.x > 1.0 || scr.y < 0.0 || scr.y > 1.0) { break; }

    let sceneDepthRaw = textureLoad(sceneDepthTex, vec2i(scr.xy * frag.screenSize), 0);

    // Sky pixel (depth ≈ 1.0) → no solid geometry, skip
    if (sceneDepthRaw > 0.999) { continue; }

    // Compare in LINEAR depth (world-space units)
    let linearRay = linearizeDepth(scr.z);
    let linearScene = linearizeDepth(sceneDepthRaw);
    let diff = linearRay - linearScene;

    if (diff > 0.0 && diff < THICKNESS) {
      // --- Binary refinement (lo/hi bisection) ---
      var lo = prevRayPos;
      var hi = rayPos;
      for (var j = 0; j < 5; j = j + 1) {
        let mid = (lo + hi) * 0.5;
        let ms = worldToScreen(mid);
        let md = textureLoad(sceneDepthTex, vec2i(ms.xy * frag.screenSize), 0);
        if (linearizeDepth(ms.z) > linearizeDepth(md)) {
          hi = mid;  // ray behind surface → move backward
        } else {
          lo = mid;  // ray in front → move forward
        }
      }
      let hitScr = worldToScreen((lo + hi) * 0.5);
      hitUV = hitScr.xy;
      hit = true;
      break;
    }
  }

  if (!hit) { return vec4f(0.0); }

  // --- Confidence (fade-outs) ---
  // Screen-edge fade (5% margin)
  let edgeFade = smoothstep(0.0, 0.05, hitUV.x)
               * smoothstep(1.0, 0.95, hitUV.x)
               * smoothstep(0.0, 0.05, hitUV.y)
               * smoothstep(1.0, 0.95, hitUV.y);
  // Distance fade (40–80 world units)
  let rayDist = length(rayPos - worldPos);
  let distFade = 1.0 - smoothstep(40.0, 80.0, rayDist);
  // Direction fade (nearly-horizontal reflections less reliable)
  let dirFade = smoothstep(0.02, 0.15, R.y);

  let confidence = edgeFade * distFade * dirFade;

  // Sample scene color at geometrically-correct hit position
  let reflectedColor = textureSampleLevel(sceneColorTex, texSampler, hitUV, 0.0).rgb;
  return vec4f(reflectedColor, confidence);
}

@fragment
fn main(input: FragInput) -> @location(0) vec4f {
  let pixelCoord = vec2i(input.position.xy);
  let screenUV = input.position.xy / frag.screenSize;

  // ==================== Common Setup ====================
  let rawSceneDepth = textureLoad(sceneDepthTex, pixelCoord, 0);
  let linearScene = linearizeDepth(rawSceneDepth);
  let linearWater = linearizeDepth(input.position.z);
  let waterDepth = max(linearScene - linearWater, 0.0);

  let N = waterNormal(input.worldPos, frag.time);
  let V = normalize(frag.cameraPos - input.worldPos);
  let viewDist = length(frag.cameraPos - input.worldPos);
  let dayFactor = smoothstep(0.2, 0.6, frag.sunIntensity);

  // ==================== Sun Specular ====================
  let L = normalize(frag.sunDirection);
  let R = reflect(-V, N);
  let sunReflect = max(dot(R, L), 0.0);
  let specular = frag.sunColor * frag.sunIntensity
    * pow(sunReflect, 512.0) * 0.3;

  // ==================== Analytical Sky (gradient fallback) ====================
  let skyGradient = clamp(R.y * 0.5 + 0.5, 0.0, 1.0);
  let horizonColor = mix(vec3f(0.015, 0.02, 0.035), vec3f(0.35, 0.45, 0.6), dayFactor);
  let zenithColor = mix(vec3f(0.005, 0.008, 0.025), vec3f(0.15, 0.3, 0.65), dayFactor);
  let analyticalSky = mix(horizonColor, zenithColor, skyGradient);

  let deepColor = mix(vec3f(0.0, 0.01, 0.03), vec3f(0.0, 0.04, 0.12), dayFactor);

  // Smooth underwater transition (0.3-unit transition zone instead of hard binary switch)
  let uwBlend = smoothstep(frag.waterLevel + 0.3, frag.waterLevel - 0.3, frag.cameraPos.y);

  // ==================== ABOVE-WATER PATH ====================
  // Refraction (procedural only — no sceneColorTex, SSAO artifact 방지)
  let shallowColor = mix(vec3f(0.0, 0.15, 0.25), vec3f(0.05, 0.25, 0.35), dayFactor);
  let refraction = mix(shallowColor, deepColor, smoothstep(0.0, 5.0, waterDepth));

  // Reflection (SSR + sky fallback) — skip expensive SSR when fully underwater
  var ssrResult = vec4f(0.0);
  var envReflection = analyticalSky;
  if (uwBlend < 0.99) {
    ssrResult = waterSSR(input.worldPos, N, V);
    for (var sd = 1; sd <= 5; sd = sd + 1) {
      let dist = f32(sd) * 50.0;
      let skyPt = input.worldPos + R * dist;
      let skyScr = worldToScreen(skyPt);
      if (skyScr.x > 0.01 && skyScr.x < 0.99 && skyScr.y > 0.01 && skyScr.y < 0.99) {
        let skyD = textureLoad(sceneDepthTex, vec2i(skyScr.xy * frag.screenSize), 0);
        if (skyD > 0.999) {
          envReflection = textureSampleLevel(sceneColorTex, texSampler, skyScr.xy, 0.0).rgb;
          break;
        }
      }
    }
  }
  let reflection = mix(envReflection, ssrResult.rgb, ssrResult.a) + specular;

  let NdotV = max(dot(N, V), 0.0);
  let F0 = F0_DIELECTRIC;
  let fresnel = F0 + (1.0 - F0) * pow(1.0 - NdotV, 5.0);
  let depthBoost = smoothstep(0.0, 3.0, waterDepth) * 0.15;
  let finalFresnel = clamp(fresnel + depthBoost, 0.0, 0.40);
  var aboveColor = mix(refraction, reflection, finalFresnel);

  // Edge foam
  let foamLine = smoothstep(0.5, 0.0, waterDepth);
  let foamWave = sin(input.worldPos.x * 8.0 + frag.time * 2.0) * 0.5 + 0.5;
  let foamWave2 = sin(input.worldPos.z * 6.0 + frag.time * 1.5) * 0.5 + 0.5;
  let foam = foamLine * (0.5 + 0.5 * foamWave * foamWave2) * dayFactor;
  aboveColor += vec3f(foam * 0.7, foam * 0.75, foam * 0.8);

  // Distance fog (above-water path only)
  let fogFactor = clamp((viewDist - frag.fogStart) / (frag.fogEnd - frag.fogStart), 0.0, 1.0);
  aboveColor = mix(aboveColor, frag.fogColor, fogFactor);

  // ==================== UNDERWATER PATH ====================
  // sceneColorTex OK — looking up through water surface, SSAO is natural
  let aboveScene = textureSampleLevel(sceneColorTex, texSampler, screenUV, 0.0).rgb;
  let cosAngle = abs(dot(N, V));
  let snellsWindow = smoothstep(0.55, 0.75, cosAngle);
  let tirColor = deepColor * 0.3 + specular * 0.5;
  var belowColor = mix(tirColor, aboveScene, snellsWindow);

  let uwDist = min(viewDist, 30.0);
  belowColor *= exp(-WATER_ABSORB * uwDist * 0.3);
  let depthBelowSurface = max(frag.waterLevel - frag.cameraPos.y, 0.0);
  belowColor *= exp(-depthBelowSurface * 0.08);

  // ==================== BLEND ====================
  var color = mix(aboveColor, belowColor, uwBlend);
  var alpha = mix(1.0, 0.95, uwBlend);

  return vec4f(color, alpha);
}
`,er=`// Weather particle shader (rain & snow) using GPU instancing
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
`;function Tt(i){const e=new ArrayBuffer(4);new Float32Array(e)[0]=i;const t=new Uint32Array(e)[0],n=t>>16&32768,r=(t>>23&255)-127+15,s=t>>13&1023;return r<=0?n:r>=31?n|31744:n|r<<10|s}const Bt=256,Ct=112,Gt=80,At=224,Lt=96,tr=4096,Mt=16+dt*32;class nr{constructor(e,t){this.dayNightCycle=t,this.ctx=e,this.gBuffer=new fn(e),this.shadowMap=new Sn(e),this.ssao=new Bn(e),this.postProcess=new Nn(e),this.taa=new zn(e),this.cloudNoiseGen=new Wn(e),this.volumetricClouds=new Xn(e),this.createClearCloudTexture(),this.createSamplers(),this.createGBufferPass(),this.createLightingPass(),this.createSkyPass(),this.createWaterPass(),this.createWeatherPass(),e.onResize=()=>this.handleResize()}ctx;gBuffer;shadowMap;ssao;postProcess;taa;gbufferPipeline;gbufferVegetationPipeline;cameraUniformBuffer;cameraBindGroup;cameraBindGroupLayout;textureBindGroupLayout;textureBindGroup=null;lightingPipeline;sceneUniformBuffer;sceneBindGroupLayout;gbufferReadBindGroupLayout;shadowReadBindGroupLayout;pointLightBindGroupLayout;pointLightBuffer;pointLightBindGroup;pointLightF32=new Float32Array(Mt/4);sceneBindGroup;gbufferReadBindGroup;shadowReadBindGroup;skyPipeline;skyBindGroupLayout;skyBindGroups=null;waterPipeline;waterBindGroupLayout;waterVertUniformBuffer;waterFragUniformBuffer;waterBindGroups=null;linearSampler;shadowSampler;lastViewProj=se();lastProjection=se();lastInvProjection=se();unjitteredViewProj=se();camF32=new Float32Array(Ct/4);sceneF32=new Float32Array(Bt/4);waterVertF32=new Float32Array(Gt/4);waterFragF32=new Float32Array(At/4);invVP=se();weatherPipeline;weatherUniformBuffer;weatherBindGroupLayout;weatherBindGroup;weatherF32=new Float32Array(Lt/4);weatherSystem=null;cloudNoiseGen;volumetricClouds;clearCloudView;atlasSampler=null;bindGroupsDirty=!0;waterBindGroupDirty=!0;waterTime=0;cachedDt=0;underwaterDepth=0;frameIndex=0;shaderChecks=[];async init(){this.shaderChecks.push(...this.taa.shaderChecks),this.shaderChecks.push(...this.volumetricClouds.shaderChecks),this.shaderChecks.push(this.cloudNoiseGen.shaderCheck),await Promise.all(this.shaderChecks),this.shaderChecks=[],await this.cloudNoiseGen.generate(),this.initSkyBindGroups()}checkShader(e,t){this.shaderChecks.push(Te(e,t))}createSamplers(){this.linearSampler=this.ctx.device.createSampler({magFilter:"linear",minFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"}),this.shadowSampler=this.ctx.device.createSampler({compare:"less",magFilter:"linear",minFilter:"linear"})}createGBufferPass(){const e=this.ctx.device;this.cameraBindGroupLayout=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]}),this.textureBindGroupLayout=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,sampler:{}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{}},{binding:2,visibility:GPUShaderStage.FRAGMENT,texture:{}},{binding:3,visibility:GPUShaderStage.FRAGMENT,texture:{}}]});const t=e.createPipelineLayout({bindGroupLayouts:[this.cameraBindGroupLayout,this.textureBindGroupLayout]}),n=e.createShaderModule({code:qn}),r=e.createShaderModule({code:Zn});this.checkShader("gbuffer.vert",n),this.checkShader("gbuffer.frag",r);const s={arrayStride:28,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"uint32"},{shaderLocation:2,offset:16,format:"float32x2"},{shaderLocation:3,offset:24,format:"float32"}]},o=[{format:qt},{format:Zt},{format:Kt}];this.gbufferPipeline=e.createRenderPipeline({layout:t,vertex:{module:n,entryPoint:"main",buffers:[s]},fragment:{module:r,entryPoint:"main",targets:o},primitive:{topology:"triangle-list",cullMode:"back",frontFace:"ccw"},depthStencil:{format:be,depthWriteEnabled:!0,depthCompare:"less"}}),this.gbufferVegetationPipeline=e.createRenderPipeline({layout:t,vertex:{module:n,entryPoint:"main",buffers:[s]},fragment:{module:r,entryPoint:"main",targets:o},primitive:{topology:"triangle-list",cullMode:"none",frontFace:"ccw"},depthStencil:{format:be,depthWriteEnabled:!0,depthCompare:"less"}}),this.cameraUniformBuffer=e.createBuffer({size:Ct,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.cameraBindGroup=e.createBindGroup({layout:this.cameraBindGroupLayout,entries:[{binding:0,resource:{buffer:this.cameraUniformBuffer}}]})}createLightingPass(){const e=this.ctx.device;this.sceneBindGroupLayout=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]}),this.gbufferReadBindGroupLayout=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:3,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"depth"}}]}),this.shadowReadBindGroupLayout=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"depth",viewDimension:"2d-array"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"comparison"}},{binding:3,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:4,visibility:GPUShaderStage.FRAGMENT,sampler:{}}]}),this.pointLightBindGroupLayout=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"read-only-storage"}}]});const t=e.createShaderModule({code:Kn});this.checkShader("lighting",t),this.lightingPipeline=e.createRenderPipeline({layout:e.createPipelineLayout({bindGroupLayouts:[this.sceneBindGroupLayout,this.gbufferReadBindGroupLayout,this.shadowReadBindGroupLayout,this.pointLightBindGroupLayout]}),vertex:{module:t,entryPoint:"vs_main"},fragment:{module:t,entryPoint:"fs_main",targets:[{format:te}]},primitive:{topology:"triangle-list"}}),this.sceneUniformBuffer=e.createBuffer({size:Bt,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.pointLightBuffer=e.createBuffer({size:Mt,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.sceneBindGroup=e.createBindGroup({layout:this.sceneBindGroupLayout,entries:[{binding:0,resource:{buffer:this.sceneUniformBuffer}}]}),this.pointLightBindGroup=e.createBindGroup({layout:this.pointLightBindGroupLayout,entries:[{binding:0,resource:{buffer:this.pointLightBuffer}}]})}createSkyPass(){const e=this.ctx.device;this.skyBindGroupLayout=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"depth"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:3,visibility:GPUShaderStage.FRAGMENT,sampler:{}}]});const t=e.createShaderModule({code:$n});this.checkShader("sky",t),this.skyPipeline=e.createRenderPipeline({layout:e.createPipelineLayout({bindGroupLayouts:[this.skyBindGroupLayout]}),vertex:{module:t,entryPoint:"vs_main"},fragment:{module:t,entryPoint:"fs_main",targets:[{format:te}]},primitive:{topology:"triangle-list"}})}createWaterPass(){const e=this.ctx.device;this.waterBindGroupLayout=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:3,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"depth"}},{binding:4,visibility:GPUShaderStage.FRAGMENT,sampler:{}}]});const t=e.createShaderModule({code:Qn}),n=e.createShaderModule({code:Jn});this.checkShader("water.vert",t),this.checkShader("water.frag",n),this.waterPipeline=e.createRenderPipeline({layout:e.createPipelineLayout({bindGroupLayouts:[this.waterBindGroupLayout]}),vertex:{module:t,entryPoint:"main",buffers:[{arrayStride:20,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x2"}]}]},fragment:{module:n,entryPoint:"main",targets:[{format:te,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha",operation:"add"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha",operation:"add"}}}]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:{format:be,depthWriteEnabled:!1,depthCompare:"less-equal"}}),this.waterVertUniformBuffer=e.createBuffer({size:Gt,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.waterFragUniformBuffer=e.createBuffer({size:At,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})}createWeatherPass(){const e=this.ctx.device;this.weatherBindGroupLayout=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]});const t=e.createShaderModule({code:er});this.checkShader("weather",t),this.weatherPipeline=e.createRenderPipeline({layout:e.createPipelineLayout({bindGroupLayouts:[this.weatherBindGroupLayout]}),vertex:{module:t,entryPoint:"vs_main"},fragment:{module:t,entryPoint:"fs_main",targets:[{format:te,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha",operation:"add"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha",operation:"add"}}}]},primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:{format:be,depthWriteEnabled:!1,depthCompare:"less-equal"}}),this.weatherUniformBuffer=e.createBuffer({size:Lt,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.weatherBindGroup=e.createBindGroup({layout:this.weatherBindGroupLayout,entries:[{binding:0,resource:{buffer:this.weatherUniformBuffer}}]})}setWeatherSystem(e){this.weatherSystem=e}updateBloomParams(){this.postProcess.updateBloomParams()}setAtlasTexture(e,t,n){this.atlasSampler||(this.atlasSampler=this.ctx.device.createSampler({magFilter:"nearest",minFilter:"nearest",mipmapFilter:"nearest",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"}));const r=n??this.createFlatNormalTexture();this.textureBindGroup=this.ctx.device.createBindGroup({layout:this.textureBindGroupLayout,entries:[{binding:0,resource:this.atlasSampler},{binding:1,resource:e.createView()},{binding:2,resource:t.createView()},{binding:3,resource:r.createView()}]}),this.shadowMap.setAtlasTexture(e,this.atlasSampler)}createFlatNormalTexture(){const e=this.ctx.device.createTexture({size:[1,1],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST}),t=new Uint8Array([128,128,255,255]);return this.ctx.device.queue.writeTexture({texture:e},t.buffer,{bytesPerRow:4},[1,1]),e}createClearCloudTexture(){const e=this.ctx.device.createTexture({size:[1,1],format:Ge,usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST}),t=new ArrayBuffer(8),n=new Uint16Array(t);n[0]=0,n[1]=0,n[2]=0,n[3]=15360,this.ctx.device.queue.writeTexture({texture:e},t,{bytesPerRow:8},[1,1]),this.clearCloudView=e.createView()}updateCamera(e,t,n,r,s,o,l){this.cachedDt=l,Ae(this.unjitteredViewProj,e);const a=T.data.rendering.taa.enabled,c=se();if(a){const[A,M]=this.taa.getJitter(this.ctx.canvas.width,this.ctx.canvas.height),R=sn(t);R[8]+=A,R[9]+=M,We(c,R,n)}else Ae(c,e);Ae(this.lastViewProj,c),Ae(this.lastProjection,t),ut(this.lastInvProjection,t);const u=this.camF32;u.set(c,0),u[16]=r[0],u[17]=r[1],u[18]=r[2],u[19]=0,u[20]=s,u[21]=o,u[22]=0,u[23]=0,u[24]=this.waterTime,u[25]=0,u[26]=0,u[27]=0,this.ctx.device.queue.writeBuffer(this.cameraUniformBuffer,0,u),ut(this.invVP,this.unjitteredViewProj);const d=this.dayNightCycle,f=this.sceneF32;f.set(this.invVP,0),f[16]=r[0],f[17]=r[1],f[18]=r[2],f[19]=T.data.terrain.height.seaLevel;const h=d.lightDir;f[20]=h[0],f[21]=h[1],f[22]=h[2],f[23]=this.waterTime,f[24]=d.sunColor[0],f[25]=d.sunColor[1],f[26]=d.sunColor[2],f[27]=d.sunIntensity,f[28]=d.ambientColor[0],f[29]=d.ambientColor[1],f[30]=d.ambientColor[2],f[31]=d.ambientGroundFactor,f[32]=s,f[33]=o;const m=T.data.environment.sky,v=Tt(m.starBrightness),g=Tt(m.nebulaIntensity),b=new ArrayBuffer(4);new Uint16Array(b)[0]=v,new Uint16Array(b)[1]=g,f[34]=new Float32Array(b)[0],f[35]=0,f[36]=0,f[37]=0,f[38]=0,f[39]=0,f.set(e,40);const P=T.data.rendering.contactShadows;f[56]=P.enabled?1:0,f[57]=P.maxSteps,f[58]=P.rayLength,f[59]=P.thickness,f[60]=d.moonPhase,f[61]=d.moonBrightness,f[62]=this.waterTime,f[63]=d.trueSunHeight,this.ctx.device.queue.writeBuffer(this.sceneUniformBuffer,0,f),this.shadowMap.updateLightMatrices(r,e,h),this.ssao.updateProjection(this.lastProjection,this.lastInvProjection),this.frameIndex++,this.postProcess.updateVolumetric(this.invVP,r,new Float32Array([h[0],h[1],h[2]]),new Float32Array([d.sunColor[0],d.sunColor[1],d.sunColor[2]]),d.sunIntensity,T.data.terrain.height.seaLevel,this.frameIndex),this.postProcess.updateSSR(this.unjitteredViewProj,this.invVP,r);const w=T.data.terrain.height.seaLevel;this.underwaterDepth=Math.max(w-r[1],0),this.waterTime+=l;const S=this.waterVertF32;S.set(c,0),S[16]=this.waterTime,S[17]=0,S[18]=0,S[19]=0,this.ctx.device.queue.writeBuffer(this.waterVertUniformBuffer,0,S);const x=this.waterFragF32;x[0]=r[0],x[1]=r[1],x[2]=r[2],x[3]=this.waterTime,x[4]=h[0],x[5]=h[1],x[6]=h[2],x[7]=d.sunIntensity,x[8]=d.sunColor[0],x[9]=d.sunColor[1],x[10]=d.sunColor[2],x[11]=T.data.camera.near;const B=this.computeAtmosphericFogColor(n);if(x[12]=B[0],x[13]=B[1],x[14]=B[2],x[15]=T.data.camera.far,x[16]=s,x[17]=o,x[18]=this.ctx.canvas.width,x[19]=this.ctx.canvas.height,x[20]=T.data.terrain.height.seaLevel,x[21]=0,x[22]=0,x[23]=0,x.set(this.unjitteredViewProj,24),x.set(this.invVP,40),this.ctx.device.queue.writeBuffer(this.waterFragUniformBuffer,0,x),this.weatherSystem&&this.weatherSystem.intensity>.001){const A=this.weatherF32;A.set(c,0),A[16]=r[0],A[17]=r[1],A[18]=r[2],A[19]=0,A[20]=this.waterTime,A[21]=this.weatherSystem.currentWeather,A[22]=this.weatherSystem.intensity,A[23]=0,this.ctx.device.queue.writeBuffer(this.weatherUniformBuffer,0,A)}a&&this.taa.updateUniforms(this.unjitteredViewProj);const C=T.data.environment.cloud;C.enabled&&(this.volumetricClouds.setDepthView(this.gBuffer.depthView),this.volumetricClouds.updateUniforms(this.invVP,r,h,d.trueSunHeight,d.sunColor,d.sunIntensity,this.waterTime,C.coverage,C.density,C.cloudBase,C.cloudHeight,C.windSpeed,C.detailStrength,C.multiScatterFloor,C.silverLining),this.volumetricClouds.updateTemporalUniforms(this.invVP))}updatePointLights(e){const t=this.pointLightF32,n=new Uint32Array(t.buffer);n[0]=e.length,n[1]=0,n[2]=0,n[3]=0;const r=4;for(let s=0;s<e.length;s++){const o=r+s*8,l=e[s];t[o+0]=l.position[0],t[o+1]=l.position[1],t[o+2]=l.position[2],t[o+3]=l.radius,t[o+4]=l.color[0],t[o+5]=l.color[1],t[o+6]=l.color[2],t[o+7]=l.intensity}this.ctx.device.queue.writeBuffer(this.pointLightBuffer,0,t.buffer,0,16+e.length*32)}render(e,t,n){const r=this.ctx,s=r.device.createCommandEncoder();this.shadowMap.renderShadowPass(s,e,n),this.renderGBufferPass(s,e,n),this.ssao.renderSSAO(s,this.gBuffer.depthView,this.gBuffer.normalView),this.ensureReadBindGroups(),this.ensureWaterBindGroup(),this.renderLightingPass(s),this.postProcess.renderSSR(s),T.data.environment.cloud.enabled&&this.volumetricClouds.render(s),this.renderSkyPass(s),t&&t.length>0&&(s.copyTextureToTexture({texture:this.postProcess.hdrTexture},{texture:this.postProcess.hdrOtherTexture},[this.ctx.canvas.width,this.ctx.canvas.height]),this.renderWaterPass(s,t)),this.postProcess.renderVolumetric(s),this.weatherSystem&&this.weatherSystem.intensity>.001&&this.renderWeatherPass(s),T.data.rendering.taa.enabled&&(this.taa.setResources(this.gBuffer.depthView,this.postProcess.getHdrView(0),this.postProcess.getHdrView(1)),this.taa.renderVelocity(s),this.taa.renderResolve(s,this.postProcess.hdrCurrentIndex),this.taa.copyResolvedToHDR(s,this.postProcess.hdrTexture),this.taa.swapHistory(),this.taa.storePrevViewProj(this.unjitteredViewProj)),this.volumetricClouds.storePrevViewProj(this.unjitteredViewProj),T.data.rendering.motionBlur.enabled&&T.data.rendering.taa.enabled&&this.postProcess.renderMotionBlur(s,this.taa.velocityView),T.data.rendering.dof.enabled&&this.postProcess.renderDoF(s,this.gBuffer.depthView),this.postProcess.renderAutoExposure(s,this.cachedDt);const o=r.context.getCurrentTexture().createView();this.postProcess.updateTimeOfDay(this.dayNightCycle.timeOfDay),this.postProcess.updateUnderwaterDepth(this.underwaterDepth),this.postProcess.renderBloomAndTonemap(s,o);const l=s.finish();r.device.queue.submit([l])}renderGBufferPass(e,t,n){const r=e.beginRenderPass({colorAttachments:[{view:this.gBuffer.albedoView,clearValue:{r:0,g:0,b:0,a:0},loadOp:"clear",storeOp:"store"},{view:this.gBuffer.normalView,clearValue:{r:.5,g:.5,b:.5,a:1},loadOp:"clear",storeOp:"store"},{view:this.gBuffer.materialView,clearValue:{r:.9,g:0,b:1,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:this.gBuffer.depthView,depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});r.setPipeline(this.gbufferPipeline),r.setBindGroup(0,this.cameraBindGroup),this.textureBindGroup&&r.setBindGroup(1,this.textureBindGroup);let s=null,o=null;for(const l of t)l.indexCount!==0&&(l.vertexBuffer!==s&&(r.setVertexBuffer(0,l.vertexBuffer),s=l.vertexBuffer),l.indexBuffer!==o&&(r.setIndexBuffer(l.indexBuffer,"uint32"),o=l.indexBuffer),r.drawIndexed(l.indexCount,1,l.firstIndex??0,l.baseVertex??0));if(n&&n.length>0){r.setPipeline(this.gbufferVegetationPipeline),r.setBindGroup(0,this.cameraBindGroup),this.textureBindGroup&&r.setBindGroup(1,this.textureBindGroup),s=null,o=null;for(const l of n)l.indexCount!==0&&(l.vertexBuffer!==s&&(r.setVertexBuffer(0,l.vertexBuffer),s=l.vertexBuffer),l.indexBuffer!==o&&(r.setIndexBuffer(l.indexBuffer,"uint32"),o=l.indexBuffer),r.drawIndexed(l.indexCount,1,l.firstIndex??0,l.baseVertex??0))}r.end()}ensureReadBindGroups(){this.bindGroupsDirty&&(this.bindGroupsDirty=!1,this.gbufferReadBindGroup=this.ctx.device.createBindGroup({layout:this.gbufferReadBindGroupLayout,entries:[{binding:0,resource:this.gBuffer.albedoView},{binding:1,resource:this.gBuffer.normalView},{binding:2,resource:this.gBuffer.materialView},{binding:3,resource:this.gBuffer.depthView}]}),this.shadowReadBindGroup=this.ctx.device.createBindGroup({layout:this.shadowReadBindGroupLayout,entries:[{binding:0,resource:{buffer:this.shadowMap.uniformBuffer}},{binding:1,resource:this.shadowMap.shadowTextureView},{binding:2,resource:this.shadowSampler},{binding:3,resource:this.ssao.blurredTextureView},{binding:4,resource:this.linearSampler}]}),this.postProcess.setVolumetricResources(this.gBuffer.depthView,this.shadowMap.uniformBuffer,this.shadowMap.shadowTextureView,this.shadowSampler),this.postProcess.setSSRResources(this.gBuffer.normalView,this.gBuffer.materialView,this.gBuffer.depthView))}ensureWaterBindGroup(){this.waterBindGroupDirty&&(this.waterBindGroupDirty=!1,this.waterBindGroups=[this.ctx.device.createBindGroup({layout:this.waterBindGroupLayout,entries:[{binding:0,resource:{buffer:this.waterVertUniformBuffer}},{binding:1,resource:{buffer:this.waterFragUniformBuffer}},{binding:2,resource:this.postProcess.getHdrView(1)},{binding:3,resource:this.gBuffer.depthView},{binding:4,resource:this.linearSampler}]}),this.ctx.device.createBindGroup({layout:this.waterBindGroupLayout,entries:[{binding:0,resource:{buffer:this.waterVertUniformBuffer}},{binding:1,resource:{buffer:this.waterFragUniformBuffer}},{binding:2,resource:this.postProcess.getHdrView(0)},{binding:3,resource:this.gBuffer.depthView},{binding:4,resource:this.linearSampler}]})])}initSkyBindGroups(){const e=this.skyBindGroupLayout,t=n=>this.ctx.device.createBindGroup({layout:e,entries:[{binding:0,resource:{buffer:this.sceneUniformBuffer}},{binding:1,resource:this.gBuffer.depthView},{binding:2,resource:n},{binding:3,resource:this.linearSampler}]});this.skyBindGroups={disabled:t(this.clearCloudView),enabled:[t(this.volumetricClouds.historyViews[0]),t(this.volumetricClouds.historyViews[1])]}}renderLightingPass(e){const t=e.beginRenderPass({colorAttachments:[{view:this.postProcess.hdrTextureView,clearValue:{r:0,g:0,b:0,a:1},loadOp:"clear",storeOp:"store"}]});t.setPipeline(this.lightingPipeline),t.setBindGroup(0,this.sceneBindGroup),t.setBindGroup(1,this.gbufferReadBindGroup),t.setBindGroup(2,this.shadowReadBindGroup),t.setBindGroup(3,this.pointLightBindGroup),t.draw(3),t.end()}renderSkyPass(e){const t=e.beginRenderPass({colorAttachments:[{view:this.postProcess.hdrTextureView,loadOp:"load",storeOp:"store"}]}),n=T.data.environment.cloud.enabled?this.skyBindGroups.enabled[this.volumetricClouds.resolvedHistoryIndex]:this.skyBindGroups.disabled;t.setPipeline(this.skyPipeline),t.setBindGroup(0,n),t.draw(3),t.end()}renderWaterPass(e,t){const n=e.beginRenderPass({colorAttachments:[{view:this.postProcess.hdrTextureView,loadOp:"load",storeOp:"store"}],depthStencilAttachment:{view:this.gBuffer.depthView,depthReadOnly:!0}});n.setPipeline(this.waterPipeline),n.setBindGroup(0,this.waterBindGroups[this.postProcess.hdrCurrentIndex]);for(const r of t)r.indexCount!==0&&(n.setVertexBuffer(0,r.vertexBuffer),n.setIndexBuffer(r.indexBuffer,"uint32"),n.drawIndexed(r.indexCount));n.end()}renderWeatherPass(e){const t=e.beginRenderPass({colorAttachments:[{view:this.postProcess.hdrTextureView,loadOp:"load",storeOp:"store"}],depthStencilAttachment:{view:this.gBuffer.depthView,depthReadOnly:!0}});t.setPipeline(this.weatherPipeline),t.setBindGroup(0,this.weatherBindGroup),t.draw(6,tr),t.end()}computeAtmosphericFogColor(e){const t=[-e[2],-e[6],-e[10]],n=Math.sqrt(t[0]*t[0]+t[1]*t[1]+t[2]*t[2]);n>0&&(t[0]/=n,t[1]/=n,t[2]/=n);const r=this.dayNightCycle,s=r.lightDir,o=r.trueSunHeight,l=t[0]*s[0]+t[1]*s[1]+t[2]*s[2],a=3/(16*Math.PI)*(1+l*l),c=.76,u=c*c,d=(1-u)/(4*Math.PI*Math.pow(1+u-2*c*l,1.5));let f=.6+.3*.8*a+1*.02*d,h=.75+.55*.8*a+.95*.02*d,m=.92+.95*.8*a+.85*.02*d;const g=(1-Math.min(1,Math.max(0,Math.abs(o)*3)))*Math.max(l,0)*.5;f+=1.2*g,h+=.5*g,m+=.15*g;const b=Math.min(1,Math.max(0,-o*4-.2)),P=r.ambientColor;return f=f*(1-b)+P[0]*.2*b,h=h*(1-b)+P[1]*.2*b,m=m*(1-b)+P[2]*.2*b,[f,h,m]}handleResize(){this.gBuffer.resize(),this.ssao.resize(),this.postProcess.resize(),this.taa.resize(),this.volumetricClouds.resize(),this.bindGroupsDirty=!0,this.waterBindGroupDirty=!0,this.gbufferReadBindGroup=null,this.shadowReadBindGroup=null,this.initSkyBindGroups()}}var p=(i=>(i[i.AIR=0]="AIR",i[i.STONE=1]="STONE",i[i.DIRT=2]="DIRT",i[i.GRASS_BLOCK=3]="GRASS_BLOCK",i[i.BEDROCK=4]="BEDROCK",i[i.SAND=10]="SAND",i[i.SANDSTONE=11]="SANDSTONE",i[i.GRAVEL=12]="GRAVEL",i[i.CLAY=13]="CLAY",i[i.WATER=20]="WATER",i[i.LAVA=21]="LAVA",i[i.FLOWING_WATER=22]="FLOWING_WATER",i[i.SNOW=30]="SNOW",i[i.ICE=31]="ICE",i[i.COAL_ORE=40]="COAL_ORE",i[i.IRON_ORE=41]="IRON_ORE",i[i.GOLD_ORE=42]="GOLD_ORE",i[i.DIAMOND_ORE=43]="DIAMOND_ORE",i[i.LOG=50]="LOG",i[i.LEAVES=51]="LEAVES",i[i.COBBLESTONE=60]="COBBLESTONE",i[i.MOSSY_COBBLESTONE=61]="MOSSY_COBBLESTONE",i[i.SPAWNER=70]="SPAWNER",i[i.CHEST=71]="CHEST",i[i.TALL_GRASS=80]="TALL_GRASS",i[i.POPPY=81]="POPPY",i[i.DANDELION=82]="DANDELION",i[i.PLANKS=90]="PLANKS",i[i.STONE_BRICKS=91]="STONE_BRICKS",i[i.GLASS=92]="GLASS",i[i.TORCH=93]="TORCH",i))(p||{});const je=new Map;function H(i,e,t,n,r,s=255,o=.9,l=0,a=0){je.set(i,{isSolid:e,color:[t,n,r,s],roughness:o,metallic:l,emissive:a})}H(0,!1,0,0,0,0);H(1,!0,128,128,128,255,.85,0,0);H(2,!0,139,90,43,255,.95,0,0);H(3,!0,86,168,57,255,.9,0,0);H(4,!0,48,48,48,255,.95,0,0);H(10,!0,219,207,163,255,.95,0,0);H(11,!0,216,201,149,255,.85,0,0);H(12,!0,136,126,126,255,.9,0,0);H(13,!0,160,166,179,255,.8,0,0);H(20,!1,32,64,200,255,.1,0,0);H(21,!0,207,92,15,255,.9,0,1);H(22,!1,48,90,215,255,.1,0,0);H(30,!0,249,255,254,255,.85,0,0);H(31,!0,145,183,253,255,.15,0,0);H(40,!0,64,64,64,255,.85,0,0);H(41,!0,175,140,120,255,.65,.3,0);H(42,!0,247,229,103,255,.5,.7,0);H(43,!0,92,219,213,255,.2,.1,.15);H(50,!0,102,81,51,255,.9,0,0);H(51,!0,36,100,18,255,.85,0,0);H(60,!0,100,100,100,255,.9,0,0);H(61,!0,90,108,90,255,.88,0,0);H(70,!0,27,42,53,255,.6,.5,.1);H(71,!0,164,114,39,255,.8,0,0);H(80,!1,58,148,40,255,.95,0,0);H(81,!1,200,30,30,255,.9,0,0);H(82,!1,240,210,40,255,.9,0,0);H(90,!0,180,144,90,255,.85,0,0);H(91,!0,120,120,120,255,.8,0,0);H(92,!0,180,220,240,255,.1,0,0);H(93,!1,255,200,80,255,.7,0,.85);var ne=(i=>(i[i.FLOOR=0]="FLOOR",i[i.NORTH=1]="NORTH",i[i.SOUTH=2]="SOUTH",i[i.EAST=3]="EAST",i[i.WEST=4]="WEST",i))(ne||{});function Xe(i){return i===93}function $e(i){return je.get(i)??je.get(0)}function Ue(i){return $e(i).isSolid}function rr(i){return i===0}function ir(i){return $e(i).color}function sr(i){const e=$e(i);return{roughness:e.roughness,metallic:e.metallic,emissive:e.emissive}}function qe(i){return i===20||i===22}function He(i){return i===51||i===80||i===81||i===82||i===93}function Ze(i){return i===80||i===81||i===82}const it=Array.from(je.keys()).filter(i=>i!==0);function y(i,e,t){let n=t+i*374761393+e*668265263|0;return n=Math.imul(n^n>>>13,1274126177),((n^n>>>16)>>>0)/4294967296}function E(i,e,t){return i<e?e:i>t?t:i}function z(i,e,t,n){return n>0?[E(Math.round(i+(255-i)*n),0,255),E(Math.round(e+(255-e)*n),0,255),E(Math.round(t+(255-t)*n),0,255)]:[E(Math.round(i*(1+n)),0,255),E(Math.round(e*(1+n)),0,255),E(Math.round(t*(1+n)),0,255)]}function or(i,e,t,n,r){const s=y(i,e,1),o=y(i,e,2);let l=(s-.5)*.25;return o<.08?l=-.15:o>.92&&(l=.1),z(t,n,r,l)}function ar(i,e,t,n,r){const s=y(i,e,10),o=y(i,e,11);let l=(s-.5)*.2;if(o<.06)return z(160,150,140,(s-.5)*.1);const a=(o-.5)*8;return z(E(t+a,0,255),n,r,l)}function lr(i,e,t,n,r){const s=y(i,e,20),o=y(i,e,21);let l=(s-.5)*.18;return i%3===0&&o>.4&&(l+=.08),i%5===2&&o<.6&&(l-=.06),o>.93?z(t+15,n+10,r-5,l):z(t,n,r,l)}function cr(i,e,t,n,r){const s=y(i,e,30),o=y(i,e,31);let l=(s-.5)*.1;return o<.05&&(l-=.08),o>.95&&(l+=.06),z(t,n,r,l)}function ur(i,e,t,n,r){const s=y(i,e,40),o=e%4;let l=0;return o===0?l=-.08:o===1?l=.04:o===2?l=-.03:l=.06,l+=(s-.5)*.08,z(t,n,r,l)}function dr(i,e,t,n,r){const s=y(i,e,50),o=7.5,l=7.5,a=i-o,c=e-l,u=Math.sqrt(a*a+c*c);let f=Math.sin(u*1.8)*.12+(s-.5)*.1;return(i===0||i===15||i===1||i===14)&&(f-=.12),z(t,n,r,f)}function fr(i,e,t,n,r){const s=y(i,e,60),o=y(i,e,61);let l=(s-.5)*.3;return o<.15&&(l=-.2),o>.85&&(l=.15),z(t,n,r,l)}function hr(i,e,t,n,r){const s=y(i,e,70),l=Math.sin((i+e*.5)*.8)*.08+(s-.5)*.06;return z(t,n,r,l)}function pr(i,e,t,n,r){const s=y(i,e,80),o=y(i,e,81);let l=(s-.5)*.05;return o>.92&&(l=.04),o<.05&&(l=-.03),z(t,n,r,l)}function mr(i,e,t,n,r){const s=y(i,e,90),o=y(i,e,91);let l=(s-.5)*.08;const a=Math.abs((i-e)%7),c=Math.abs((i+e-10)%9);return a===0&&o>.5&&(l=-.15),c===0&&o<.4&&(l=-.12),z(t,n,r,l)}function Ne(i,e,t,n,r,s,o,l,a,c,u){const d=y(i,e,100),f=y(i,e,101),h=y(i,e,102);let m=a,v=c,g=u;const b=(d-.5)*.2;[m,v,g]=z(m,v,g,b);const P=4+y(0,0,t)*5,w=4+y(0,0,n)*5,S=9+y(1,1,t)*4,x=9+y(1,1,n)*4,B=Math.abs(i-P)+Math.abs(e-w),C=Math.abs(i-S)+Math.abs(e-x);if(B<2.5&&f>.3||C<2.5&&h>.3||f<.06){const A=(h-.5)*.15;return z(s,o,l,A)}return[m,v,g]}function gr(i,e,t,n,r){const s=y(i,e,110),o=y(i,e,111),l=(i+Math.floor(y(0,e,112)*3))%5,a=(e+Math.floor(y(i,0,113)*3))%4;let c=(s-.5)*.25;return(l===0||a===0)&&(c-=.18),o>.88&&(c+=.1),z(t,n,r,c)}function vr(i,e,t,n,r){const s=y(i,e,120),o=y(i,e,121);let l=(s-.5)*.3;return o<.2&&(l=-.25),o>.9&&(l=.1),z(t,n,r,l)}function xr(i,e,t,n,r){const s=y(i,e,130),o=y(i,e,131);let l=(s-.5)*.3;const a=y(Math.floor(i/3),Math.floor(e/3),132);return l+=(a-.5)*.15,o>.9?z(t+10,n-5,r-10,l):z(t,n,r,l)}function yr(i,e,t,n,r){const s=y(i,e,140),o=y(i,e,141),l=i+(s-.5)*2,a=e+(o-.5)*2,c=Math.abs(Math.sin(l*1.2+a*.7)),u=Math.abs(Math.sin(l*.5-a*1.5)),d=Math.min(c,u);if(d<.3){const f=1-d/.3;return[E(Math.round(255*(.8+f*.2)),0,255),E(Math.round(120*f),0,255),E(Math.round(20*f),0,255)]}return z(t,n,r,-.35+(s-.5)*.1)}function br(i,e,t,n,r){const s=y(i,e,150),l=Math.sin(e*.9)*.06+(s-.5)*.08;return z(t,n,r,l)}function wr(i,e,t,n,r){const s=y(i,e,160),o=y(i,e,161),l=(i+Math.floor(y(0,e,162)*3))%5,a=(e+Math.floor(y(i,0,163)*3))%4;let c=(s-.5)*.22;if((l===0||a===0)&&(c-=.15),o>.6&&e>8){const u=E(t-20,0,255),d=E(n+15,0,255),f=E(r-15,0,255);return z(u,d,f,c)}return z(t,n,r,c)}function Sr(i,e,t,n,r){const s=y(i,e,170);y(i,e,171);let o=(s-.5)*.15;return(i%4===0||e%4===0)&&(o+=.12),i>2&&i<13&&e>2&&e<13&&i%4!==0&&e%4!==0&&(o-=.15),z(t,n,r,o)}function Pr(i,e,t,n,r){let o=(y(i,e,180)-.5)*.12;return e%4===0&&(o-=.12),(i===0||i===15||e===0||e===15)&&(o-=.18),i>=6&&i<=9&&e>=6&&e<=8?z(180,160,60,o):z(t,n,r,o)}function Rt(i,e){const t=[{cx:3,w:1.5},{cx:6,w:1.2},{cx:8,w:1.8},{cx:11,w:1.3},{cx:13,w:1}],n=y(i,e,500),r=15-e;for(const s of t){const o=s.w*(1-r/18);if(Math.abs(i-s.cx)<o){const l=.6+.4*(r/15),a=E(Math.round(45*l+n*15),0,255),c=E(Math.round(140*l+n*20),0,255),u=E(Math.round(30*l+n*10),0,255);return[a,c,u,255]}}return[0,0,0,0]}function Et(i,e){const t=y(i,e,510),n=15-e;if(n<10&&Math.abs(i-8)<1)return[30,E(Math.round(100+t*40),0,255),20,255];const r=i-8,s=n-12,o=Math.sqrt(r*r+s*s);if(o<3.5){const l=E(Math.round(200+t*40),0,255),a=E(Math.round(20+t*15),0,255),c=E(Math.round(20+t*10),0,255);return o<1.2?[E(Math.round(230+t*20),0,255),E(Math.round(200+t*20),0,255),40,255]:[l,a,c,255]}return[0,0,0,0]}function Ft(i,e){const t=y(i,e,520),n=15-e;if(n<10&&Math.abs(i-8)<1)return[35,E(Math.round(110+t*30),0,255),25,255];const r=i-8,s=n-12;if(Math.sqrt(r*r+s*s)<2.8){const l=E(Math.round(240+t*15),0,255),a=E(Math.round(200+t*20),0,255),c=E(Math.round(30+t*15),0,255);return[l,a,c,255]}return[0,0,0,0]}function Tr(i,e,t,n,r){const s=y(i,e,190),o=Math.floor(e/4),l=o%2*5,a=(i+l)%16;let c=(s-.5)*.15;e%4===0&&(c-=.18),(a===0||a===8)&&(c-=.12);const u=o*7+Math.floor(a/8),d=y(i,u,191);return c+=(d-.5)*.08,z(t,n,r,c)}function Br(i,e,t,n,r){const s=y(i,e,195),l=Math.floor(e/4)%2*4,a=(i+l)%8,c=e%4;let u=(s-.5)*.18;(c===0||a===0)&&(u-=.2);const d=y(i,e,196);return d>.9&&(u-=.1),d<.08&&(u+=.08),z(t,n,r,u)}function Cr(i,e,t,n,r){let o=(y(i,e,200)-.5)*.05;return Math.abs(i-e)<=1&&(o+=.12),i===0||i===15||e===0||e===15?z(140,160,170,o-.1):z(t,n,r,o)}function Dt(i,e){const t=y(i,e,205),n=15-e;if(n<10&&Math.abs(i-7.5)<1.2){const u=(t-.5)*.12,[d,f,h]=z(102,81,51,u);return[d,f,h,255]}const s=7.5,o=12.5,l=(i-s)/2.5,a=(n-o)/3,c=Math.sqrt(l*l+a*a);if(c<1&&n>=9){const u=1-c,d=(t-.5)*.15,f=E(Math.round(255*(.85+u*.15)),0,255),h=E(Math.round(200*(.7+u*.3)+t*20),0,255),m=E(Math.round(60*(.5+u*.3)),0,255),[v,g,b]=z(f,h,m,d);return[v,g,b,255]}return[0,0,0,0]}function Gr(i,e,t,n,r){const o=(y(i,e,999)-.5)*.15;return z(t,n,r,o)}function Ar(i){const e=Array.from({length:G},()=>new Array(G).fill(0));switch(i){case p.STONE:{for(let t=0;t<G;t++)for(let n=0;n<G;n++){const r=y(n,t,301),s=y(n,t,302);e[t][n]=r*.6+(s>.92?-.3:s<.08?.3:0)}break}case p.COBBLESTONE:{for(let t=0;t<G;t++)for(let n=0;n<G;n++){const r=(n+Math.floor(y(0,t,312)*3))%5,s=(t+Math.floor(y(n,0,313)*3))%4,o=y(n,t,310);e[t][n]=r===0||s===0?0:.4+o*.4}break}case p.MOSSY_COBBLESTONE:{for(let t=0;t<G;t++)for(let n=0;n<G;n++){const r=(n+Math.floor(y(0,t,362)*3))%5,s=(t+Math.floor(y(n,0,363)*3))%4,o=y(n,t,360),l=r===0||s===0?0:.35+o*.35;e[t][n]=t>8&&y(n,t,361)>.5?l*.7:l}break}case p.DIRT:{for(let t=0;t<G;t++)for(let n=0;n<G;n++)e[t][n]=y(n,t,320)*.25;break}case p.GRASS_BLOCK:{for(let t=0;t<G;t++)for(let n=0;n<G;n++){const r=y(n,t,325);e[t][n]=(n%3===0?.15:0)+r*.2}break}case p.SAND:{for(let t=0;t<G;t++)for(let n=0;n<G;n++)e[t][n]=y(n,t,330)*.12;break}case p.SANDSTONE:{for(let t=0;t<G;t++)for(let n=0;n<G;n++){const r=t%4,s=r===0?0:r===2?.3:.15;e[t][n]=s+y(n,t,340)*.1}break}case p.LOG:{for(let t=0;t<G;t++)for(let n=0;n<G;n++){const o=n-7.5,l=t-7.5,a=Math.sqrt(o*o+l*l),c=(Math.sin(a*1.8)*.5+.5)*.3,u=n===0||n===15||n===1||n===14?-.15:0;e[t][n]=c+u+y(n,t,350)*.08}break}case p.BEDROCK:{for(let t=0;t<G;t++)for(let n=0;n<G;n++){const r=y(n,t,370),s=y(n,t,371);e[t][n]=r*.7+(s<.2?-.3:0)}break}case p.GRAVEL:{for(let t=0;t<G;t++)for(let n=0;n<G;n++){const r=y(Math.floor(n/3),Math.floor(t/3),380);e[t][n]=r*.5+y(n,t,381)*.15}break}case p.CLAY:{for(let t=0;t<G;t++)for(let n=0;n<G;n++)e[t][n]=(Math.sin(t*.9)*.5+.5)*.15+y(n,t,385)*.05;break}case p.SNOW:{for(let t=0;t<G;t++)for(let n=0;n<G;n++)e[t][n]=y(n,t,390)*.06;break}case p.ICE:{for(let t=0;t<G;t++)for(let n=0;n<G;n++){const r=Math.abs((n-t)%7),s=Math.abs((n+t-10)%9),o=r===0||s===0?1:0;e[t][n]=o*-.2+y(n,t,395)*.05}break}case p.LEAVES:{for(let t=0;t<G;t++)for(let n=0;n<G;n++){const r=y(n,t,400);e[t][n]=r*.35}break}case p.LAVA:{for(let t=0;t<G;t++)for(let n=0;n<G;n++){const r=y(n,t,140),s=y(n,t,141),o=n+(r-.5)*2,l=t+(s-.5)*2,a=Math.abs(Math.sin(o*1.2+l*.7)),c=Math.abs(Math.sin(o*.5-l*1.5));e[t][n]=Math.min(a,c)<.3?0:.4+y(n,t,405)*.2}break}case p.COAL_ORE:case p.IRON_ORE:case p.GOLD_ORE:case p.DIAMOND_ORE:{for(let t=0;t<G;t++)for(let n=0;n<G;n++){const r=y(n,t,301),s=y(n,t,101),o=4+y(0,0,i+200)*5,l=4+y(0,0,i+210)*5,a=9+y(1,1,i+200)*4,c=9+y(1,1,i+210)*4,u=Math.abs(n-o)+Math.abs(t-l),d=Math.abs(n-a)+Math.abs(t-c),f=u<2.5&&s>.3||d<2.5&&y(n,t,102)>.3;e[t][n]=f?.15+y(n,t,410)*.1:.3+r*.3}break}case p.SPAWNER:{for(let t=0;t<G;t++)for(let n=0;n<G;n++)e[t][n]=n%4===0||t%4===0?.5:.1;break}case p.CHEST:{for(let t=0;t<G;t++)for(let n=0;n<G;n++){const r=n===0||n===15||t===0||t===15,s=t%4===0,o=n>=6&&n<=9&&t>=6&&t<=8;e[t][n]=o?.6:r?.1:s?.15:.35+y(n,t,420)*.1}break}case p.PLANKS:{for(let t=0;t<G;t++)for(let n=0;n<G;n++){const s=Math.floor(t/4)%2*5,o=(n+s)%16,l=t%4===0||o===0||o===8;e[t][n]=l?0:.3+y(n,t,440)*.15}break}case p.STONE_BRICKS:{for(let t=0;t<G;t++)for(let n=0;n<G;n++){const s=Math.floor(t/4)%2*4,o=(n+s)%8,a=t%4===0||o===0;e[t][n]=a?0:.35+y(n,t,445)*.2}break}case p.GLASS:{for(let t=0;t<G;t++)for(let n=0;n<G;n++){const r=Math.abs(n-t);e[t][n]=(r<=1?.05:0)+y(n,t,450)*.02}break}case p.TORCH:{for(let t=0;t<G;t++)for(let n=0;n<G;n++){const r=n-7.5,s=t-7.5,o=Math.sqrt(r*r+s*s);e[t][n]=o<4?.2+y(n,t,455)*.1:y(n,t,456)*.05}break}case p.TALL_GRASS:case p.POPPY:case p.DANDELION:{for(let t=0;t<G;t++)for(let n=0;n<G;n++)e[t][n]=y(n,t,430)*.05;break}default:{for(let t=0;t<G;t++)for(let n=0;n<G;n++)e[t][n]=y(n,t,499)*.15;break}}return e}function Lr(i){switch(i){case p.STONE:return 1.5;case p.COBBLESTONE:return 2;case p.MOSSY_COBBLESTONE:return 1.8;case p.DIRT:return .8;case p.GRASS_BLOCK:return .7;case p.SAND:return .4;case p.SANDSTONE:return 1.2;case p.LOG:return 1;case p.BEDROCK:return 2.5;case p.GRAVEL:return 1.5;case p.CLAY:return .5;case p.SNOW:return .2;case p.ICE:return .6;case p.LEAVES:return 1;case p.LAVA:return 1.2;case p.COAL_ORE:case p.IRON_ORE:case p.GOLD_ORE:case p.DIAMOND_ORE:return 1.3;case p.SPAWNER:return 1.5;case p.CHEST:return 1;case p.PLANKS:return .8;case p.STONE_BRICKS:return 1.5;case p.GLASS:return .1;case p.TORCH:return .3;case p.TALL_GRASS:case p.POPPY:case p.DANDELION:return .1;default:return .5}}function Mr(i,e,t,n){const r=i[t][(e-1+G)%G],s=i[t][(e+1)%G],o=i[(t-1+G)%G][e],l=i[(t+1)%G][e],a=(r-s)*n,c=(o-l)*n,u=1,d=Math.sqrt(a*a+c*c+u*u);return[a/d,c/d,u/d]}class Rr{gpuTexture;gpuMaterialTexture;gpuNormalTexture;constructor(e){const t=this.generateAtlasPixels();this.gpuTexture=this.uploadTexture(e,t);const n=this.generateMaterialPixels();this.gpuMaterialTexture=this.uploadTexture(e,n);const r=this.generateNormalPixels();this.gpuNormalTexture=this.uploadTexture(e,r)}get texture(){return this.gpuTexture}get materialTexture(){return this.gpuMaterialTexture}get normalTexture(){return this.gpuNormalTexture}generateAtlasPixels(){const e=re*re*4,t=new Uint8Array(e);for(const n of it){const r=n;if(r>=$*$)continue;const s=r%$,o=Math.floor(r/$),[l,a,c,u]=ir(n),d=s*G,f=o*G;for(let h=0;h<G;h++)for(let m=0;m<G;m++){const v=((f+h)*re+(d+m))*4;if(n===p.TORCH){const g=Dt(m,h);t[v+0]=g[0],t[v+1]=g[1],t[v+2]=g[2],t[v+3]=g[3];continue}if(Ze(n)){let g;n===p.TALL_GRASS?g=Rt(m,h):n===p.POPPY?g=Et(m,h):g=Ft(m,h),t[v+0]=g[0],t[v+1]=g[1],t[v+2]=g[2],t[v+3]=g[3]}else if(n===p.LEAVES){const[g,b,P]=this.getBlockPattern(n,m,h,l,a,c);t[v+0]=g,t[v+1]=b,t[v+2]=P;const w=y(m,h,61);t[v+3]=w<.2?0:255}else{const[g,b,P]=this.getBlockPattern(n,m,h,l,a,c);t[v+0]=g,t[v+1]=b,t[v+2]=P,t[v+3]=u}}}return t}getBlockPattern(e,t,n,r,s,o){switch(e){case p.STONE:return or(t,n,r,s,o);case p.DIRT:return ar(t,n,r,s,o);case p.GRASS_BLOCK:return lr(t,n,r,s,o);case p.BEDROCK:return vr(t,n,r,s,o);case p.SAND:return cr(t,n,r,s,o);case p.SANDSTONE:return ur(t,n,r,s,o);case p.GRAVEL:return xr(t,n,r,s,o);case p.CLAY:return br(t,n,r,s,o);case p.WATER:case p.FLOWING_WATER:return hr(t,n,r,s,o);case p.LAVA:return yr(t,n,r,s,o);case p.SNOW:return pr(t,n,r,s,o);case p.ICE:return mr(t,n,r,s,o);case p.COAL_ORE:return Ne(t,n,r,s,o,30,30,30,128,128,128);case p.IRON_ORE:return Ne(t,n,r,s,o,200,170,145,128,128,128);case p.GOLD_ORE:return Ne(t,n,r,s,o,255,215,80,128,128,128);case p.DIAMOND_ORE:return Ne(t,n,r,s,o,80,230,230,128,128,128);case p.LOG:return dr(t,n,r,s,o);case p.LEAVES:return fr(t,n,r,s,o);case p.COBBLESTONE:return gr(t,n,r,s,o);case p.MOSSY_COBBLESTONE:return wr(t,n,r,s,o);case p.SPAWNER:return Sr(t,n,r,s,o);case p.CHEST:return Pr(t,n,r,s,o);case p.PLANKS:return Tr(t,n,r,s,o);case p.STONE_BRICKS:return Br(t,n,r,s,o);case p.GLASS:return Cr(t,n,r,s,o);case p.TORCH:{const[l,a,c]=Dt(t,n);return[l,a,c]}case p.TALL_GRASS:{const[l,a,c]=Rt(t,n);return[l,a,c]}case p.POPPY:{const[l,a,c]=Et(t,n);return[l,a,c]}case p.DANDELION:{const[l,a,c]=Ft(t,n);return[l,a,c]}default:return Gr(t,n,r,s,o)}}generateMaterialPixels(){const e=re*re*4,t=new Uint8Array(e);for(const n of it){const r=n;if(r>=$*$)continue;const s=r%$,o=Math.floor(r/$),l=sr(n),a=s*G,c=o*G,u=Math.round(l.roughness*255),d=Math.round(l.metallic*255),f=Math.round(l.emissive*255);for(let h=0;h<G;h++)for(let m=0;m<G;m++){const[v,g,b]=this.getMaterialPattern(n,m,h,u,d,f),P=((c+h)*re+(a+m))*4;t[P+0]=v,t[P+1]=g,t[P+2]=b,t[P+3]=255}}return t}getMaterialPattern(e,t,n,r,s,o){const a=(y(t,n,200+e)-.5)*20;switch(e){case p.LAVA:{const c=t+(y(t,n,140)-.5)*2,u=n+(y(t,n,141)-.5)*2,d=Math.abs(Math.sin(c*1.2+u*.7)),f=Math.abs(Math.sin(c*.5-u*1.5)),m=Math.min(d,f)<.3?255:E(Math.round(o*.4+a),0,255);return[E(Math.round(r+a),0,255),s,m]}case p.DIAMOND_ORE:{const c=y(t,n,101),u=4+y(0,0,92)*5,d=4+y(0,0,219)*5,f=9+y(1,1,92)*4,h=9+y(1,1,219)*4,m=Math.abs(t-u)+Math.abs(n-d),v=Math.abs(t-f)+Math.abs(n-h);return m<2.5&&c>.3||v<2.5&&y(t,n,102)>.3?[E(Math.round(50+a),0,255),E(Math.round(30+a),0,255),E(Math.round(40+a),0,255)]:[E(Math.round(r+a),0,255),s,o]}case p.GOLD_ORE:{const c=y(t,n,101),u=4+y(0,0,247)*5,d=4+y(0,0,229)*5,f=9+y(1,1,247)*4,h=9+y(1,1,229)*4,m=Math.abs(t-u)+Math.abs(n-d),v=Math.abs(t-f)+Math.abs(n-h);return m<2.5&&c>.3||v<2.5&&y(t,n,102)>.3?[E(Math.round(100+a),0,255),E(Math.round(180+a),0,255),0]:[E(Math.round(r+a),0,255),s,o]}case p.IRON_ORE:{const c=y(t,n,101),u=4+y(0,0,175)*5,d=4+y(0,0,140)*5,f=9+y(1,1,175)*4,h=9+y(1,1,140)*4,m=Math.abs(t-u)+Math.abs(n-d),v=Math.abs(t-f)+Math.abs(n-h);return m<2.5&&c>.3||v<2.5&&y(t,n,102)>.3?[E(Math.round(140+a),0,255),E(Math.round(80+a),0,255),0]:[E(Math.round(r+a),0,255),s,o]}case p.ICE:{const c=Math.abs((t-n)%7),u=Math.abs((t+n-10)%9),d=y(t,n,91);return c===0&&d>.5||u===0&&d<.4?[E(Math.round(r+60),0,255),s,o]:[E(Math.round(r+a),0,255),s,o]}case p.WATER:case p.FLOWING_WATER:{const c=Math.sin((t+n*.5)*.8)*10;return[E(Math.round(r+c),0,255),s,o]}case p.TORCH:{const c=t-7.5,u=n-7.5;if(Math.sqrt(c*c+u*u)<4&&n<=10){const f=y(t,n,207),h=E(Math.round(200+f*55),0,255);return[E(Math.round(r+a),0,255),s,h]}return n>8?[E(Math.round(230+a),0,255),s,0]:[E(Math.round(r+a),0,255),s,o]}case p.SPAWNER:return t%4===0||n%4===0?[E(Math.round(r-30),0,255),E(Math.round(s+60),0,255),E(Math.round(o+10+a),0,255)]:[E(Math.round(r+a),0,255),s,o];default:return[E(Math.round(r+a),0,255),s,o]}}generateNormalPixels(){const e=re*re*4,t=new Uint8Array(e);for(let n=0;n<e;n+=4)t[n+0]=128,t[n+1]=128,t[n+2]=255,t[n+3]=255;for(const n of it){const r=n;if(r>=$*$)continue;const s=r%$,o=Math.floor(r/$),l=s*G,a=o*G,c=Ar(n),u=Lr(n);for(let d=0;d<G;d++)for(let f=0;f<G;f++){const[h,m,v]=Mr(c,f,d,u),g=((a+d)*re+(l+f))*4;t[g+0]=E(Math.round((h*.5+.5)*255),0,255),t[g+1]=E(Math.round((m*.5+.5)*255),0,255),t[g+2]=E(Math.round((v*.5+.5)*255),0,255),t[g+3]=255}}return t}uploadTexture(e,t){const n=e.device.createTexture({size:[re,re],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});return e.device.queue.writeTexture({texture:n},t.buffer,{bytesPerRow:re*4,rowsPerImage:re},[re,re]),n}}class Er{position;yaw=-Math.PI/2;pitch=-.3;keys=new Set;rightMouseDown=!1;canvas;projection=se();view=se();viewProj=se();onKeyDown;onKeyUp;onMouseDown;onMouseUp;onContextMenu;onMouseMove;onWheel;constructor(e,t=he(128,90,128)){this.canvas=e,this.position=an(t),this.onKeyDown=n=>{this.keys.add(n.code)},this.onKeyUp=n=>{this.keys.delete(n.code)},this.onMouseDown=n=>{n.button===2&&(this.rightMouseDown=!0,e.requestPointerLock())},this.onMouseUp=n=>{n.button===2&&(this.rightMouseDown=!1,document.exitPointerLock())},this.onContextMenu=n=>n.preventDefault(),this.onMouseMove=n=>{this.rightMouseDown&&(this.yaw+=n.movementX*T.data.camera.mouseSensitivity,this.pitch-=n.movementY*T.data.camera.mouseSensitivity,this.pitch=Math.max(-Math.PI/2+.01,Math.min(Math.PI/2-.01,this.pitch)))},this.onWheel=n=>{n.preventDefault();let r=T.data.camera.speed;r*=n.deltaY<0?1.2:1/1.2,r=Math.max(1,Math.min(200,r)),T.set("camera.speed",r)},document.addEventListener("keydown",this.onKeyDown),document.addEventListener("keyup",this.onKeyUp),e.addEventListener("mousedown",this.onMouseDown),document.addEventListener("mouseup",this.onMouseUp),e.addEventListener("contextmenu",this.onContextMenu),document.addEventListener("mousemove",this.onMouseMove),e.addEventListener("wheel",this.onWheel,{passive:!1})}destroy(){document.removeEventListener("keydown",this.onKeyDown),document.removeEventListener("keyup",this.onKeyUp),this.canvas.removeEventListener("mousedown",this.onMouseDown),document.removeEventListener("mouseup",this.onMouseUp),this.canvas.removeEventListener("contextmenu",this.onContextMenu),document.removeEventListener("mousemove",this.onMouseMove),this.canvas.removeEventListener("wheel",this.onWheel),this.keys.clear()}update(e){const t=he(Math.cos(this.pitch)*Math.cos(this.yaw),Math.sin(this.pitch),Math.cos(this.pitch)*Math.sin(this.yaw));Ye(t,t);const n=we();dn(n,t,[0,1,0]),Ye(n,n);const r=we(),o=(this.keys.has("ShiftLeft")||this.keys.has("ShiftRight")?T.data.camera.fastSpeed:T.data.camera.speed)*e;this.keys.has("KeyW")&&Me(r,r,t,o),this.keys.has("KeyS")&&Me(r,r,t,-o),this.keys.has("KeyA")&&Me(r,r,n,-o),this.keys.has("KeyD")&&Me(r,r,n,o),(this.keys.has("KeyE")||this.keys.has("Space"))&&(r[1]+=o),(this.keys.has("KeyQ")||this.keys.has("KeyC"))&&(r[1]-=o),cn(this.position,this.position,r)}getViewProjection(e){const t=he(this.position[0]+Math.cos(this.pitch)*Math.cos(this.yaw),this.position[1]+Math.sin(this.pitch),this.position[2]+Math.cos(this.pitch)*Math.sin(this.yaw));return Xt(this.view,this.position,t,[0,1,0]),Fr(this.projection,T.data.camera.fov,e,T.data.camera.near,T.data.camera.far),We(this.viewProj,this.projection,this.view),this.viewProj}getProjection(){return this.projection}getView(){return this.view}getSpeed(){return T.data.camera.speed}}function Fr(i,e,t,n,r){const s=1/Math.tan(e/2);return i[0]=s/t,i[1]=0,i[2]=0,i[3]=0,i[4]=0,i[5]=s,i[6]=0,i[7]=0,i[8]=0,i[9]=0,i[10]=r/(n-r),i[11]=-1,i[12]=0,i[13]=0,i[14]=n*r/(n-r),i[15]=0,i}const V=4,J=D/V,ce=_/V,Re=I/V,ke=J*ce*Re;class oe{chunkX;chunkZ;blocks;occupancy;compressed=!1;uniformFlags=null;uniformTypes=null;detailBlocks=null;detailOffsets=null;solidAlloc=null;vegMegaAlloc=null;lodAlloc=null;waterVertexBuffer=null;waterIndexBuffer=null;waterIndexCount=0;constructor(e,t){this.chunkX=e,this.chunkZ=t,this.blocks=new Uint16Array(pt),this.occupancy=new Uint32Array(ke*2)}get worldOffsetX(){return this.chunkX*D}get worldOffsetZ(){return this.chunkZ*I}getBlock(e,t,n){return this.isInBounds(e,t,n)?this.compressed?this.getBlockCompressed(e,t,n)&255:this.blocks[oe.index(e,t,n)]&255:p.AIR}getBlockRaw(e,t,n){return this.isInBounds(e,t,n)?this.compressed?this.getBlockCompressed(e,t,n):this.blocks[oe.index(e,t,n)]:0}getBlockMeta(e,t,n){return this.getBlockRaw(e,t,n)>>8&255}getBlockCompressed(e,t,n){const r=e>>2,s=t>>2,o=n>>2,l=r+s*J+o*J*ce;if(this.uniformFlags[l])return this.uniformTypes[l];const a=this.detailOffsets[l],c=e&3,u=t&3,d=n&3,f=c+u*V+d*V*V;return this.detailBlocks[a*64+f]}setBlock(e,t,n,r){this.isInBounds(e,t,n)&&(this.compressed&&this.decompress(),this.blocks[oe.index(e,t,n)]=r&255)}setBlockWithMeta(e,t,n,r,s){this.isInBounds(e,t,n)&&(this.compressed&&this.decompress(),this.blocks[oe.index(e,t,n)]=(s&255)<<8|r&255)}compress(){if(this.compressed)return;this.uniformFlags=new Uint8Array(ke),this.uniformTypes=new Uint16Array(ke),this.detailOffsets=new Uint16Array(ke);let e=0;for(let t=0;t<Re;t++)for(let n=0;n<ce;n++)for(let r=0;r<J;r++){const s=r+n*J+t*J*ce,o=r*V,l=n*V,a=t*V,c=this.blocks[oe.index(o,l,a)];let u=!0;e:for(let d=0;d<V;d++)for(let f=0;f<V;f++)for(let h=0;h<V;h++)if(this.blocks[oe.index(o+h,l+f,a+d)]!==c){u=!1;break e}u?(this.uniformFlags[s]=1,this.uniformTypes[s]=c):(this.uniformFlags[s]=0,this.detailOffsets[s]=e,e++)}this.detailBlocks=new Uint16Array(e*64);for(let t=0;t<Re;t++)for(let n=0;n<ce;n++)for(let r=0;r<J;r++){const s=r+n*J+t*J*ce;if(this.uniformFlags[s])continue;const o=this.detailOffsets[s]*64,l=r*V,a=n*V,c=t*V;for(let u=0;u<V;u++)for(let d=0;d<V;d++)for(let f=0;f<V;f++){const h=f+d*V+u*V*V;this.detailBlocks[o+h]=this.blocks[oe.index(l+f,a+d,c+u)]}}this.blocks=new Uint16Array(0),this.compressed=!0}decompress(){if(!this.compressed)return;const e=new Uint16Array(pt);for(let t=0;t<Re;t++)for(let n=0;n<ce;n++)for(let r=0;r<J;r++){const s=r+n*J+t*J*ce,o=r*V,l=n*V,a=t*V;if(this.uniformFlags[s]){const c=this.uniformTypes[s];for(let u=0;u<V;u++)for(let d=0;d<V;d++)for(let f=0;f<V;f++)e[oe.index(o+f,l+d,a+u)]=c}else{const c=this.detailOffsets[s]*64;for(let u=0;u<V;u++)for(let d=0;d<V;d++)for(let f=0;f<V;f++){const h=f+d*V+u*V*V;e[oe.index(o+f,l+d,a+u)]=this.detailBlocks[c+h]}}}this.blocks=e,this.compressed=!1,this.uniformFlags=null,this.uniformTypes=null,this.detailBlocks=null,this.detailOffsets=null}isInBounds(e,t,n){return e>=0&&e<D&&t>=0&&t<_&&n>=0&&n<I}isSolidAt(e,t,n){return this.isInBounds(e,t,n)?Ue(this.getBlock(e,t,n)):!1}isAirAt(e,t,n){return this.isInBounds(e,t,n)?rr(this.getBlock(e,t,n)):!0}static index(e,t,n){return e+t*D+n*D*_}computeOccupancy(){this.occupancy.fill(0);for(let e=0;e<Re;e++)for(let t=0;t<ce;t++)for(let n=0;n<J;n++){const r=n+t*J+e*J*ce;let s=0,o=0;const l=n*V,a=t*V,c=e*V;for(let u=0;u<V;u++)for(let d=0;d<V;d++)for(let f=0;f<V;f++)if((this.blocks[oe.index(l+f,a+d,c+u)]&255)!==p.AIR){const m=f+d*V+u*V*V;m<32?s|=1<<m:o|=1<<m-32}this.occupancy[r*2]=s,this.occupancy[r*2+1]=o}}isSubBlockEmpty(e,t,n){const r=e+t*J+n*J*ce;return this.occupancy[r*2]===0&&this.occupancy[r*2+1]===0}isSubBlockFull(e,t,n){const r=e+t*J+n*J*ce;return this.occupancy[r*2]===4294967295&&this.occupancy[r*2+1]===4294967295}destroyGPU(){this.solidAlloc=null,this.vegMegaAlloc=null,this.lodAlloc=null,this.waterVertexBuffer?.destroy(),this.waterIndexBuffer?.destroy(),this.waterVertexBuffer=null,this.waterIndexBuffer=null,this.waterIndexCount=0}}const Ce=[1,1,-1,1,1,-1,-1,-1,1,0,-1,0,0,1,0,-1,1,0,-1,0,0,1,0,-1],le=[1,1,0,-1,1,0,1,-1,0,-1,-1,0,1,0,1,-1,0,1,1,0,-1,-1,0,-1,0,1,1,0,-1,1,0,1,-1,0,-1,-1],Dr=.5*(Math.sqrt(3)-1),Le=(3-Math.sqrt(3))/6,Ur=1/3,ue=1/6;class Se{perm;permMod12;constructor(e=0){const{perm:t,permMod12:n}=Se.generatePermutation(e);this.perm=t,this.permMod12=n}noise2D(e,t){const n=this.perm,r=this.permMod12,s=(e+t)*Dr,o=Math.floor(e+s),l=Math.floor(t+s),a=(o+l)*Le,c=e-(o-a),u=t-(l-a);let d,f;c>u?(d=1,f=0):(d=0,f=1);const h=c-d+Le,m=u-f+Le,v=c-1+2*Le,g=u-1+2*Le,b=o&255,P=l&255;let w=0,S=0,x=0,B=.5-c*c-u*u;if(B>=0){const M=r[n[b+n[P]]&255]*2;B*=B,w=B*B*(Ce[M]*c+Ce[M+1]*u)}let C=.5-h*h-m*m;if(C>=0){const M=r[n[b+d+n[P+f]]&255]*2;C*=C,S=C*C*(Ce[M]*h+Ce[M+1]*m)}let A=.5-v*v-g*g;if(A>=0){const M=r[n[b+1+n[P+1]]&255]*2;A*=A,x=A*A*(Ce[M]*v+Ce[M+1]*g)}return(70*(w+S+x)+1)*.5}noise3D(e,t,n){const r=this.perm,s=this.permMod12,o=(e+t+n)*Ur,l=Math.floor(e+o),a=Math.floor(t+o),c=Math.floor(n+o),u=(l+a+c)*ue,d=e-(l-u),f=t-(a-u),h=n-(c-u);let m,v,g,b,P,w;d>=f?f>=h?(m=1,v=0,g=0,b=1,P=1,w=0):d>=h?(m=1,v=0,g=0,b=1,P=0,w=1):(m=0,v=0,g=1,b=1,P=0,w=1):f<h?(m=0,v=0,g=1,b=0,P=1,w=1):d<h?(m=0,v=1,g=0,b=0,P=1,w=1):(m=0,v=1,g=0,b=1,P=1,w=0);const S=d-m+ue,x=f-v+ue,B=h-g+ue,C=d-b+2*ue,A=f-P+2*ue,M=h-w+2*ue,R=d-1+3*ue,N=f-1+3*ue,O=h-1+3*ue,F=l&255,L=a&255,q=c&255;let k=0,U=0,Z=0,j=0,Y=.6-d*d-f*f-h*h;if(Y>=0){const Q=s[r[F+r[L+r[q]]]&255]*3;Y*=Y,k=Y*Y*(le[Q]*d+le[Q+1]*f+le[Q+2]*h)}let W=.6-S*S-x*x-B*B;if(W>=0){const Q=s[r[F+m+r[L+v+r[q+g]]]&255]*3;W*=W,U=W*W*(le[Q]*S+le[Q+1]*x+le[Q+2]*B)}let ee=.6-C*C-A*A-M*M;if(ee>=0){const Q=s[r[F+b+r[L+P+r[q+w]]]&255]*3;ee*=ee,Z=ee*ee*(le[Q]*C+le[Q+1]*A+le[Q+2]*M)}let de=.6-R*R-N*N-O*O;if(de>=0){const Q=s[r[F+1+r[L+1+r[q+1]]]&255]*3;de*=de,j=de*de*(le[Q]*R+le[Q+1]*N+le[Q+2]*O)}return(32*(k+U+Z+j)+1)*.5}static generatePermutation(e){const t=new Int32Array(256);for(let l=0;l<256;l++)t[l]=l;let n=e|0;const r=()=>(n=Math.imul(n,1103515245)+12345,n>>>16&32767);for(let l=255;l>0;l--){const a=r()%(l+1),c=t[l];t[l]=t[a],t[a]=c}const s=new Int32Array(512),o=new Int32Array(512);for(let l=0;l<512;l++)s[l]=t[l&255],o[l]=s[l]%12;return{perm:s,permMod12:o}}}class _e{noise;octaves;persistence;lacunarity;scale;constructor(e=0,t=4,n=.5,r=2,s=1){this.noise=new Se(e),this.octaves=t,this.persistence=n,this.lacunarity=r,this.scale=s}sample(e,t){let n=0,r=1,s=1,o=0;for(let l=0;l<this.octaves;l++){const a=e/this.scale*s,c=t/this.scale*s;n+=this.noise.noise2D(a,c)*r,o+=r,r*=this.persistence,s*=this.lacunarity}return n/o}}var X=(i=>(i[i.PLAINS=0]="PLAINS",i[i.FOREST=1]="FOREST",i[i.DESERT=2]="DESERT",i[i.TUNDRA=3]="TUNDRA",i[i.MOUNTAINS=4]="MOUNTAINS",i[i.OCEAN=5]="OCEAN",i))(X||{});const Or=[{biome:5,params:{temperature:0,humidity:.5,continentalness:-.7}},{biome:0,params:{temperature:.3,humidity:0,continentalness:.2}},{biome:1,params:{temperature:.2,humidity:.6,continentalness:.3}},{biome:2,params:{temperature:.8,humidity:-.7,continentalness:.4}},{biome:3,params:{temperature:-.8,humidity:0,continentalness:.3}},{biome:4,params:{temperature:-.2,humidity:.2,continentalness:.8}}];class Ut{continentalnessNoise;temperatureNoise;humidityNoise;heightVariationNoise;seed;constructor(e){this.seed=e;const t=T.data.terrain.noise,n=T.data.terrain.biomes;this.continentalnessNoise=new _e(e,t.octaves,t.persistence,t.lacunarity,n.continentalnessScale),this.temperatureNoise=new _e(e+1e3,t.octaves,t.persistence,t.lacunarity,n.temperatureScale),this.humidityNoise=new _e(e+2e3,t.octaves,t.persistence,t.lacunarity,n.humidityScale),this.heightVariationNoise=new _e(e+3e3,t.octaves,t.persistence,t.lacunarity,n.heightVariationScale)}generate(e){for(let t=0;t<D;t++)for(let n=0;n<I;n++){const r=e.worldOffsetX+t,s=e.worldOffsetZ+n;this.generateColumn(e,t,n,r,s)}}generateColumn(e,t,n,r,s){const o=this.continentalnessNoise.sample(r,s),l=this.heightVariationNoise.sample(r,s),a=this.continentalnessToHeight(o);let c=Math.floor(a+(l-.5)*10);c=Math.max(1,Math.min(_-1,c));const u=this.getBiome(r,s,c,o);for(let d=0;d<_;d++)e.setBlock(t,d,n,this.getBlockType(d,c,u))}continentalnessToHeight(e){return e<.3?30+e/.3*18:e<.45?48+(e-.3)/.15*4:e<.7?52+(e-.45)/.25*13:e<.85?65+(e-.7)/.15*15:80+(e-.85)/.15*20}getSurfaceHeight(e,t){const n=this.continentalnessNoise.sample(e,t),r=this.heightVariationNoise.sample(e,t),s=this.continentalnessToHeight(n);let o=Math.floor(s+(r-.5)*10);return Math.max(1,Math.min(_-1,o))}getBiome(e,t,n,r){if(r===void 0&&(r=this.continentalnessNoise.sample(e,t)),r<T.data.terrain.biomes.oceanThreshold)return X.OCEAN;const s=this.temperatureNoise.sample(e,t),o=this.humidityNoise.sample(e,t),l=s*2-1,a=o*2-1,c=r*2-1;let u=X.PLAINS,d=1/0;for(const f of Or){const h=l-f.params.temperature,m=a-f.params.humidity,v=c-f.params.continentalness,g=h*h+m*m+v*v;g<d&&(d=g,u=f.biome)}return u}getBlockType(e,t,n){const r=T.data.terrain.height.seaLevel,s=T.data.terrain.height.dirtLayerDepth;return e===0?p.BEDROCK:e>t?e<=r?p.WATER:p.AIR:e===t?this.getSurfaceBlock(n,t):e>=t-s?this.getSubSurfaceBlock(n):p.STONE}getSurfaceBlock(e,t){if(t<T.data.terrain.height.seaLevel)return p.SAND;switch(e){case X.DESERT:return p.SAND;case X.TUNDRA:return p.SNOW;case X.MOUNTAINS:return t>85?p.STONE:p.GRASS_BLOCK;case X.OCEAN:return p.SAND;default:return p.GRASS_BLOCK}}getSubSurfaceBlock(e){switch(e){case X.DESERT:return p.SANDSTONE;case X.TUNDRA:return p.DIRT;case X.OCEAN:return p.SAND;default:return p.DIRT}}}class Ve{state;constructor(e){this.state=e|0}next(){this.state|=0,this.state=this.state+1831565813|0;let e=Math.imul(this.state^this.state>>>15,1|this.state);return e=e+Math.imul(e^e>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296}nextInt(e,t){return e+Math.floor(this.next()*(t-e))}nextFloat(e,t){return e+this.next()*(t-e)}}class Ot{dirNoiseX;dirNoiseY;radiusNoise;seed;constructor(e){this.seed=e,this.dirNoiseX=new Se(e),this.dirNoiseY=new Se(e+1),this.radiusNoise=new Se(e+3)}generate(e){const t=T.data.terrain.caves,n=this.seed^e.chunkX*73856093^e.chunkZ*19349663|0,r=new Ve(n);for(let s=0;s<t.count;s++)this.generateWorm(e,r)}generateWorm(e,t){const n=T.data.terrain.caves;let r=t.nextInt(0,D),s=t.nextInt(n.minY,n.maxY),o=t.nextInt(0,I);const l=t.nextInt(n.minLength,n.maxLength),a=t.next()*1e3;for(let c=0;c<l;c++){const u=c*.1+a,d=n.minRadius+(n.maxRadius-n.minRadius)*this.radiusNoise.noise2D(u,0);this.carveSphere(e,r,s,o,d);const f=this.dirNoiseX.noise2D(u,0)*Math.PI*2,h=(this.dirNoiseY.noise2D(0,u)-.5)*Math.PI*.5;r+=Math.cos(f)*Math.cos(h),s+=Math.sin(h)*.3,o+=Math.sin(f)*Math.cos(h),s=Math.max(n.minY,Math.min(n.maxY,s))}}carveSphere(e,t,n,r,s){const o=Math.floor(t-s),l=Math.ceil(t+s),a=Math.floor(n-s),c=Math.ceil(n+s),u=Math.floor(r-s),d=Math.ceil(r+s),f=s*s;for(let h=o;h<=l;h++)for(let m=a;m<=c;m++)for(let v=u;v<=d;v++){if(!e.isInBounds(h,m,v)||m<=0)continue;const g=h-t,b=m-n,P=v-r;if(g*g+b*b+P*P<=f){const w=e.getBlock(h,m,v);w!==p.BEDROCK&&w!==p.WATER&&w!==p.FLOWING_WATER&&e.setBlock(h,m,v,p.AIR)}}}}class Vt{seed;constructor(e){this.seed=e}getOreSettings(){const e=T.data.terrain.ores;return[{oreType:p.COAL_ORE,minY:e.coal.minY,maxY:e.coal.maxY,attemptsPerChunk:e.coal.attempts,veinSize:e.coal.veinSize},{oreType:p.IRON_ORE,minY:e.iron.minY,maxY:e.iron.maxY,attemptsPerChunk:e.iron.attempts,veinSize:e.iron.veinSize},{oreType:p.GOLD_ORE,minY:e.gold.minY,maxY:e.gold.maxY,attemptsPerChunk:e.gold.attempts,veinSize:e.gold.veinSize},{oreType:p.DIAMOND_ORE,minY:e.diamond.minY,maxY:e.diamond.maxY,attemptsPerChunk:e.diamond.attempts,veinSize:e.diamond.veinSize}]}generate(e){const t=this.seed^e.chunkX*498536548^e.chunkZ*725765765|0,n=new Ve(t);for(const r of this.getOreSettings())this.generateOre(e,r,n)}generateOre(e,t,n){for(let r=0;r<t.attemptsPerChunk;r++){const s=n.nextInt(0,D),o=n.nextInt(t.minY,Math.min(t.maxY,_)),l=n.nextInt(0,I);e.getBlock(s,o,l)===p.STONE&&this.generateVein(e,s,o,l,t.oreType,t.veinSize,n,t.minY,t.maxY)}}generateVein(e,t,n,r,s,o,l,a,c){let u=t,d=n,f=r;e.setBlock(u,d,f,s);for(let h=1;h<o;h++)u+=l.nextInt(-1,2),d+=l.nextInt(-1,2),f+=l.nextInt(-1,2),e.isInBounds(u,d,f)&&(d<a||d>=c||e.getBlock(u,d,f)===p.STONE&&e.setBlock(u,d,f,s))}}const Vr=3,It=1,Ir=4,Nr=8,kr=.5,_r=.3;class Nt{seed;terrainGen;constructor(e,t=null){this.seed=e,this.terrainGen=t}generate(e){const t=T.data.terrain.trees,n=this.seed^e.chunkX*341873128^e.chunkZ*132897987|0,r=new Ve(n),s=this.getMaxTreesForChunk(e,r),o=t.perChunk*Ir;let l=0;for(let a=0;a<o&&l<s;a++){const c=r.nextInt(2,D-2),u=r.nextInt(2,I-2),d=this.findSurfaceY(e,c,u);if(d<0)continue;const f=e.worldOffsetX+c,h=e.worldOffsetZ+u;if(!this.canPlaceTreeAtBiome(f,h,d,r)||!this.canPlaceTree(e,c,d,u))continue;const m=r.nextInt(t.minTrunkHeight,t.maxTrunkHeight+1);this.placeOakTree(e,c,d+1,u,m,r),l++}}getMaxTreesForChunk(e,t){const n=T.data.terrain.trees.perChunk;if(!this.terrainGen)return n;const r=e.worldOffsetX+(D>>1),s=e.worldOffsetZ+(I>>1);switch(this.terrainGen.getBiome(r,s,64)){case X.FOREST:return n*Vr;case X.PLAINS:return n;case X.TUNDRA:return Math.max(1,n>>It);case X.MOUNTAINS:return Math.max(1,n>>It);case X.DESERT:return 0;case X.OCEAN:return 0;default:return n}}canPlaceTreeAtBiome(e,t,n,r){if(!this.terrainGen)return!0;switch(this.terrainGen.getBiome(e,t,n)){case X.DESERT:return!1;case X.OCEAN:return!1;case X.TUNDRA:return r.next()>kr;case X.MOUNTAINS:return r.next()>_r;default:return!0}}findSurfaceY(e,t,n){for(let r=_-1;r>=0;r--){const s=e.getBlock(t,r,n);if(s===p.GRASS_BLOCK||s===p.DIRT||s===p.SNOW)return r}return-1}canPlaceTree(e,t,n,r){const s=e.getBlock(t,n,r);if(s!==p.GRASS_BLOCK&&s!==p.SNOW)return!1;for(let o=n+1;o<n+Nr&&o<_;o++)if(e.getBlock(t,o,r)!==p.AIR)return!1;return!0}placeOakTree(e,t,n,r,s,o){const l=T.data.terrain.trees.leafDecayChance;e.setBlock(t,n-1,r,p.DIRT);for(let c=0;c<s;c++)e.setBlock(t,n+c,r,p.LOG);const a=n+s-2;this.placeLeafLayer(e,t,a,r,2,o,l),this.placeLeafLayer(e,t,a+1,r,2,o,l),this.placeLeafLayer(e,t,a+2,r,1,o,l),this.placeLeafLayerTop(e,t,a+3,r,o,l)}placeLeafLayer(e,t,n,r,s,o,l){for(let a=-s;a<=s;a++)for(let c=-s;c<=s;c++){if(Math.abs(a)===s&&Math.abs(c)===s&&o.next()<l)continue;const u=t+a,d=r+c;e.isInBounds(u,n,d)&&e.getBlock(u,n,d)===p.AIR&&e.setBlock(u,n,d,p.LEAVES)}}placeLeafLayerTop(e,t,n,r,s,o){this.tryPlaceLeaf(e,t,n,r),s.next()>o&&this.tryPlaceLeaf(e,t+1,n,r),s.next()>o&&this.tryPlaceLeaf(e,t-1,n,r),s.next()>o&&this.tryPlaceLeaf(e,t,n,r+1),s.next()>o&&this.tryPlaceLeaf(e,t,n,r-1)}tryPlaceLeaf(e,t,n,r){e.isInBounds(t,n,r)&&e.getBlock(t,n,r)===p.AIR&&e.setBlock(t,n,r,p.LEAVES)}}const zr=.3,Hr=.8,Wr=.9;class kt{seed;terrainGen;constructor(e,t=null){this.seed=e,this.terrainGen=t}generate(e){const t=this.seed^e.chunkX*198491317^e.chunkZ*456123789|0,n=new Ve(t);for(let r=0;r<D;r++)for(let s=0;s<I;s++){const o=this.findGrassSurface(e,r,s);if(o<0||o+1>=_)continue;const l=e.worldOffsetX+r,a=e.worldOffsetZ+s;if(!this.canPlaceVegetation(l,a,o)||n.next()>zr||e.getBlock(r,o+1,s)!==p.AIR)continue;const c=n.next();let u;c<Hr?u=p.TALL_GRASS:c<Wr?u=p.POPPY:u=p.DANDELION,e.setBlock(r,o+1,s,u)}}findGrassSurface(e,t,n){for(let r=_-1;r>=0;r--)if(e.getBlock(t,r,n)===p.GRASS_BLOCK)return r;return-1}canPlaceVegetation(e,t,n){if(!this.terrainGen)return!0;switch(this.terrainGen.getBiome(e,t,n)){case X.DESERT:case X.OCEAN:case X.TUNDRA:case X.MOUNTAINS:return!1;default:return!0}}}class K{constructor(e,t){this.terrainGen=t;const n=new Ve(e+77777);let r=8,s=8,o=!1;for(let l=0;l<12;l++){const a=n.nextInt(-8,25),c=n.nextInt(-8,25),u=t.getSurfaceHeight(a,c),d=t.getBiome(a,c,u);if(d===X.PLAINS||d===X.FOREST){r=a,s=c,o=!0;break}}this.villageCenterX=r,this.villageCenterZ=s,this.villageBaseY=t.getSurfaceHeight(r,s),this.valid=o}villageCenterX;villageCenterZ;villageBaseY;valid;static VILLAGE_RADIUS=24;static BLEND_MARGIN=6;static PLAZA_RADIUS=6;static TOWER_OFFSET_X=2;static TOWER_OFFSET_Z=2;static TOWER_HEIGHT=16;static TOWER_WALL_SIZE=5;static TOWER_WINDOW_MIN_Y=5;static TOWER_WINDOW_MAX_Y=7;static HOUSE_OFFSET_X=-8;static HOUSE_OFFSET_Z=-6;static HOUSE_WIDTH=7;static HOUSE_DEPTH=5;static HOUSE_WALL_HEIGHT=5;static DIRT_FILL_DEPTH=3;generate(e){if(!this.valid)return;const t=K.VILLAGE_RADIUS+K.BLEND_MARGIN,n=e.worldOffsetX,r=e.worldOffsetZ,s=n+D,o=r+I,l=this.villageCenterX-t,a=this.villageCenterX+t,c=this.villageCenterZ-t,u=this.villageCenterZ+t;s<=l||n>=a||o<=c||r>=u||(this.flattenTerrain(e),this.buildPlaza(e),this.buildWatchtower(e),this.buildHouse(e))}setWorldBlock(e,t,n,r,s){const o=t-e.worldOffsetX,l=r-e.worldOffsetZ;o<0||o>=D||l<0||l>=I||n<0||n>=_||e.setBlock(o,n,l,s)}setTorchBlock(e,t,n,r,s){const o=t-e.worldOffsetX,l=r-e.worldOffsetZ;o<0||o>=D||l<0||l>=I||n<0||n>=_||e.setBlockWithMeta(o,n,l,p.TORCH,s)}getWorldBlock(e,t,n,r){const s=t-e.worldOffsetX,o=r-e.worldOffsetZ;return s<0||s>=D||o<0||o>=I||n<0||n>=_?-1:e.getBlock(s,n,o)}flattenTerrain(e){const t=this.villageCenterX,n=this.villageCenterZ,r=this.villageBaseY,s=K.VILLAGE_RADIUS+K.BLEND_MARGIN,o=K.VILLAGE_RADIUS;for(let l=t-s;l<=t+s;l++)for(let a=n-s;a<=n+s;a++){const c=l-e.worldOffsetX,u=a-e.worldOffsetZ;if(c<0||c>=D||u<0||u>=I)continue;const d=l-t,f=a-n,h=Math.sqrt(d*d+f*f);if(h>s)continue;const m=this.terrainGen.getSurfaceHeight(l,a);let v;if(h<=o)v=r;else{const g=(h-o)/K.BLEND_MARGIN;v=Math.round(r+(m-r)*g)}for(let g=v+1;g<_;g++)e.setBlock(c,g,u,p.AIR);e.setBlock(c,v,u,p.GRASS_BLOCK);for(let g=v-1;g>=v-K.DIRT_FILL_DEPTH&&g>0;g--)e.setBlock(c,g,u,p.DIRT)}}buildPlaza(e){const t=this.villageCenterX,n=this.villageCenterZ,r=this.villageBaseY,s=K.PLAZA_RADIUS;for(let l=-s;l<=s;l++)for(let a=-s;a<=s;a++)l*l+a*a<=s*s&&this.setWorldBlock(e,t+l,r,n+a,p.COBBLESTONE);const o=[[-5,0],[5,0],[0,-5],[0,5],[-4,-4],[4,-4],[-4,4],[4,4]];for(const[l,a]of o)this.setWorldBlock(e,t+l,r+1,n+a,p.COBBLESTONE),this.setWorldBlock(e,t+l,r+2,n+a,p.COBBLESTONE),this.setTorchBlock(e,t+l,r+3,n+a,ne.FLOOR)}buildWatchtower(e){const t=this.villageCenterX+K.TOWER_OFFSET_X,n=this.villageCenterZ+K.TOWER_OFFSET_Z,r=this.villageBaseY,s=K.TOWER_HEIGHT,o=K.TOWER_WALL_SIZE;for(let u=1;u<=s;u++){const d=r+u;for(let f=0;f<o;f++)for(let h=0;h<o;h++)f===0||f===o-1||h===0||h===o-1?this.setWorldBlock(e,t+f,d,n+h,p.STONE_BRICKS):this.setWorldBlock(e,t+f,d,n+h,p.AIR)}for(let u=K.TOWER_WINDOW_MIN_Y;u<=K.TOWER_WINDOW_MAX_Y;u++){const d=r+u;this.setWorldBlock(e,t+2,d,n,p.GLASS),this.setWorldBlock(e,t+2,d,n+4,p.GLASS),this.setWorldBlock(e,t,d,n+2,p.GLASS),this.setWorldBlock(e,t+4,d,n+2,p.GLASS)}const l=r+s+1;for(let u=-1;u<=o;u++)for(let d=-1;d<=o;d++)this.setWorldBlock(e,t+u,l,n+d,p.STONE_BRICKS);const a=l+1;for(let u=-1;u<=o;u++)for(let d=-1;d<=o;d++)(u===-1||u===o||d===-1||d===o)&&this.setWorldBlock(e,t+u,a,n+d,p.STONE_BRICKS);const c=a+1;this.setTorchBlock(e,t-1,c,n-1,ne.FLOOR),this.setTorchBlock(e,t+o,c,n-1,ne.FLOOR),this.setTorchBlock(e,t-1,c,n+o,ne.FLOOR),this.setTorchBlock(e,t+o,c,n+o,ne.FLOOR),this.setWorldBlock(e,t+2,l+1,n+2,p.STONE_BRICKS),this.setTorchBlock(e,t+2,l+2,n+2,ne.FLOOR),this.setTorchBlock(e,t+2,r+3,n+1,ne.SOUTH),this.setTorchBlock(e,t+2,r+3,n+3,ne.NORTH),this.setWorldBlock(e,t+2,r+1,n+4,p.AIR),this.setWorldBlock(e,t+2,r+2,n+4,p.AIR)}buildHouse(e){const t=this.villageCenterX+K.HOUSE_OFFSET_X,n=this.villageCenterZ+K.HOUSE_OFFSET_Z,r=this.villageBaseY,s=K.HOUSE_WIDTH,o=K.HOUSE_DEPTH,l=K.HOUSE_WALL_HEIGHT;for(let c=0;c<s;c++)for(let u=0;u<o;u++)this.setWorldBlock(e,t+c,r,n+u,p.PLANKS);for(let c=1;c<=l;c++){const u=r+c;for(let d=0;d<s;d++)for(let f=0;f<o;f++)d===0||d===s-1||f===0||f===o-1?this.setWorldBlock(e,t+d,u,n+f,p.PLANKS):this.setWorldBlock(e,t+d,u,n+f,p.AIR)}for(let c=1;c<=l;c++){const u=r+c;this.setWorldBlock(e,t,u,n,p.LOG),this.setWorldBlock(e,t+s-1,u,n,p.LOG),this.setWorldBlock(e,t,u,n+o-1,p.LOG),this.setWorldBlock(e,t+s-1,u,n+o-1,p.LOG)}for(let c=2;c<=3;c++){const u=r+c;this.setWorldBlock(e,t+2,u,n,p.GLASS),this.setWorldBlock(e,t+4,u,n,p.GLASS),this.setWorldBlock(e,t+2,u,n+o-1,p.GLASS),this.setWorldBlock(e,t+4,u,n+o-1,p.GLASS)}this.setWorldBlock(e,t+3,r+1,n,p.AIR),this.setWorldBlock(e,t+3,r+2,n,p.AIR);const a=r+l+1;for(let c=-1;c<=s;c++)for(let u=-1;u<=o;u++)this.setWorldBlock(e,t+c,a,n+u,p.LOG);this.setTorchBlock(e,t+1,r+3,n+2,ne.EAST)}}const Yr=7;class _t{waterTableNoise;constructor(e){this.waterTableNoise=new Se(e+100)}generate(e){const t=T.data.terrain.height.seaLevel,n=e.blocks;for(let r=0;r<n.length;r++)(n[r]===p.WATER||n[r]===p.FLOWING_WATER)&&(n[r]=p.AIR);for(let r=0;r<D;r++)for(let s=0;s<I;s++){const o=this.findSolidSurface(e,r,s,t);if(o<t)for(let l=o+1;l<=t;l++)e.getBlock(r,l,s)===p.AIR&&e.setBlock(r,l,s,p.WATER)}this.fillCaveWater(e,t),this.cascadeFlow(e,t)}findSolidSurface(e,t,n,r){for(let s=r;s>=0;s--){const o=e.getBlock(t,s,n);if(o!==p.AIR&&o!==p.WATER&&o!==p.FLOWING_WATER)return s}return 0}fillCaveWater(e,t){const{baseLevel:n,amplitude:r,noiseScale:s}=T.data.terrain.caves.waterTable;for(let o=0;o<D;o++)for(let l=0;l<I;l++){const a=e.chunkX*D+o,c=e.chunkZ*I+l,u=this.waterTableNoise.noise2D(a/s,c/s),d=Math.floor(n+u*r);let f=!1;for(let h=_-1;h>=1;h--){const m=e.getBlock(o,h,l);m!==p.AIR&&m!==p.WATER&&m!==p.FLOWING_WATER?f=!0:f&&m===p.AIR&&h<=d&&e.setBlock(o,h,l,p.WATER)}}}cascadeFlow(e,t){for(let n=0;n<D;n++)for(let r=0;r<I;r++){if(e.getBlock(n,t,r)!==p.WATER)continue;const s=[[-1,0],[1,0],[0,-1],[0,1]];for(const[o,l]of s){const a=n+o,c=r+l;e.isInBounds(a,t,c)&&e.getBlock(a,t,c)===p.AIR&&this.placeFlow(e,a,t,c)}}}placeFlow(e,t,n,r){const s=[t],o=[n],l=[r],a=[0],c=new Uint8Array(D*_*I);let u=0;for(;u<s.length;){const d=s[u],f=o[u],h=l[u],m=a[u];if(u++,!e.isInBounds(d,f,h)||f<1)continue;const v=oe.index(d,f,h);if(c[v]||(c[v]=1,e.getBlock(d,f,h)!==p.AIR))continue;if(e.setBlock(d,f,h,p.FLOWING_WATER),e.isInBounds(d,f-1,h)&&e.getBlock(d,f-1,h)===p.AIR){s.push(d),o.push(f-1),l.push(h),a.push(0);continue}if(m>=Yr)continue;const b=[[-1,0],[1,0],[0,-1],[0,1]];for(const[P,w]of b)s.push(d+P),o.push(f),l.push(h+w),a.push(m+1)}}}const Qt=[new Float32Array([0,1,0,1,1,0,1,1,1,0,1,1]),new Float32Array([0,0,1,1,0,1,1,0,0,0,0,0]),new Float32Array([1,0,1,0,0,1,0,1,1,1,1,1]),new Float32Array([0,0,0,1,0,0,1,1,0,0,1,0]),new Float32Array([1,0,0,1,0,1,1,1,1,1,1,0]),new Float32Array([0,0,1,0,0,0,0,1,0,0,1,1])];class st{buffer;f32;u32;offset;constructor(e){this.buffer=new ArrayBuffer(e*4),this.f32=new Float32Array(this.buffer),this.u32=new Uint32Array(this.buffer),this.offset=0}ensure(e){const t=this.offset+e;if(t<=this.f32.length)return;let n=this.f32.length*2;for(;n<t;)n*=2;const r=new ArrayBuffer(n*4);new Uint8Array(r).set(new Uint8Array(this.buffer,0,this.offset*4)),this.buffer=r,this.f32=new Float32Array(r),this.u32=new Uint32Array(r)}pushF32(e){this.f32[this.offset++]=e}pushU32(e){this.u32[this.offset++]=e}trimF32(){return new Float32Array(this.buffer.slice(0,this.offset*4))}}class ot{data;offset;constructor(e){this.data=new Uint32Array(e),this.offset=0}ensure(e){const t=this.offset+e;if(t<=this.data.length)return;let n=this.data.length*2;for(;n<t;)n*=2;const r=new Uint32Array(n);r.set(this.data.subarray(0,this.offset)),this.data=r}push6(e,t,n,r,s,o){const l=this.offset;this.data[l]=e,this.data[l+1]=t,this.data[l+2]=n,this.data[l+3]=r,this.data[l+4]=s,this.data[l+5]=o,this.offset=l+6}trim(){return new Uint32Array(this.data.buffer.slice(0,this.offset*4))}}const jr=[[[-1,1,0,0,1,-1,-1,1,-1],[1,1,0,0,1,-1,1,1,-1],[1,1,0,0,1,1,1,1,1],[-1,1,0,0,1,1,-1,1,1]],[[-1,-1,0,0,-1,1,-1,-1,1],[1,-1,0,0,-1,1,1,-1,1],[1,-1,0,0,-1,-1,1,-1,-1],[-1,-1,0,0,-1,-1,-1,-1,-1]],[[1,0,1,0,-1,1,1,-1,1],[-1,0,1,0,-1,1,-1,-1,1],[-1,0,1,0,1,1,-1,1,1],[1,0,1,0,1,1,1,1,1]],[[-1,0,-1,0,-1,-1,-1,-1,-1],[1,0,-1,0,-1,-1,1,-1,-1],[1,0,-1,0,1,-1,1,1,-1],[-1,0,-1,0,1,-1,-1,1,-1]],[[1,0,-1,1,-1,0,1,-1,-1],[1,0,1,1,-1,0,1,-1,1],[1,0,1,1,1,0,1,1,1],[1,0,-1,1,1,0,1,1,-1]],[[-1,0,1,-1,-1,0,-1,-1,1],[-1,0,-1,-1,-1,0,-1,-1,-1],[-1,0,-1,-1,1,0,-1,1,-1],[-1,0,1,-1,1,0,-1,1,1]]],at=0,Xr=-1;function qr(i,e,t,n,r){return i&255|(e&3)<<8|(t&3)<<10|(n&3)<<12|(r&3)<<14}function Zr(i){return i&255}function Kr(i){return[i>>8&3,i>>10&3,i>>12&3,i>>14&3]}const $r=[{face:0,sliceAxis:1,uAxis:0,vAxis:2,sliceMax:_,uMax:D,vMax:I,positive:!0},{face:1,sliceAxis:1,uAxis:0,vAxis:2,sliceMax:_,uMax:D,vMax:I,positive:!1},{face:2,sliceAxis:2,uAxis:0,vAxis:1,sliceMax:I,uMax:D,vMax:_,positive:!0},{face:3,sliceAxis:2,uAxis:0,vAxis:1,sliceMax:I,uMax:D,vMax:_,positive:!1},{face:4,sliceAxis:0,uAxis:2,vAxis:1,sliceMax:D,uMax:I,vMax:_,positive:!0},{face:5,sliceAxis:0,uAxis:2,vAxis:1,sliceMax:D,uMax:I,vMax:_,positive:!1}];function zt(i,e=null){const t=new st(7e4),n=new ot(15e3);let r=0;const s=new st(5e3),o=new ot(3e3);let l=0;const a=new st(8e3),c=new ot(4800);let u=0;const d=1/$,f=[0,1,1,0],h=[0,0,1,1];for(let S=0;S<D;S++)for(let x=0;x<_;x++)for(let B=0;B<I;B++){const C=i.getBlock(S,x,B);if(C!==p.AIR){if(qe(C)){if(!ti(i,e,S,x,B,0))continue;const A=Qt[0],M=l;s.ensure(20);for(let R=0;R<4;R++)s.pushF32(i.worldOffsetX+S+A[R*3+0]),s.pushF32(x+A[R*3+1]),s.pushF32(i.worldOffsetZ+B+A[R*3+2]),s.pushF32(f[R]),s.pushF32(h[R]);o.ensure(6),o.push6(M+0,M+2,M+1,M+0,M+3,M+2),l+=4;continue}if(Ze(C)){const A=C,M=A%$*d,R=Math.floor(A/$)*d,N=i.worldOffsetX+S,O=i.worldOffsetZ+B,F=0|C<<8,L=x+.01,q=x+.99;a.ensure(56),c.ensure(12);const k=u;a.pushF32(N),a.pushF32(L),a.pushF32(O),a.pushU32(F),a.pushF32(M),a.pushF32(R+d),a.pushF32(1),a.pushF32(N+1),a.pushF32(L),a.pushF32(O+1),a.pushU32(F),a.pushF32(M+d),a.pushF32(R+d),a.pushF32(1),a.pushF32(N+1),a.pushF32(q),a.pushF32(O+1),a.pushU32(F),a.pushF32(M+d),a.pushF32(R),a.pushF32(1),a.pushF32(N),a.pushF32(q),a.pushF32(O),a.pushU32(F),a.pushF32(M),a.pushF32(R),a.pushF32(1),c.push6(k+0,k+2,k+1,k+0,k+3,k+2),u+=4;const U=u;a.pushF32(N+1),a.pushF32(L),a.pushF32(O),a.pushU32(F),a.pushF32(M),a.pushF32(R+d),a.pushF32(1),a.pushF32(N),a.pushF32(L),a.pushF32(O+1),a.pushU32(F),a.pushF32(M+d),a.pushF32(R+d),a.pushF32(1),a.pushF32(N),a.pushF32(q),a.pushF32(O+1),a.pushU32(F),a.pushF32(M+d),a.pushF32(R),a.pushF32(1),a.pushF32(N+1),a.pushF32(q),a.pushF32(O),a.pushU32(F),a.pushF32(M),a.pushF32(R),a.pushF32(1),c.push6(U+0,U+2,U+1,U+0,U+3,U+2),u+=4;continue}if(Xe(C)){const A=C,M=A%$*d,R=Math.floor(A/$)*d,N=i.getBlockMeta(S,x,B);let O=.5,F=.5;switch(N){case ne.NORTH:F=.875;break;case ne.SOUTH:F=.125;break;case ne.EAST:O=.875;break;case ne.WEST:O=.125;break}const L=i.worldOffsetX+S,q=i.worldOffsetZ+B,k=0|C<<8,U=.125,Z=x+.01,j=x+.99;a.ensure(56),c.ensure(12);const Y=u;a.pushF32(L+O-U),a.pushF32(Z),a.pushF32(q+F-U),a.pushU32(k),a.pushF32(M),a.pushF32(R+d),a.pushF32(1),a.pushF32(L+O+U),a.pushF32(Z),a.pushF32(q+F+U),a.pushU32(k),a.pushF32(M+d),a.pushF32(R+d),a.pushF32(1),a.pushF32(L+O+U),a.pushF32(j),a.pushF32(q+F+U),a.pushU32(k),a.pushF32(M+d),a.pushF32(R),a.pushF32(1),a.pushF32(L+O-U),a.pushF32(j),a.pushF32(q+F-U),a.pushU32(k),a.pushF32(M),a.pushF32(R),a.pushF32(1),c.push6(Y+0,Y+2,Y+1,Y+0,Y+3,Y+2),u+=4;const W=u;a.pushF32(L+O+U),a.pushF32(Z),a.pushF32(q+F-U),a.pushU32(k),a.pushF32(M),a.pushF32(R+d),a.pushF32(1),a.pushF32(L+O-U),a.pushF32(Z),a.pushF32(q+F+U),a.pushU32(k),a.pushF32(M+d),a.pushF32(R+d),a.pushF32(1),a.pushF32(L+O-U),a.pushF32(j),a.pushF32(q+F+U),a.pushU32(k),a.pushF32(M+d),a.pushF32(R),a.pushF32(1),a.pushF32(L+O+U),a.pushF32(j),a.pushF32(q+F-U),a.pushU32(k),a.pushF32(M),a.pushF32(R),a.pushF32(1),c.push6(W+0,W+2,W+1,W+0,W+3,W+2),u+=4;continue}}}for(const S of $r){const{face:x,sliceAxis:B,uAxis:C,vAxis:A,sliceMax:M,uMax:R,vMax:N,positive:O}=S,F=new Int32Array(R*N);for(let L=0;L<M;L++){let q=!1;for(let k=0;k<N;k++)for(let U=0;U<R;U++){const Z=[0,0,0];Z[B]=L,Z[C]=U,Z[A]=k;const j=Z[0],Y=Z[1],W=Z[2],ee=i.getBlock(j,Y,W);if(ee===p.AIR||qe(ee)||Ze(ee)||Xe(ee)){F[U+k*R]=at;continue}if(!ni(i,e,j,Y,W,x,ee)){F[U+k*R]=at;continue}if(He(ee)){F[U+k*R]=Xr,Qr(i,e,t,n,j,Y,W,x,ee,d,r),r+=4;continue}const de=Ee(i,e,j,Y,W,x,0),Q=Ee(i,e,j,Y,W,x,1),Je=Ee(i,e,j,Y,W,x,2),et=Ee(i,e,j,Y,W,x,3);F[U+k*R]=qr(ee,de,Q,Je,et),q=!0}if(q)for(let k=0;k<N;k++)for(let U=0;U<R;){const Z=F[U+k*R];if(Z<=0){U++;continue}let j=1;for(;U+j<R&&F[U+j+k*R]===Z;)j++;let Y=1,W=!0;for(;k+Y<N&&W;){for(let me=0;me<j;me++)if(F[U+me+(k+Y)*R]!==Z){W=!1;break}W&&Y++}for(let me=0;me<Y;me++)for(let tt=0;tt<j;tt++)F[U+tt+(k+me)*R]=at;const ee=Zr(Z),[de,Q,Je,et]=Kr(Z),en=de/3,tn=Q/3,nn=Je/3,rn=et/3,Ie=[0,0,0];Ie[B]=L,Ie[C]=U,Ie[A]=k,Jr(i,t,n,x,ee,Ie,B,C,A,j,Y,O,en,tn,nn,rn,d,r),r+=4,U+=j}}}const m=t.trimF32(),v=n.trim(),g=s.trimF32(),b=o.trim(),P=a.trimF32(),w=c.trim();return{vertices:m,indices:v,vertexCount:r,indexCount:v.length,waterVertices:g,waterIndices:b,waterVertexCount:l,waterIndexCount:b.length,vegVertices:P,vegIndices:w,vegVertexCount:u,vegIndexCount:w.length}}function Qr(i,e,t,n,r,s,o,l,a,c,u){const d=Qt[l],f=a,h=f%$*c,m=Math.floor(f/$)*c,v=[0,1,1,0],g=[0,0,1,1];t.ensure(28),n.ensure(6);let b=0,P=0,w=0,S=0;for(let x=0;x<4;x++){const B=r+d[x*3+0],C=s+d[x*3+1],A=o+d[x*3+2];t.pushF32(i.worldOffsetX+B),t.pushF32(C),t.pushF32(i.worldOffsetZ+A),t.pushU32(l|a<<8),t.pushF32(h+v[x]*c),t.pushF32(m+g[x]*c);const M=ei(i,e,r,s,o,l,x);t.pushF32(M),x===0?b=M:x===1?P=M:x===2?w=M:S=M}b+w>P+S?n.push6(u+0,u+2,u+1,u+0,u+3,u+2):n.push6(u+0,u+3,u+1,u+1,u+3,u+2)}function Jr(i,e,t,n,r,s,o,l,a,c,u,d,f,h,m,v,g,b){const P=d?s[o]+1:s[o],w=s[l],S=s[a],x=w+c,B=S+u;let C;switch(n){case 0:C=[w,S,x,S,x,B,w,B];break;case 1:C=[w,B,x,B,x,S,w,S];break;case 2:C=[x,S,w,S,w,B,x,B];break;case 3:C=[w,S,x,S,x,B,w,B];break;case 4:C=[w,S,x,S,x,B,w,B];break;case 5:C=[x,S,w,S,w,B,x,B];break;default:C=[w,S,x,S,x,B,w,B];break}let A;switch(n){case 0:A=[0,0,c,0,c,u,0,u];break;case 1:A=[0,u,c,u,c,0,0,0];break;case 2:A=[c,0,0,0,0,u,c,u];break;case 3:A=[0,0,c,0,c,u,0,u];break;case 4:A=[0,0,c,0,c,u,0,u];break;case 5:A=[c,0,0,0,0,u,c,u];break;default:A=[0,0,c,0,c,u,0,u];break}e.ensure(28),t.ensure(6);const M=i.worldOffsetX,R=i.worldOffsetZ;for(let N=0;N<4;N++){const O=C[N*2],F=C[N*2+1],L=[0,0,0];L[o]=P,L[l]=O,L[a]=F,e.pushF32(M+L[0]),e.pushF32(L[1]),e.pushF32(R+L[2]),e.pushU32(n|r<<8),e.pushF32(A[N*2]),e.pushF32(A[N*2+1]);const q=[f,h,m,v];e.pushF32(q[N])}f+m>h+v?t.push6(b+0,b+2,b+1,b+0,b+3,b+2):t.push6(b+0,b+3,b+1,b+1,b+3,b+2)}function lt(i,e,t,n,r){return n<0?!0:n>=_?!1:t<0?e?.west?.isSolidAt(D+t,n,r)??!1:t>=D?e?.east?.isSolidAt(t-D,n,r)??!1:r<0?e?.south?.isSolidAt(t,n,I+r)??!1:r>=I?e?.north?.isSolidAt(t,n,r-I)??!1:i.isSolidAt(t,n,r)}function Ee(i,e,t,n,r,s,o){const l=jr[s][o],a=lt(i,e,t+l[0],n+l[1],r+l[2])?1:0,c=lt(i,e,t+l[3],n+l[4],r+l[5])?1:0,u=lt(i,e,t+l[6],n+l[7],r+l[8])?1:0;return a&&c?0:3-(a+c+u)}function ei(i,e,t,n,r,s,o){return Ee(i,e,t,n,r,s,o)/3}function Jt(i,e,t,n,r){return n<0||n>=_?p.AIR:t<0?e?.west?.getBlock(D+t,n,r)??p.AIR:t>=D?e?.east?.getBlock(t-D,n,r)??p.AIR:r<0?e?.south?.getBlock(t,n,I+r)??p.AIR:r>=I?e?.north?.getBlock(t,n,r-I)??p.AIR:i.getBlock(t,n,r)}function ti(i,e,t,n,r,s){let o=t,l=n,a=r;switch(s){case 0:l=n+1;break;case 1:l=n-1;break;case 2:a=r+1;break;case 3:a=r-1;break;case 4:o=t+1;break;case 5:o=t-1;break}const c=Jt(i,e,o,l,a);return!qe(c)&&!Ue(c)}function ni(i,e,t,n,r,s,o){let l=t,a=n,c=r;switch(s){case 0:a=n+1;break;case 1:a=n-1;break;case 2:c=r+1;break;case 3:c=r-1;break;case 4:l=t+1;break;case 5:l=t-1;break}const u=Jt(i,e,l,a,c);return He(o)&&He(u)?s%2===0:!Ue(u)||He(u)}const fe=D/2,Oe=_/2,ye=I/2,ri=fe*Oe*ye,ii=[[0,1,0,1,1,0,1,1,1,0,1,1],[0,0,1,1,0,1,1,0,0,0,0,0],[1,0,1,0,0,1,0,1,1,1,1,1],[0,0,0,1,0,0,1,1,0,0,1,0],[1,0,0,1,0,1,1,1,1,1,1,0],[0,0,1,0,0,0,0,1,0,0,1,1]],si=[[0,0,1,0,1,1,0,1],[0,1,1,1,1,0,0,0],[1,0,0,0,0,1,1,1],[0,0,1,0,1,1,0,1],[0,0,1,0,1,1,0,1],[1,0,0,0,0,1,1,1]],oi=[[0,1,0],[0,-1,0],[0,0,1],[0,0,-1],[1,0,0],[-1,0,0]];function pe(i,e,t){return i+e*fe+t*fe*Oe}function ai(i){return i===p.LEAVES?p.GRASS_BLOCK:Ze(i)||Xe(i)||qe(i)?p.AIR:i}function li(i){const e=new Uint8Array(ri),t=new Map;for(let n=0;n<ye;n++)for(let r=0;r<Oe;r++)for(let s=0;s<fe;s++){t.clear();let o=0;for(let c=0;c<2;c++)for(let u=0;u<2;u++)for(let d=0;d<2;d++){const f=i.getBlock(s*2+d,r*2+u,n*2+c),h=ai(f);h===p.AIR?o++:t.set(h,(t.get(h)??0)+1)}if(o>=5){e[pe(s,r,n)]=p.AIR;continue}let l=p.AIR,a=0;for(const[c,u]of t)u>a&&(a=u,l=c);e[pe(s,r,n)]=l}return e}function Ht(i,e,t,n){let r=4096,s=4096,o=new Float32Array(r*7),l=new Uint32Array(o.buffer),a=new Uint32Array(s),c=0,u=0;function d(g){if(c+g>r){r=Math.max(r*2,c+g);const b=new ArrayBuffer(r*7*4);new Uint8Array(b).set(new Uint8Array(o.buffer,0,c*7*4)),o=new Float32Array(b),l=new Uint32Array(b)}}function f(g){if(u+g>s){s=Math.max(s*2,u+g);const b=new Uint32Array(s);b.set(a.subarray(0,u)),a=b}}function h(g,b,P){return b<0?p.STONE:b>=Oe?p.AIR:g>=0&&g<fe&&P>=0&&P<ye?i[pe(g,b,P)]:g<0&&n?.west?n.west[pe(fe+g,b,P)]:g>=fe&&n?.east?n.east[pe(g-fe,b,P)]:P<0&&n?.south?n.south[pe(g,b,ye+P)]:P>=ye&&n?.north?n.north[pe(g,b,P-ye)]:p.AIR}for(let g=0;g<ye;g++)for(let b=0;b<Oe;b++)for(let P=0;P<fe;P++){const w=i[pe(P,b,g)];if(w!==p.AIR&&Ue(w))for(let S=0;S<6;S++){const x=oi[S],B=P+x[0],C=b+x[1],A=g+x[2],M=h(B,C,A);if(Ue(M))continue;d(4),f(6);const R=ii[S],N=si[S],O=c;for(let F=0;F<4;F++){const L=c*7;o[L+0]=e+(P+R[F*3+0])*2,o[L+1]=(b+R[F*3+1])*2,o[L+2]=t+(g+R[F*3+2])*2,l[L+3]=S|w<<8,o[L+4]=N[F*2+0],o[L+5]=N[F*2+1],o[L+6]=1,c++}a[u++]=O+0,a[u++]=O+2,a[u++]=O+1,a[u++]=O+0,a[u++]=O+3,a[u++]=O+2}}const m=new Float32Array(o.buffer.slice(0,c*7*4)),v=new Uint32Array(a.buffer.slice(0,u*4));return{vertices:m,indices:v,indexCount:u}}class Wt{buffer;capacity;freeList=[];device;constructor(e,t,n){this.device=e,this.capacity=t,this.buffer=e.createBuffer({size:t,usage:n|GPUBufferUsage.COPY_DST}),this.freeList.push({offset:0,size:t})}allocate(e){if(e===0)return null;const t=e+3&-4;for(let n=0;n<this.freeList.length;n++){const r=this.freeList[n];if(r.size>=t){const s={offset:r.offset,size:t};return r.size===t?this.freeList.splice(n,1):(r.offset+=t,r.size-=t),s}}return null}free(e){const t={offset:e.offset,size:e.size};let n=this.freeList.length;for(let r=0;r<this.freeList.length;r++)if(this.freeList[r].offset>t.offset){n=r;break}this.freeList.splice(n,0,t),this.mergeAdjacent(n)}write(e,t){this.device.queue.writeBuffer(this.buffer,e.offset,t)}mergeAdjacent(e){if(e<this.freeList.length-1){const t=this.freeList[e],n=this.freeList[e+1];t.offset+t.size===n.offset&&(t.size+=n.size,this.freeList.splice(e+1,1))}if(e>0){const t=this.freeList[e-1],n=this.freeList[e];t.offset+t.size===n.offset&&(t.size+=n.size,this.freeList.splice(e,1))}}destroy(){this.buffer.destroy()}}const ci=`// GPU Frustum Culling Compute Shader
// Tests chunk AABBs against 6 frustum planes and writes indirect draw arguments.

struct ChunkMeta {
  // AABB: min(xyz) + indexCount in w
  aabbMin: vec4<f32>,
  // AABB: max(xyz) + firstIndex as u32 bits in w
  aabbMax: vec4<f32>,
  // indexOffset (byte offset into index buffer for baseIndex calculation)
  // vertexOffset, firstIndex, padding
  offsets: vec4<u32>,
};

struct FrustumPlanes {
  planes: array<vec4<f32>, 6>,
};

struct DrawIndexedIndirectArgs {
  indexCount: u32,
  instanceCount: u32,
  firstIndex: u32,
  baseVertex: i32,
  firstInstance: u32,
};

@group(0) @binding(0) var<storage, read> chunkMetas: array<ChunkMeta>;
@group(0) @binding(1) var<uniform> frustum: FrustumPlanes;
@group(0) @binding(2) var<storage, read_write> indirectArgs: array<DrawIndexedIndirectArgs>;
@group(0) @binding(3) var<uniform> params: vec4<u32>; // x = chunkCount

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let idx = gid.x;
  if (idx >= params.x) { return; }

  let cm = chunkMetas[idx];
  let aabbMin = cm.aabbMin.xyz;
  let aabbMax = cm.aabbMax.xyz;
  let indexCount = bitcast<u32>(cm.aabbMin.w);

  // Skip empty chunks
  if (indexCount == 0u) {
    indirectArgs[idx].indexCount = 0u;
    indirectArgs[idx].instanceCount = 0u;
    return;
  }

  // Frustum culling: test AABB against 6 planes
  var visible = true;
  for (var p = 0u; p < 6u; p = p + 1u) {
    let plane = frustum.planes[p];
    // Positive vertex: the corner most in the direction of the plane normal
    let px = select(aabbMin.x, aabbMax.x, plane.x > 0.0);
    let py = select(aabbMin.y, aabbMax.y, plane.y > 0.0);
    let pz = select(aabbMin.z, aabbMax.z, plane.z > 0.0);
    if (plane.x * px + plane.y * py + plane.z * pz + plane.w < 0.0) {
      visible = false;
      break;
    }
  }

  if (visible) {
    indirectArgs[idx].indexCount = indexCount;
    indirectArgs[idx].instanceCount = 1u;
    indirectArgs[idx].firstIndex = cm.offsets.x;
    indirectArgs[idx].baseVertex = bitcast<i32>(cm.offsets.y);
    indirectArgs[idx].firstInstance = 0u;
  } else {
    indirectArgs[idx].indexCount = 0u;
    indirectArgs[idx].instanceCount = 0u;
    indirectArgs[idx].firstIndex = 0u;
    indirectArgs[idx].baseVertex = 0i;
    indirectArgs[idx].firstInstance = 0u;
  }
}
`,ui=256*1024*1024,di=128*1024*1024,fi=4096,Yt=48,hi=20;class De{device;vertexMega;indexMega;chunkMetaBuffer;indirectArgsBuffer;frustumBuffer;paramsBuffer;cullPipeline;cullBindGroupLayout;cullBindGroup=null;freeSlots=[];activeChunkCount=0;metaData;metaDirty=!1;shaderChecks=[];static VERTEX_STRIDE=28;constructor(e,t=ui,n=di,r=fi){this.device=e,this.vertexMega=new Wt(e,t,GPUBufferUsage.VERTEX),this.indexMega=new Wt(e,n,GPUBufferUsage.INDEX);for(let o=r-1;o>=0;o--)this.freeSlots.push(o);this.chunkMetaBuffer=e.createBuffer({size:r*Yt,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.indirectArgsBuffer=e.createBuffer({size:r*hi,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.INDIRECT|GPUBufferUsage.COPY_DST}),this.frustumBuffer=e.createBuffer({size:96,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.paramsBuffer=e.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.metaData=new Float32Array(r*12);const s=e.createShaderModule({code:ci});this.shaderChecks.push(Te("frustum_cull",s)),this.cullBindGroupLayout=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:3,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}}]}),this.cullPipeline=e.createComputePipeline({layout:e.createPipelineLayout({bindGroupLayouts:[this.cullBindGroupLayout]}),compute:{module:s,entryPoint:"main"}}),this.rebuildCullBindGroup()}rebuildCullBindGroup(){this.cullBindGroup=this.device.createBindGroup({layout:this.cullBindGroupLayout,entries:[{binding:0,resource:{buffer:this.chunkMetaBuffer}},{binding:1,resource:{buffer:this.frustumBuffer}},{binding:2,resource:{buffer:this.indirectArgsBuffer}},{binding:3,resource:{buffer:this.paramsBuffer}}]})}uploadChunk(e,t,n,r){if(t.length===0)return null;const s=this.vertexMega.allocate(e.byteLength);if(!s)return null;const o=this.indexMega.allocate(t.byteLength);if(!o)return this.vertexMega.free(s),null;const l=this.freeSlots.pop();if(l===void 0)return this.vertexMega.free(s),this.indexMega.free(o),null;this.vertexMega.write(s,e.buffer),this.indexMega.write(o,t.buffer);const a=o.offset/4,c=s.offset/De.VERTEX_STRIDE,u={vertexAlloc:s,indexAlloc:o,indexCount:t.length,firstIndex:a,baseVertex:c,slotIndex:l};return this.updateChunkMeta(u,n,r),this.activeChunkCount=Math.max(this.activeChunkCount,l+1),u}freeChunk(e){this.vertexMega.free(e.vertexAlloc),this.indexMega.free(e.indexAlloc),this.freeSlots.push(e.slotIndex);const t=e.slotIndex*12;this.metaData[t+3]=0,this.metaDirty=!0}updateChunkMeta(e,t,n){const r=e.slotIndex*12,s=this.metaData,o=new Uint32Array(s.buffer);s[r+0]=t,s[r+1]=0,s[r+2]=n,o[r+3]=e.indexCount,s[r+4]=t+D,s[r+5]=_,s[r+6]=n+I,s[r+7]=0,o[r+8]=e.firstIndex,o[r+9]=e.baseVertex,o[r+10]=0,o[r+11]=0,this.metaDirty=!0}dispatchCulling(e,t){const n=new Float32Array(24);for(let s=0;s<6;s++)n[s*4+0]=t[s][0],n[s*4+1]=t[s][1],n[s*4+2]=t[s][2],n[s*4+3]=t[s][3];this.device.queue.writeBuffer(this.frustumBuffer,0,n);const r=new Uint32Array([this.activeChunkCount,0,0,0]);if(this.device.queue.writeBuffer(this.paramsBuffer,0,r),this.metaDirty){this.metaDirty=!1;const s=this.activeChunkCount*Yt;s>0&&this.device.queue.writeBuffer(this.chunkMetaBuffer,0,this.metaData.buffer,0,s)}if(this.activeChunkCount>0){const s=e.beginComputePass();s.setPipeline(this.cullPipeline),s.setBindGroup(0,this.cullBindGroup),s.dispatchWorkgroups(Math.ceil(this.activeChunkCount/64)),s.end()}}get argsBuffer(){return this.indirectArgsBuffer}get chunkCount(){return this.activeChunkCount}destroy(){this.vertexMega.destroy(),this.indexMega.destroy(),this.chunkMetaBuffer.destroy(),this.indirectArgsBuffer.destroy(),this.frustumBuffer.destroy(),this.paramsBuffer.destroy()}}function ie(i,e){return`${i},${e}`}class pi{ctx;chunks=new Map;loadQueue=[];terrainGen;caveGen;oreGen;treeGen;villageGen;vegGen;waterSim;renderDistance=T.data.rendering.general.renderDistance;totalChunks=0;totalLODChunks=0;pendingNeighborRebuilds=new Set;emissiveCache=new Map;lastCameraPos=we();frustumPlanes=Array.from({length:6},()=>new Float32Array(4));indirectRenderer;vegIndirectRenderer;lodChunks=new Map;lodLoadQueue=[];lodPendingNeighborRebuilds=new Set;lodIndirectRenderer;frameDeadline=0;constructor(e,t){this.ctx=e,this.terrainGen=new Ut(t),this.caveGen=new Ot(t),this.oreGen=new Vt(t),this.treeGen=new Nt(t,this.terrainGen),this.villageGen=new K(t,this.terrainGen),this.vegGen=new kt(t,this.terrainGen),this.waterSim=new _t(t),this.indirectRenderer=new De(e.device),this.vegIndirectRenderer=new De(e.device),this.lodIndirectRenderer=new De(e.device,32*1024*1024,16*1024*1024,2048)}get shaderChecks(){return[...this.indirectRenderer.shaderChecks,...this.vegIndirectRenderer.shaderChecks,...this.lodIndirectRenderer.shaderChecks]}get solidIndirect(){return this.indirectRenderer}get vegetationIndirect(){return this.vegIndirectRenderer}get lodIndirect(){return this.lodIndirectRenderer}getFrustumPlanes(){return this.frustumPlanes}regenerate(e){for(const t of this.chunks.values()){const n=t.chunk;n.solidAlloc&&(this.indirectRenderer.freeChunk(n.solidAlloc),n.solidAlloc=null),n.vegMegaAlloc&&(this.vegIndirectRenderer.freeChunk(n.vegMegaAlloc),n.vegMegaAlloc=null),n.destroyGPU()}this.chunks.clear(),this.loadQueue=[],this.pendingNeighborRebuilds.clear(),this.emissiveCache.clear();for(const t of this.lodChunks.values())t.chunk.lodAlloc&&(this.lodIndirectRenderer.freeChunk(t.chunk.lodAlloc),t.chunk.lodAlloc=null),t.chunk.destroyGPU();this.lodChunks.clear(),this.lodLoadQueue=[],this.lodPendingNeighborRebuilds.clear(),this.terrainGen=new Ut(e),this.caveGen=new Ot(e),this.oreGen=new Vt(e),this.treeGen=new Nt(e,this.terrainGen),this.villageGen=new K(e,this.terrainGen),this.vegGen=new kt(e,this.terrainGen),this.waterSim=new _t(e)}update(e,t){const n=Math.floor(e[0]/D),r=Math.floor(e[2]/I);this.extractFrustumPlanes(t);const s=this.renderDistance;for(let f=-s;f<=s;f++)for(let h=-s;h<=s;h++){if(f*f+h*h>s*s)continue;const m=n+f,v=r+h,g=ie(m,v);this.chunks.has(g)||(this.chunks.set(g,{chunk:new oe(m,v),state:0}),this.loadQueue.push({cx:m,cz:v}))}this.loadQueue.sort((f,h)=>{const m=this.isChunkCoordsInFrustum(f.cx,f.cz)?0:1,v=this.isChunkCoordsInFrustum(h.cx,h.cz)?0:1;if(m!==v)return m-v;const g=(f.cx-n)**2+(f.cz-r)**2,b=(h.cx-n)**2+(h.cz-r)**2;return g-b});const o=T.data.rendering.general.timeBudgetMs,l=performance.now()+o;this.frameDeadline=l;const a=new Set;for(;this.loadQueue.length>0&&performance.now()<l;){const{cx:f,cz:h}=this.loadQueue.shift(),m=ie(f,h),v=this.chunks.get(m);if(!v||v.state!==0)continue;v.state=1,this.terrainGen.generate(v.chunk),this.oreGen.generate(v.chunk),this.caveGen.generate(v.chunk),this.villageGen.generate(v.chunk),this.treeGen.generate(v.chunk),this.vegGen.generate(v.chunk),this.waterSim.generate(v.chunk),v.chunk.computeOccupancy(),v.state=2;const g=this.getNeighbors(f,h),b=zt(v.chunk,g);this.uploadSolidMesh(v.chunk,b),this.uploadWaterMesh(v.chunk,b),this.uploadVegetationMesh(v.chunk,b),v.chunk.compress(),v.state=3,a.add(m);const P=[ie(f-1,h),ie(f+1,h),ie(f,h-1),ie(f,h+1)];for(const w of P)a.has(w)||this.pendingNeighborRebuilds.add(w)}let c=0;for(const f of this.pendingNeighborRebuilds){if(c>=2)break;const h=this.chunks.get(f);if(!h||h.state!==3){this.pendingNeighborRebuilds.delete(f);continue}const[m,v]=f.split(",").map(Number);this.rebuildNeighborIfReady(m,v),this.pendingNeighborRebuilds.delete(f),c++}const u=s+2,d=[];for(const[f,h]of this.chunks){const m=h.chunk.chunkX-n,v=h.chunk.chunkZ-r;m*m+v*v>u*u&&(h.chunk.solidAlloc&&(this.indirectRenderer.freeChunk(h.chunk.solidAlloc),h.chunk.solidAlloc=null),h.chunk.vegMegaAlloc&&(this.vegIndirectRenderer.freeChunk(h.chunk.vegMegaAlloc),h.chunk.vegMegaAlloc=null),h.chunk.destroyGPU(),d.push(f))}for(const f of d)this.chunks.delete(f),this.emissiveCache.delete(f),this.pendingNeighborRebuilds.delete(f);this.totalChunks=this.chunks.size,this.updateLOD(n,r)}reuploadMesh(e,t,n,r,s,o,l){return t&&e.freeChunk(t),s>0?e.uploadChunk(n,r,o,l):null}uploadSolidMesh(e,t){e.solidAlloc=this.reuploadMesh(this.indirectRenderer,e.solidAlloc,t.vertices,t.indices,t.indexCount,e.worldOffsetX,e.worldOffsetZ)}rebuildNeighborIfReady(e,t){const n=ie(e,t),r=this.chunks.get(n);if(!r||r.state!==3)return;const s=this.getNeighbors(e,t),o=zt(r.chunk,s);this.uploadSolidMesh(r.chunk,o),this.uploadWaterMesh(r.chunk,o),this.uploadVegetationMesh(r.chunk,o)}getNeighbors(e,t){return{north:this.getChunk(e,t+1),south:this.getChunk(e,t-1),east:this.getChunk(e+1,t),west:this.getChunk(e-1,t)}}getChunk(e,t){const n=this.chunks.get(ie(e,t));return n&&n.state>=2?n.chunk:null}getDrawCalls(){const e=[];for(const t of this.chunks.values()){if(t.state!==3)continue;const n=t.chunk;n.solidAlloc&&this.isChunkInFrustum(n)&&e.push({vertexBuffer:this.indirectRenderer.vertexMega.buffer,indexBuffer:this.indirectRenderer.indexMega.buffer,indexCount:n.solidAlloc.indexCount,firstIndex:n.solidAlloc.firstIndex,baseVertex:n.solidAlloc.baseVertex})}return e}uploadWaterMesh(e,t){e.waterVertexBuffer?.destroy(),e.waterIndexBuffer?.destroy(),e.waterVertexBuffer=null,e.waterIndexBuffer=null,e.waterIndexCount=0,t.waterIndexCount>0&&(e.waterVertexBuffer=this.ctx.device.createBuffer({size:t.waterVertices.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),this.ctx.device.queue.writeBuffer(e.waterVertexBuffer,0,t.waterVertices.buffer),e.waterIndexBuffer=this.ctx.device.createBuffer({size:t.waterIndices.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST}),this.ctx.device.queue.writeBuffer(e.waterIndexBuffer,0,t.waterIndices.buffer),e.waterIndexCount=t.waterIndexCount)}uploadVegetationMesh(e,t){e.vegMegaAlloc=this.reuploadMesh(this.vegIndirectRenderer,e.vegMegaAlloc,t.vegVertices,t.vegIndices,t.vegIndexCount,e.worldOffsetX,e.worldOffsetZ)}getVegetationDrawCalls(){const e=[];for(const t of this.chunks.values()){if(t.state!==3)continue;const n=t.chunk;n.vegMegaAlloc&&this.isChunkInFrustum(n)&&e.push({vertexBuffer:this.vegIndirectRenderer.vertexMega.buffer,indexBuffer:this.vegIndirectRenderer.indexMega.buffer,indexCount:n.vegMegaAlloc.indexCount,firstIndex:n.vegMegaAlloc.firstIndex,baseVertex:n.vegMegaAlloc.baseVertex})}return e}getWaterDrawCalls(){const e=[];for(const t of this.chunks.values()){if(t.state!==3)continue;const n=t.chunk;!n.waterVertexBuffer||!n.waterIndexBuffer||n.waterIndexCount===0||this.isChunkInFrustum(n)&&e.push({vertexBuffer:n.waterVertexBuffer,indexBuffer:n.waterIndexBuffer,indexCount:n.waterIndexCount})}return e}collectEmissiveBlocks(e){const t=[],n=e.worldOffsetX,r=e.worldOffsetZ;for(let s=0;s<D;s++)for(let o=0;o<I;o++)for(let l=0;l<_;l++){const a=e.getBlock(s,l,o);if(a===0)continue;const c=$e(a);if(c.emissive<=0)continue;const u=c.color;let d;c.emissive>=.8?d=16:c.emissive>=.1?d=6:d=3;let f=n+s+.5,h=l+.5,m=r+o+.5;if(Xe(a))switch(h=l+.75,e.getBlockMeta(s,l,o)){case ne.NORTH:m=r+o+.875;break;case ne.SOUTH:m=r+o+.125;break;case ne.EAST:f=n+s+.875;break;case ne.WEST:f=n+s+.125;break}t.push({position:[f,h,m],color:[u[0]/255,u[1]/255,u[2]/255],intensity:c.emissive*2,radius:d})}return t}getPointLights(e){const t=[];for(const[o,l]of this.chunks){if(l.state!==3)continue;let a=this.emissiveCache.get(o);a||(a=this.collectEmissiveBlocks(l.chunk),this.emissiveCache.set(o,a));for(const c of a)t.push(c)}const n=e[0],r=e[1],s=e[2];return t.length>dt&&(t.sort((o,l)=>{const a=(o.position[0]-n)**2+(o.position[1]-r)**2+(o.position[2]-s)**2,c=(l.position[0]-n)**2+(l.position[1]-r)**2+(l.position[2]-s)**2;return a-c}),t.length=dt),t}extractFrustumPlanes(e){this.frustumPlanes[0][0]=e[3]+e[0],this.frustumPlanes[0][1]=e[7]+e[4],this.frustumPlanes[0][2]=e[11]+e[8],this.frustumPlanes[0][3]=e[15]+e[12],this.frustumPlanes[1][0]=e[3]-e[0],this.frustumPlanes[1][1]=e[7]-e[4],this.frustumPlanes[1][2]=e[11]-e[8],this.frustumPlanes[1][3]=e[15]-e[12],this.frustumPlanes[2][0]=e[3]+e[1],this.frustumPlanes[2][1]=e[7]+e[5],this.frustumPlanes[2][2]=e[11]+e[9],this.frustumPlanes[2][3]=e[15]+e[13],this.frustumPlanes[3][0]=e[3]-e[1],this.frustumPlanes[3][1]=e[7]-e[5],this.frustumPlanes[3][2]=e[11]-e[9],this.frustumPlanes[3][3]=e[15]-e[13],this.frustumPlanes[4][0]=e[3]+e[2],this.frustumPlanes[4][1]=e[7]+e[6],this.frustumPlanes[4][2]=e[11]+e[10],this.frustumPlanes[4][3]=e[15]+e[14],this.frustumPlanes[5][0]=e[3]-e[2],this.frustumPlanes[5][1]=e[7]-e[6],this.frustumPlanes[5][2]=e[11]-e[10],this.frustumPlanes[5][3]=e[15]-e[14];for(const t of this.frustumPlanes){const n=Math.sqrt(t[0]*t[0]+t[1]*t[1]+t[2]*t[2]);n>0&&(t[0]/=n,t[1]/=n,t[2]/=n,t[3]/=n)}}isChunkInFrustum(e){const t=e.worldOffsetX,n=0,r=e.worldOffsetZ,s=t+D,o=_,l=r+I;for(const a of this.frustumPlanes){const c=a[0]>0?s:t,u=a[1]>0?o:n,d=a[2]>0?l:r;if(a[0]*c+a[1]*u+a[2]*d+a[3]<0)return!1}return!0}isChunkCoordsInFrustum(e,t){const n=e*D,r=0,s=t*I,o=n+D,l=_,a=s+I;for(const c of this.frustumPlanes){const u=c[0]>0?o:n,d=c[1]>0?l:r,f=c[2]>0?a:s;if(c[0]*u+c[1]*d+c[2]*f+c[3]<0)return!1}return!0}updateLOD(e,t){const n=T.data.rendering.lod;if(!n.enabled){if(this.lodChunks.size>0){for(const d of this.lodChunks.values())d.chunk.lodAlloc&&(this.lodIndirectRenderer.freeChunk(d.chunk.lodAlloc),d.chunk.lodAlloc=null),d.chunk.destroyGPU();this.lodChunks.clear(),this.lodLoadQueue=[],this.lodPendingNeighborRebuilds.clear()}this.totalLODChunks=0;return}const r=this.renderDistance,s=n.renderDistance,o=r+s;if(this.loadQueue.length>0){this.totalLODChunks=this.lodChunks.size;return}for(let d=-o;d<=o;d++)for(let f=-o;f<=o;f++){const h=d*d+f*f;if(h<=r*r||h>o*o)continue;const m=e+d,v=t+f,g=ie(m,v);this.lodChunks.has(g)||this.chunks.has(g)||(this.lodChunks.set(g,{chunk:new oe(m,v),lodBlocks:new Uint8Array(0),state:0}),this.lodLoadQueue.push({cx:m,cz:v}))}this.lodLoadQueue.sort((d,f)=>{const h=this.isChunkCoordsInFrustum(d.cx,d.cz)?0:1,m=this.isChunkCoordsInFrustum(f.cx,f.cz)?0:1;if(h!==m)return h-m;const v=(d.cx-e)**2+(d.cz-t)**2,g=(f.cx-e)**2+(f.cz-t)**2;return v-g});const l=new Set;for(;this.lodLoadQueue.length>0&&performance.now()<this.frameDeadline;){const{cx:d,cz:f}=this.lodLoadQueue.shift(),h=ie(d,f),m=this.lodChunks.get(h);if(!m||m.state!==0)continue;const v=d-e,g=f-t;if(v*v+g*g<=r*r){this.lodChunks.delete(h);continue}m.state=1,this.terrainGen.generate(m.chunk),this.oreGen.generate(m.chunk),this.caveGen.generate(m.chunk),this.villageGen.generate(m.chunk),this.treeGen.generate(m.chunk),m.lodBlocks=li(m.chunk),m.state=2;const b=this.getLODNeighborBlocks(d,f),P=Ht(m.lodBlocks,m.chunk.worldOffsetX,m.chunk.worldOffsetZ,b);m.chunk.lodAlloc=this.reuploadMesh(this.lodIndirectRenderer,m.chunk.lodAlloc,P.vertices,P.indices,P.indexCount,m.chunk.worldOffsetX,m.chunk.worldOffsetZ),m.chunk.compress(),m.state=3,l.add(h);const w=[ie(d-1,f),ie(d+1,f),ie(d,f-1),ie(d,f+1)];for(const S of w)l.has(S)||this.lodPendingNeighborRebuilds.add(S)}let a=0;for(const d of this.lodPendingNeighborRebuilds){if(a>=2)break;const f=this.lodChunks.get(d);if(!f||f.state!==3){this.lodPendingNeighborRebuilds.delete(d);continue}const[h,m]=d.split(",").map(Number);this.rebuildLODNeighbor(h,m,f),this.lodPendingNeighborRebuilds.delete(d),a++}const c=o+2,u=[];for(const[d,f]of this.lodChunks){const h=f.chunk.chunkX-e,m=f.chunk.chunkZ-t,v=h*h+m*m;let g=!1;if(v>c*c)g=!0;else if(v<=r*r){const b=this.chunks.get(d);b&&b.state===3&&(g=!0)}g&&(f.chunk.lodAlloc&&(this.lodIndirectRenderer.freeChunk(f.chunk.lodAlloc),f.chunk.lodAlloc=null),f.chunk.destroyGPU(),u.push(d))}for(const d of u)this.lodChunks.delete(d),this.lodPendingNeighborRebuilds.delete(d);this.totalLODChunks=this.lodChunks.size}getLODNeighborBlocks(e,t){const n=(r,s)=>{const o=this.lodChunks.get(ie(r,s));return o&&o.state>=2&&o.lodBlocks.length>0?o.lodBlocks:null};return{north:n(e,t+1),south:n(e,t-1),east:n(e+1,t),west:n(e-1,t)}}rebuildLODNeighbor(e,t,n){if(n.lodBlocks.length===0)return;const r=this.getLODNeighborBlocks(e,t),s=Ht(n.lodBlocks,n.chunk.worldOffsetX,n.chunk.worldOffsetZ,r);n.chunk.lodAlloc=this.reuploadMesh(this.lodIndirectRenderer,n.chunk.lodAlloc,s.vertices,s.indices,s.indexCount,n.chunk.worldOffsetX,n.chunk.worldOffsetZ)}getLODDrawCalls(){const e=[];for(const[t,n]of this.lodChunks){if(n.state!==3)continue;const r=n.chunk;if(!r.lodAlloc||!this.isChunkInFrustum(r))continue;const s=this.chunks.get(t);s&&s.state===3&&s.chunk.solidAlloc||e.push({vertexBuffer:this.lodIndirectRenderer.vertexMega.buffer,indexBuffer:this.lodIndirectRenderer.indexMega.buffer,indexCount:r.lodAlloc.indexCount,firstIndex:r.lodAlloc.firstIndex,baseVertex:r.lodAlloc.baseVertex})}return e}}class mi{timeOfDay=.3;paused=!1;sunDir=he(0,1,0);moonDir=he(0,-1,0);sunColor=new Float32Array([1,.95,.85]);sunIntensity=3;ambientColor=new Float32Array([.1,.13,.18]);ambientGroundFactor=.3;moonPhase=.5;moonBrightness=1;dayCount=4;update(e){if(!this.paused){const t=this.timeOfDay;this.timeOfDay+=e/T.data.environment.dayDurationSeconds,this.timeOfDay-=Math.floor(this.timeOfDay),t>.9&&this.timeOfDay<.1&&this.dayCount++}this.updateMoonPhase(),this.updateSunPosition(),this.updateLighting()}setTime(e){this.dayCount=Math.floor(e),this.timeOfDay=e-this.dayCount,this.paused=!0,this.updateMoonPhase(),this.updateSunPosition(),this.updateLighting()}updateMoonPhase(){this.moonPhase=this.dayCount%8/8,this.moonBrightness=.5*(1-Math.cos(this.moonPhase*Math.PI*2))}updateSunPosition(){const e=(this.timeOfDay-.25)*Math.PI*2,t=Math.cos(e)*.5,n=Math.sin(e),r=Math.cos(e)*.3;Ye(this.sunDir,he(t,n,r)),un(this.moonDir,this.sunDir)}updateLighting(){const e=this.sunDir[1];if(e>.1){const t=Math.min((e-.1)/.3,1);this.sunColor[0]=1,this.sunColor[1]=.92+.08*t,this.sunColor[2]=.8+.15*t,this.sunIntensity=.9+.3*t,this.ambientColor[0]=.06+.09*t,this.ambientColor[1]=.07+.11*t,this.ambientColor[2]=.1+.12*t,this.ambientGroundFactor=.28+.17*t}else if(e>-.1){const t=(e+.1)/.2;this.sunColor[0]=.35+.65*t,this.sunColor[1]=.45+.47*t,this.sunColor[2]=.7+.1*t,this.sunIntensity=.15+.85*t,this.ambientColor[0]=.03+.05*t,this.ambientColor[1]=.04+.06*t,this.ambientColor[2]=.08+.07*t,this.ambientGroundFactor=.15+.15*t}else{this.sunColor[0]=.35,this.sunColor[1]=.45,this.sunColor[2]=.7,this.sunIntensity=.03+.12*this.moonBrightness;const t=this.moonBrightness;this.ambientColor[0]=.015+.015*t,this.ambientColor[1]=.02+.02*t,this.ambientColor[2]=.05+.03*t,this.ambientGroundFactor=.1+.05*t}}get trueSunHeight(){return Math.sin((this.timeOfDay-.25)*Math.PI*2)}get lightDir(){return this.sunDir[1]>-.1?this.sunDir:this.moonDir}getHour(){return this.timeOfDay*24}getTimeString(){const e=Math.floor(this.timeOfDay*24*60),t=Math.floor(e/60),n=e%60;return`${String(t).padStart(2,"0")}:${String(n).padStart(2,"0")}`}}var Fe=(i=>(i[i.CLEAR=0]="CLEAR",i[i.RAIN=1]="RAIN",i[i.SNOW=2]="SNOW",i))(Fe||{});const gi=.6,vi=.85,xi=.5,yi=.5,bi=1,wi=1.5;class Si{currentWeather=0;intensity=0;targetIntensity=0;transitionSpeed=.3;weatherTimer=0;weatherDuration=60;autoWeather=!1;update(e){if(this.autoWeather&&(this.weatherTimer+=e,this.weatherTimer>=this.weatherDuration)){this.weatherTimer=0;const t=Math.random();t<gi?(this.currentWeather=0,this.targetIntensity=0):t<vi?(this.currentWeather=1,this.targetIntensity=xi+Math.random()*yi):(this.currentWeather=2,this.targetIntensity=.3+Math.random()*.4),this.weatherDuration=30+Math.random()*90}this.intensity+=(this.targetIntensity-this.intensity)*Math.min(1,e*this.transitionSpeed)}getFogDensityMultiplier(){return bi+this.intensity*wi}getAmbientDarkening(){return 1-this.intensity*.3}}class Pi{el;frames=0;lastFpsTime=0;fps=0;lastError="";drawInfo="";visible=!0;constructor(){this.el=document.getElementById("hud"),this.lastFpsTime=performance.now()}toggle(){this.visible=!this.visible,this.el&&(this.el.style.display=this.visible?"":"none")}setError(e){this.lastError=e}setDrawInfo(e,t){this.drawInfo=`Draws: ${e} Water: ${t}`}update(e,t,n,r,s,o=0){this.frames++;const l=performance.now();l-this.lastFpsTime>=1e3&&(this.fps=this.frames,this.frames=0,this.lastFpsTime=l),this.el&&(this.el.innerHTML=`FPS: ${this.fps}<br>Pos: ${e[0].toFixed(1)}, ${e[1].toFixed(1)}, ${e[2].toFixed(1)}<br>Chunks: ${t}${o>0?` + ${o} LOD`:""}<br>${this.drawInfo}<br>Seed: ${n}<br>Speed: ${r.toFixed(1)}`+(s?`<br>Time: ${s}`:"")+(this.lastError?`<br><span style="color:red">${this.lastError}</span>`:""))}}const Ti=`
.inspector-toggle {
  position: fixed; top: 8px; right: 8px; z-index: 1001;
  width: 32px; height: 32px; border: none; border-radius: 4px;
  background: #383838; color: #ccc; font-size: 18px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-family: monospace;
}
.inspector-toggle:hover { background: #4a4a4a; }
.inspector-toggle.open { right: 328px; }

.inspector-panel {
  position: fixed; top: 0; right: 0; width: 320px; height: 100vh;
  background: #383838; color: #ddd; z-index: 1000;
  font-family: 'Segoe UI', system-ui, sans-serif; font-size: 12px;
  display: flex; flex-direction: column;
  box-shadow: -2px 0 8px rgba(0,0,0,0.4);
  overflow: hidden;
  transition: transform 0.2s ease;
}
.inspector-panel.hidden { transform: translateX(100%); pointer-events: none; }

.inspector-tab-bar {
  display: flex; background: #2d2d2d; border-bottom: 1px solid #555;
  flex-shrink: 0;
}
.inspector-tab-btn {
  flex: 1; padding: 8px 4px; border: none; background: transparent;
  color: #aaa; font-size: 11px; cursor: pointer;
  border-bottom: 2px solid transparent;
  font-family: inherit;
}
.inspector-tab-btn:hover { color: #ddd; background: #3a3a3a; }
.inspector-tab-btn.active { color: #fff; border-bottom-color: #5b9bd5; background: #383838; }

.inspector-tab-content {
  flex: 1; overflow-y: auto; padding: 4px 0;
}
.inspector-tab-content::-webkit-scrollbar { width: 6px; }
.inspector-tab-content::-webkit-scrollbar-track { background: #2d2d2d; }
.inspector-tab-content::-webkit-scrollbar-thumb { background: #555; border-radius: 3px; }

.inspector-section {
  margin: 2px 0;
}
.inspector-section-header {
  display: flex; align-items: center; padding: 5px 8px;
  background: #3a3a3a; cursor: pointer; user-select: none;
  border-top: 1px solid #444; border-bottom: 1px solid #333;
  font-weight: 600; font-size: 11px;
}
.inspector-section-header:hover { background: #424242; }
.inspector-section-arrow {
  display: inline-block; width: 12px; font-size: 8px; color: #888;
  transition: transform 0.15s ease; margin-right: 4px;
}
.inspector-section-header.collapsed .inspector-section-arrow { transform: rotate(-90deg); }
.inspector-section-body { padding: 4px 8px; }
.inspector-section-body.collapsed { display: none; }

.inspector-field {
  display: flex; align-items: center; margin: 3px 0; min-height: 22px;
}
.inspector-field-label {
  width: 40%; color: #bbb; font-size: 11px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  padding-right: 6px;
}
.inspector-field-control {
  width: 60%; display: flex; align-items: center; gap: 4px;
}
.inspector-field input[type="range"] {
  flex: 1; height: 4px; -webkit-appearance: none; appearance: none;
  background: #555; border-radius: 2px; outline: none;
}
.inspector-field input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none; width: 12px; height: 12px;
  background: #8ab4f8; border-radius: 50%; cursor: pointer;
}
.inspector-field input[type="number"] {
  width: 60px; background: #2d2d2d; border: 1px solid #555;
  color: #ddd; padding: 2px 4px; border-radius: 3px; font-size: 11px;
  font-family: inherit;
}
.inspector-field input[type="checkbox"] {
  accent-color: #5b9bd5;
}
.inspector-field select {
  flex: 1; background: #2d2d2d; border: 1px solid #555;
  color: #ddd; padding: 2px 4px; border-radius: 3px; font-size: 11px;
  font-family: inherit;
}
.inspector-field .val-display {
  min-width: 36px; text-align: right; font-size: 11px; color: #8ab4f8;
  font-family: 'Consolas', monospace;
}

.inspector-btn {
  display: block; width: calc(100% - 16px); margin: 6px 8px;
  padding: 6px 12px; border: 1px solid #668; border-radius: 3px;
  background: #446; color: #fff; font-size: 12px; cursor: pointer;
  font-family: inherit;
}
.inspector-btn:hover { background: #558; }
.inspector-btn.dirty { background: #a65d00; border-color: #d48800; }

.inspector-subsection { margin-left: 8px; }
.inspector-subsection .inspector-section-header {
  font-weight: normal; font-size: 11px; padding: 3px 8px;
  background: #363636;
}

.inspector-field-error {
  animation: field-error-flash 0.8s ease;
}
@keyframes field-error-flash {
  0%, 100% { background: transparent; }
  20% { background: rgba(220, 50, 50, 0.35); }
  50% { background: rgba(220, 50, 50, 0.15); }
}
`;let jt=!1;function Bi(){if(jt)return;jt=!0;const i=document.createElement("style");i.textContent=Ti,document.head.appendChild(i)}class Ci{panel;toggleBtn;tabBar;tabs=new Map;activeTab=null;isOpen=!1;onToggleClick;onF1KeyDown;constructor(){Bi(),this.onToggleClick=()=>this.toggle(),this.onF1KeyDown=e=>{e.code==="F1"&&(e.preventDefault(),this.toggle())},this.toggleBtn=document.createElement("button"),this.toggleBtn.className="inspector-toggle",this.toggleBtn.textContent="⚙",this.toggleBtn.title="Settings (F1)",this.toggleBtn.addEventListener("click",this.onToggleClick),document.body.appendChild(this.toggleBtn),this.panel=document.createElement("div"),this.panel.className="inspector-panel hidden",document.body.appendChild(this.panel),this.tabBar=document.createElement("div"),this.tabBar.className="inspector-tab-bar",this.panel.appendChild(this.tabBar),document.addEventListener("keydown",this.onF1KeyDown)}destroy(){this.toggleBtn.removeEventListener("click",this.onToggleClick),document.removeEventListener("keydown",this.onF1KeyDown),this.toggleBtn.remove(),this.panel.remove()}addTab(e,t){const n=document.createElement("button");n.className="inspector-tab-btn",n.textContent=e,n.addEventListener("click",()=>this.selectTab(e)),this.tabBar.appendChild(n),this.panel.appendChild(t.el),this.tabs.set(e,{btn:n,tab:t}),this.tabs.size===1&&this.selectTab(e)}selectTab(e){if(this.activeTab!==e){for(const[t,n]of this.tabs)t===e?(n.btn.classList.add("active"),n.tab.show()):(n.btn.classList.remove("active"),n.tab.hide());this.activeTab=e}}toggle(){this.isOpen=!this.isOpen,this.panel.classList.toggle("hidden",!this.isOpen),this.toggleBtn.classList.toggle("open",this.isOpen)}}function ze(i,e){e.success||(console.warn(`[Config] ${e.error}`),i.classList.add("inspector-field-error"),setTimeout(()=>i.classList.remove("inspector-field-error"),800))}function Gi(i){const e=document.createElement("div");e.className="inspector-field";const t=document.createElement("div");t.className="inspector-field-label",t.textContent=i.label,t.title=i.configPath,e.appendChild(t);const n=document.createElement("div");n.className="inspector-field-control";const r=T.get(i.configPath),s=i.toDisplay??(a=>a),o=i.fromDisplay??(a=>a),l=s(r);switch(i.type){case"slider":{const a=document.createElement("input");a.type="range",a.min=String(i.min??0),a.max=String(i.max??100),a.step=String(i.step??(i.max!=null&&i.max<=1?.01:1)),a.value=String(l);const c=document.createElement("span");c.className="val-display",c.textContent=Ke(l,i.step),a.addEventListener("input",()=>{const u=parseFloat(a.value),d=T.set(i.configPath,o(u));d.success?c.textContent=Ke(u,i.step):ze(e,d)}),n.appendChild(a),n.appendChild(c);break}case"number":{const a=document.createElement("input");a.type="number",a.value=String(l),i.min!=null&&(a.min=String(i.min)),i.max!=null&&(a.max=String(i.max)),i.step!=null&&(a.step=String(i.step)),a.addEventListener("input",()=>{const c=parseFloat(a.value);if(!isNaN(c)){const u=T.set(i.configPath,o(c));ze(e,u)}}),n.appendChild(a);break}case"toggle":{const a=document.createElement("input");a.type="checkbox",a.checked=!!l,a.addEventListener("change",()=>{const c=T.set(i.configPath,a.checked);ze(e,c)}),n.appendChild(a);break}case"dropdown":{const a=document.createElement("select");for(const c of i.options??[]){const u=document.createElement("option");u.value=String(c.value),u.textContent=c.label,String(c.value)===String(l)&&(u.selected=!0),a.appendChild(u)}a.addEventListener("change",()=>{const c=isNaN(Number(a.value))?a.value:Number(a.value),u=T.set(i.configPath,c);ze(e,u)}),n.appendChild(a);break}}return e.appendChild(n),e}function ct(i,e,t,n,r,s){const o=document.createElement("div");o.className="inspector-field";const l=document.createElement("div");l.className="inspector-field-label",l.textContent=i,o.appendChild(l);const a=document.createElement("div");a.className="inspector-field-control";const c=document.createElement("input");c.type="range",c.min=String(t),c.max=String(n),c.step=String(r),c.value=String(e);const u=document.createElement("span");return u.className="val-display",u.textContent=Ke(e,r),c.addEventListener("input",()=>{const d=parseFloat(c.value);u.textContent=Ke(d,r),s(d)}),a.appendChild(c),a.appendChild(u),o.appendChild(a),{row:o,slider:c,display:u}}function Ai(i,e,t){const n=document.createElement("div");n.className="inspector-field";const r=document.createElement("div");r.className="inspector-field-label",r.textContent=i,n.appendChild(r);const s=document.createElement("div");s.className="inspector-field-control";const o=document.createElement("input");return o.type="checkbox",o.checked=e,o.addEventListener("change",()=>t(o.checked)),s.appendChild(o),n.appendChild(s),{row:n,checkbox:o}}function Li(i,e,t,n){const r=document.createElement("div");r.className="inspector-field";const s=document.createElement("div");s.className="inspector-field-label",s.textContent=i,r.appendChild(s);const o=document.createElement("div");o.className="inspector-field-control";const l=document.createElement("select");for(const a of e){const c=document.createElement("option");c.value=String(a.value),c.textContent=a.label,String(a.value)===String(t)&&(c.selected=!0),l.appendChild(c)}return l.addEventListener("change",()=>n(l.value)),o.appendChild(l),r.appendChild(o),{row:r,select:l}}function Ke(i,e){if(e!=null&&e<1){const t=Math.max(1,Math.ceil(-Math.log10(e)));return i.toFixed(t)}return i===Math.floor(i)?String(i):i.toFixed(2)}class ht{el;body;header;isSubSection;constructor(e,t=!1,n=!1){this.isSubSection=n,this.el=document.createElement("div"),this.el.className=n?"inspector-section inspector-subsection":"inspector-section",this.header=document.createElement("div"),this.header.className="inspector-section-header"+(t?" collapsed":""),this.header.innerHTML=`<span class="inspector-section-arrow">▼</span>${e}`,this.el.appendChild(this.header),this.body=document.createElement("div"),this.body.className="inspector-section-body"+(t?" collapsed":""),this.el.appendChild(this.body),this.header.addEventListener("click",()=>{const r=this.header.classList.toggle("collapsed");this.body.classList.toggle("collapsed",r)})}addField(e){const t=Gi(e);return this.body.appendChild(t),t}addSubSection(e,t=!0){const n=new ht(e,t,!0);return this.body.appendChild(n.el),n}addElement(e){this.body.appendChild(e)}}class Qe{el;constructor(){this.el=document.createElement("div"),this.el.className="inspector-tab-content",this.el.style.display="none"}addSection(e,t=!1){const n=new ht(e,t);return this.el.appendChild(n.el),n}addButton(e,t){const n=document.createElement("button");return n.className="inspector-btn",n.textContent=e,n.addEventListener("click",t),this.el.appendChild(n),n}show(){this.el.style.display=""}hide(){this.el.style.display="none"}}class Mi extends Qe{seedInput=null}function Ri(i){const e=new Mi,t=e.addSection("Noise");t.addField({type:"slider",label:"Octaves",configPath:"terrain.noise.octaves",min:1,max:8,step:1}),t.addField({type:"slider",label:"Persistence",configPath:"terrain.noise.persistence",min:0,max:1,step:.05}),t.addField({type:"slider",label:"Lacunarity",configPath:"terrain.noise.lacunarity",min:1,max:4,step:.1}),t.addField({type:"slider",label:"Scale",configPath:"terrain.noise.scale",min:10,max:200,step:1});const n=e.addSection("Height");n.addField({type:"slider",label:"Sea Level",configPath:"terrain.height.seaLevel",min:10,max:100,step:1}),n.addField({type:"slider",label:"Min Height",configPath:"terrain.height.minHeight",min:1,max:50,step:1}),n.addField({type:"slider",label:"Max Height",configPath:"terrain.height.maxHeight",min:50,max:128,step:1}),n.addField({type:"slider",label:"Dirt Depth",configPath:"terrain.height.dirtLayerDepth",min:1,max:10,step:1});const r=e.addSection("Biomes",!0);r.addField({type:"slider",label:"Temp Scale",configPath:"terrain.biomes.temperatureScale",min:50,max:500,step:10}),r.addField({type:"slider",label:"Humid Scale",configPath:"terrain.biomes.humidityScale",min:50,max:500,step:10}),r.addField({type:"slider",label:"Cont. Scale",configPath:"terrain.biomes.continentalnessScale",min:100,max:800,step:10}),r.addField({type:"slider",label:"Height Var.",configPath:"terrain.biomes.heightVariationScale",min:5,max:100,step:1}),r.addField({type:"slider",label:"Ocean Thresh.",configPath:"terrain.biomes.oceanThreshold",min:0,max:.8,step:.05});const s=e.addSection("Caves",!0);s.addField({type:"slider",label:"Count",configPath:"terrain.caves.count",min:0,max:30,step:1}),s.addField({type:"slider",label:"Min Length",configPath:"terrain.caves.minLength",min:10,max:200,step:5}),s.addField({type:"slider",label:"Max Length",configPath:"terrain.caves.maxLength",min:50,max:400,step:5}),s.addField({type:"slider",label:"Min Radius",configPath:"terrain.caves.minRadius",min:.5,max:5,step:.25}),s.addField({type:"slider",label:"Max Radius",configPath:"terrain.caves.maxRadius",min:1,max:8,step:.25}),s.addField({type:"slider",label:"Min Y",configPath:"terrain.caves.minY",min:1,max:50,step:1}),s.addField({type:"slider",label:"Max Y",configPath:"terrain.caves.maxY",min:20,max:100,step:1});const o=e.addSection("Water Table",!0);o.addField({type:"slider",label:"Base Level",configPath:"terrain.caves.waterTable.baseLevel",min:0,max:60,step:1}),o.addField({type:"slider",label:"Amplitude",configPath:"terrain.caves.waterTable.amplitude",min:0,max:30,step:1}),o.addField({type:"slider",label:"Noise Scale",configPath:"terrain.caves.waterTable.noiseScale",min:10,max:300,step:5});const l=e.addSection("Ores",!0),a=["coal","iron","gold","diamond"];for(const v of a){const g=l.addSubSection(v.charAt(0).toUpperCase()+v.slice(1));g.addField({type:"number",label:"Min Y",configPath:`terrain.ores.${v}.minY`,min:1,max:128,step:1}),g.addField({type:"number",label:"Max Y",configPath:`terrain.ores.${v}.maxY`,min:1,max:128,step:1}),g.addField({type:"number",label:"Attempts",configPath:`terrain.ores.${v}.attempts`,min:0,max:50,step:1}),g.addField({type:"number",label:"Vein Size",configPath:`terrain.ores.${v}.veinSize`,min:1,max:20,step:1})}const c=e.addSection("Trees",!0);c.addField({type:"slider",label:"Per Chunk",configPath:"terrain.trees.perChunk",min:0,max:15,step:1}),c.addField({type:"slider",label:"Min Trunk",configPath:"terrain.trees.minTrunkHeight",min:2,max:10,step:1}),c.addField({type:"slider",label:"Max Trunk",configPath:"terrain.trees.maxTrunkHeight",min:3,max:15,step:1}),c.addField({type:"slider",label:"Leaf Decay",configPath:"terrain.trees.leafDecayChance",min:0,max:1,step:.05});const u=document.createElement("div");u.className="inspector-field",u.style.padding="4px 8px";const d=document.createElement("div");d.className="inspector-field-label",d.textContent="Seed";const f=document.createElement("div");f.className="inspector-field-control";const h=document.createElement("input");h.type="number",h.value="0",h.style.flex="1",f.appendChild(h),u.appendChild(d),u.appendChild(f),e.el.appendChild(u);const m=e.addButton("Regenerate Terrain",()=>{const v=parseInt(h.value)||0;i(v),T.clearDirty("terrain"),m.classList.remove("dirty")});return T.onChange(v=>{v.startsWith("terrain.")&&m.classList.add("dirty")}),e.seedInput=h,e}function Ei(){const i=new Qe,e=i.addSection("General");e.addField({type:"slider",label:"Render Dist",configPath:"rendering.general.renderDistance",min:2,max:24,step:1}),e.addField({type:"slider",label:"Time Budget (ms)",configPath:"rendering.general.timeBudgetMs",min:2,max:32,step:1});const t=i.addSection("LOD");t.addField({type:"toggle",label:"Enabled",configPath:"rendering.lod.enabled"}),t.addField({type:"slider",label:"LOD Distance",configPath:"rendering.lod.renderDistance",min:4,max:24,step:1});const n=i.addSection("Shadows",!0);n.addField({type:"number",label:"Cascade Count *",configPath:"rendering.shadows.cascadeCount",min:1,max:4,step:1}),n.addField({type:"number",label:"Map Size *",configPath:"rendering.shadows.mapSize",min:512,max:4096,step:512}),n.addField({type:"slider",label:"Split 1",configPath:"rendering.shadows.cascadeSplits.0",min:5,max:100,step:5}),n.addField({type:"slider",label:"Split 2",configPath:"rendering.shadows.cascadeSplits.1",min:20,max:200,step:5}),n.addField({type:"slider",label:"Split 3",configPath:"rendering.shadows.cascadeSplits.2",min:50,max:500,step:10});const r=i.addSection("SSAO",!0);r.addField({type:"slider",label:"Radius",configPath:"rendering.ssao.radius",min:.1,max:5,step:.1}),r.addField({type:"slider",label:"Bias",configPath:"rendering.ssao.bias",min:.001,max:.1,step:.001}),r.addField({type:"number",label:"Kernel Size *",configPath:"rendering.ssao.kernelSize",min:4,max:64,step:4});const s=i.addSection("Bloom");s.addField({type:"slider",label:"Threshold",configPath:"rendering.bloom.threshold",min:0,max:5,step:.1}),s.addField({type:"slider",label:"Intensity",configPath:"rendering.bloom.intensity",min:0,max:2,step:.05}),s.addField({type:"number",label:"Mip Levels",configPath:"rendering.bloom.mipLevels",min:1,max:8,step:1});const o=i.addSection("Fog");o.addField({type:"slider",label:"Start Ratio",configPath:"rendering.fog.startRatio",min:0,max:1,step:.05}),o.addField({type:"slider",label:"End Ratio",configPath:"rendering.fog.endRatio",min:.5,max:2,step:.05});const l=i.addSection("Contact Shadows");l.addField({type:"toggle",label:"Enabled",configPath:"rendering.contactShadows.enabled"}),l.addField({type:"slider",label:"Max Steps",configPath:"rendering.contactShadows.maxSteps",min:4,max:32,step:1}),l.addField({type:"slider",label:"Ray Length",configPath:"rendering.contactShadows.rayLength",min:.1,max:2,step:.05}),l.addField({type:"slider",label:"Thickness",configPath:"rendering.contactShadows.thickness",min:.01,max:1,step:.01});const a=i.addSection("TAA");a.addField({type:"toggle",label:"Enabled",configPath:"rendering.taa.enabled"}),a.addField({type:"slider",label:"Blend Factor",configPath:"rendering.taa.blendFactor",min:.5,max:.98,step:.01});const c=i.addSection("Auto Exposure");c.addField({type:"toggle",label:"Enabled",configPath:"rendering.autoExposure.enabled"}),c.addField({type:"slider",label:"Adapt Speed",configPath:"rendering.autoExposure.adaptSpeed",min:.1,max:5,step:.1}),c.addField({type:"slider",label:"Key Value",configPath:"rendering.autoExposure.keyValue",min:.05,max:.5,step:.01}),c.addField({type:"slider",label:"Min Exposure",configPath:"rendering.autoExposure.minExposure",min:.01,max:1,step:.01}),c.addField({type:"slider",label:"Max Exposure",configPath:"rendering.autoExposure.maxExposure",min:1,max:10,step:.1});const u=i.addSection("Motion Blur");u.addField({type:"toggle",label:"Enabled",configPath:"rendering.motionBlur.enabled"}),u.addField({type:"slider",label:"Strength",configPath:"rendering.motionBlur.strength",min:.1,max:2,step:.1});const d=i.addSection("Depth of Field");d.addField({type:"toggle",label:"Enabled",configPath:"rendering.dof.enabled"}),d.addField({type:"slider",label:"Focus Distance",configPath:"rendering.dof.focusDistance",min:1,max:200,step:1}),d.addField({type:"slider",label:"Aperture",configPath:"rendering.dof.aperture",min:.01,max:.5,step:.01}),d.addField({type:"slider",label:"Max Blur",configPath:"rendering.dof.maxBlur",min:1,max:30,step:1});const f=document.createElement("div");return f.style.cssText="padding:6px 10px;font-size:10px;color:#888;border-top:1px solid #333;margin-top:8px;",f.textContent="* Requires reload to take effect",i.el.appendChild(f),i}function Fi(){const i=new Qe,e=i.addSection("Camera");return e.addField({type:"slider",label:"Speed",configPath:"camera.speed",min:1,max:200,step:1}),e.addField({type:"slider",label:"Fast Speed",configPath:"camera.fastSpeed",min:10,max:300,step:5}),e.addField({type:"slider",label:"Sensitivity",configPath:"camera.mouseSensitivity",min:5e-4,max:.01,step:5e-4}),e.addField({type:"slider",label:"FOV (deg)",configPath:"camera.fov",min:30,max:120,step:1,toDisplay:t=>Math.round(t*180/Math.PI),fromDisplay:t=>t*Math.PI/180}),e.addField({type:"number",label:"Near",configPath:"camera.near",min:.01,max:10,step:.01}),e.addField({type:"number",label:"Far",configPath:"camera.far",min:100,max:5e3,step:100}),i}class Di extends Qe{_updateTimeFn=null;updateTime(){this._updateTimeFn&&this._updateTimeFn()}}function Ui(i,e){const t=new Di,n=t.addSection("Day / Night"),r=ct("Time",Math.round(i.timeOfDay*100),0,100,1,f=>{i.setTime(f/100),r.display.textContent=i.getTimeString()});r.slider.addEventListener("dblclick",()=>{i.paused=!1}),n.addElement(r.row),n.addField({type:"slider",label:"Day Duration",configPath:"environment.dayDurationSeconds",min:60,max:3600,step:60});const s=t.addSection("Sky");s.addField({type:"slider",label:"Star Brightness",configPath:"environment.sky.starBrightness",min:0,max:2,step:.05}),s.addField({type:"slider",label:"Nebula Intensity",configPath:"environment.sky.nebulaIntensity",min:0,max:2,step:.05});const o=t.addSection("Clouds");o.addField({type:"toggle",label:"Enabled",configPath:"environment.cloud.enabled"}),o.addField({type:"slider",label:"Coverage",configPath:"environment.cloud.coverage",min:0,max:1,step:.05}),o.addField({type:"slider",label:"Density",configPath:"environment.cloud.density",min:.1,max:3,step:.1}),o.addField({type:"slider",label:"Cloud Base",configPath:"environment.cloud.cloudBase",min:100,max:1e3,step:50}),o.addField({type:"slider",label:"Cloud Height",configPath:"environment.cloud.cloudHeight",min:50,max:500,step:25}),o.addField({type:"slider",label:"Detail",configPath:"environment.cloud.detailStrength",min:0,max:1,step:.05}),o.addField({type:"slider",label:"Wind Speed",configPath:"environment.cloud.windSpeed",min:0,max:50,step:1}),o.addField({type:"slider",label:"Silver Lining",configPath:"environment.cloud.silverLining",min:0,max:3,step:.1}),o.addField({type:"slider",label:"Multi Scatter",configPath:"environment.cloud.multiScatterFloor",min:0,max:.5,step:.01});const l=t.addSection("Weather"),a=Ai("Auto",e.autoWeather,f=>{e.autoWeather=f,f&&(e.weatherTimer=0,e.weatherDuration=10+Math.random()*30)});l.addElement(a.row);const c=Li("Type",[{label:"Clear",value:Fe.CLEAR},{label:"Rain",value:Fe.RAIN},{label:"Snow",value:Fe.SNOW}],e.currentWeather,f=>{e.autoWeather=!1,a.checkbox.checked=!1;const h=parseInt(f);e.currentWeather=h,h===Fe.CLEAR?(e.targetIntensity=0,e.intensity=0):(e.targetIntensity=.7,e.intensity=.7)});l.addElement(c.row);const u=ct("Intensity",e.intensity,0,1,.05,f=>{e.autoWeather=!1,a.checkbox.checked=!1,e.targetIntensity=f,e.intensity=f});l.addElement(u.row);const d=ct("Trans. Speed",e.transitionSpeed,.05,2,.05,f=>{e.transitionSpeed=f});return l.addElement(d.row),t._updateTimeFn=()=>{i.paused||(r.slider.value=String(Math.round(i.timeOfDay*100)),r.display.textContent=i.getTimeString()),c.select.value=String(e.currentWeather),u.slider.value=String(e.intensity),u.display.textContent=e.intensity.toFixed(2)},t}async function Oi(){const i=document.getElementById("canvas");if(!navigator.gpu){const C=document.getElementById("no-webgpu");C&&(C.style.display="flex");return}let e;try{e=await ft.create(i)}catch(C){const A=document.getElementById("no-webgpu");A&&(A.style.display="flex"),console.error(C);return}e.resize();const t=new mi,n=new Si,r=new nr(e,t);await r.init(),r.setWeatherSystem(n);const s=new Rr(e);r.setAtlasTexture(s.texture,s.materialTexture,s.normalTexture);let o=0;const l=0*D+D/2,a=0*D+D/2,c=new Er(i,he(l,72,a));let u=new pi(e,o);const d=new Pi,f=new Ci,h=Ri(C=>{o=C,u.regenerate(o)});f.addTab("Terrain",h);const m=Ei();f.addTab("Rendering",m);const v=Fi();f.addTab("Camera",v);const g=Ui(t,n);f.addTab("Environment",g);const b=C=>{C.code==="KeyH"&&!(C.target instanceof HTMLInputElement||C.target instanceof HTMLSelectElement||C.target instanceof HTMLTextAreaElement)&&d.toggle()};document.addEventListener("keydown",b);const P=C=>{C==="rendering.general.renderDistance"&&(u.renderDistance=T.data.rendering.general.renderDistance),(C.startsWith("rendering.bloom.")||C.startsWith("rendering.autoExposure."))&&r.updateBloomParams()};T.onChange(P);const w=()=>e.resize();window.addEventListener("resize",w);function S(){c.destroy(),f.destroy(),document.removeEventListener("keydown",b),window.removeEventListener("resize",w),T.removeHandler(P)}window.__voxelCleanup=S;let x=performance.now();function B(){const C=performance.now(),A=Math.min((C-x)/1e3,.1);x=C,e.resize(),c.update(A),t.update(A),n.update(A),g.updateTime();const M=c.getViewProjection(e.aspectRatio),R=c.getProjection(),N=c.getView(),O=T.data.rendering.fog,F=u.renderDistance*D,L=n.getFogDensityMultiplier();r.updateCamera(M,R,N,c.position,F*O.startRatio/L,F*O.endRatio/L,A),u.update(c.position,M);const q=u.getPointLights(c.position);r.updatePointLights(q);const k=u.getDrawCalls(),U=u.getLODDrawCalls(),Z=[...k,...U],j=u.getWaterDrawCalls(),Y=u.getVegetationDrawCalls();d.setDrawInfo(Z.length,j.length);try{r.render(Z,j,Y)}catch(W){const ee=W instanceof Error?W.message:String(W);d.setError(`Render: ${ee.slice(0,120)}`),console.error("[Render Error]",W)}d.update(c.position,u.totalChunks,o,c.getSpeed(),t.getTimeString(),u.totalLODChunks),requestAnimationFrame(B)}requestAnimationFrame(B)}Oi().catch(console.error);
