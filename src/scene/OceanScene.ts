/**
 * The Odyssey ocean — a single WebGL canvas that turns the flat key art
 * (public/assets/odyssey-bg-*.jpg) into a living, camera-driven 2.5D scene:
 *
 *  - a virtual camera (pan / dolly / roll) with depth-aware parallax, using a
 *    hand-authored depth map of the artwork (sky far, helmet + hull near),
 *  - shimmering surface water, refraction below the waterline, moving caustics,
 *    swaying god-rays, a glinting waterline and drifting sea fog,
 *  - a perspective particle field (plankton, bokeh, bubbles) that only lives underwater,
 *  - a seamless descent past the bottom of the artwork into the abyss,
 *  - lens work: rack-focus depth of field, subtle chromatic fringing, a breathing
 *    glow on the golden spine (from a bloom mask baked from the art's own gold pixels),
 *  - interaction: an underwater lantern that follows the pointer, click ripples on the
 *    water, scroll-velocity driven currents, and image→screen mapping for hotspots.
 *
 * The scene is imperative; React/GSAP only write to `scene.state`.
 */

export interface ArtProfile {
  src: string;
  /** Waterline, as a fraction of image height from the top. */
  water: number;
  horizon: number;
  /** Helmet/hull silhouette used for the depth map: crestTop, domeTop, domeEnd, centreX. */
  objA: [number, number, number, number];
  /** Half widths: crest, dome, hull (fractions of image width). */
  objB: [number, number, number];
}

export const ART: Record<'wide' | 'tall', ArtProfile> = {
  wide: {
    src: 'assets/odyssey-bg-wide.jpg',
    water: 0.462, horizon: 0.36,
    objA: [0.12, 0.29, 0.58, 0.5], objB: [0.018, 0.075, 0.112],
  },
  tall: {
    src: 'assets/odyssey-bg-mobile.jpg',
    water: 0.455, horizon: 0.36,
    objA: [0.12, 0.28, 0.58, 0.501], objB: [0.052, 0.195, 0.3],
  },
};

export const pickArt = (w: number, h: number) => (w / h < 0.95 ? ART.tall : ART.wide);

export interface SceneState {
  /** Camera centre offset from the image centre (image-uv units) and zoom. */
  camX: number; camY: number; zoom: number; roll: number;
  /** 0 → 1: global exposure (used by the intro). */
  exposure: number;
  /** 0 → 1: how far we have descended into the deep. */
  dive: number;
  /** Pointer in -1…1, already smoothed by the scene. */
  pointerX: number; pointerY: number;
  /** Depth (0 far … 1 near) the lens is focused on, and how strong the blur is. */
  focus: number; dof: number;
  /** 0 → 1: strength of the pointer lantern and of the spine glow. */
  lantern: number; glow: number;
  /** Scroll velocity in viewport heights per second (signed). */
  velocity: number;
}

const VERT_QUAD = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5); // y measured from the top
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG_QUAD = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform float uImgAspect;
uniform float uTime;
uniform vec3 uCam;          // x, y, zoom
uniform float uRoll;
uniform vec2 uPar;
uniform float uExposure;
uniform float uDive;
uniform float uWater;
uniform float uHorizon;
uniform vec4 uObjA;
uniform vec3 uObjB;
uniform float uMotion;      // 0 when reduced motion is requested
uniform sampler2D uBloom;   // blurred mask of the gold vertebrae
uniform float uFocus;
uniform float uDof;
uniform vec3 uLantern;      // screen uv (y from top) + intensity
uniform float uGlow;
uniform float uFlow;        // 0..1 scroll-velocity energy
uniform vec4 uRipple[4];    // image uv, start time, strength

const vec3 ABYSS = vec3(0.012, 0.032, 0.047);
const vec3 DEEP  = vec3(0.016, 0.075, 0.09);
const vec3 FOG   = vec3(0.36, 0.52, 0.62);

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 11.7; a *= 0.5; }
  return v;
}

// Caustic web: the product of two drifting ridged-noise fields.
float ridge(vec2 p) { return 1.0 - abs(noise(p) * 2.0 - 1.0); }
float caustic(vec2 p, float t) {
  vec2 w = vec2(noise(p * 0.35 + t * 0.05), noise(p * 0.35 - t * 0.04 + 7.0)) * 1.6;
  float a = ridge(p + w + vec2(t * 0.22, t * 0.13));
  float b = ridge(p * 1.37 - w + vec2(-t * 0.17, t * 0.21) + 3.1);
  return pow(a * b, 7.0);
}

// 0 = far (sky) … 1 = near (helmet / hull), in image space.
float depthAt(vec2 uv) {
  float sea = 0.15 + 0.4 * smoothstep(uHorizon, uWater, uv.y);
  float under = 0.42 + 0.2 * smoothstep(uWater, 1.0, uv.y);
  float d = mix(sea, under, smoothstep(uWater - 0.01, uWater + 0.01, uv.y));
  d = uv.y < uHorizon ? mix(0.0, sea, smoothstep(uHorizon - 0.08, uHorizon, uv.y)) : d;
  float hw = mix(uObjB.x, uObjB.y, smoothstep(uObjA.y, uObjA.y + 0.06, uv.y));
  hw = mix(hw, uObjB.z, smoothstep(uObjA.z, uObjA.z + 0.1, uv.y));
  float obj = 1.0 - smoothstep(hw - 0.025, hw + 0.025, abs(uv.x - uObjA.w));
  obj *= smoothstep(uObjA.x - 0.02, uObjA.x + 0.02, uv.y);
  return mix(d, 0.95, obj);
}

void main() {
  float aspect = uRes.x / uRes.y;
  vec2 fit = aspect > uImgAspect ? vec2(1.0, uImgAspect / aspect) : vec2(aspect / uImgAspect, 1.0);

  // Screen → camera (roll in screen space, keeping pixels square).
  vec2 p = vUv - 0.5;
  p.x *= aspect;
  float cr = cos(uRoll), sr = sin(uRoll);
  p = mat2(cr, -sr, sr, cr) * p;
  p.x /= aspect;

  vec2 half_ = 0.5 * fit / uCam.z;
  vec2 centre = 0.5 + uCam.xy;
  centre.x = clamp(centre.x, half_.x, 1.0 - half_.x);
  centre.y = max(centre.y, half_.y);           // may travel below the art, into the abyss
  vec2 uv = centre + p * fit / uCam.z;

  // Depth-aware parallax.
  float d = depthAt(uv);
  uv -= uPar * (d - 0.4) * vec2(0.022, 0.012);

  float t = uTime * uMotion;

  // Click ripples travelling across the water.
  float rippleLight = 0.0;
  for (int i = 0; i < 4; i++) {
    vec4 rp = uRipple[i];
    float age = uTime - rp.z;
    if (rp.w > 0.0 && age > 0.0 && age < 4.0) {
      vec2 dv = uv - rp.xy;
      dv.x *= uImgAspect;
      float dist = length(dv);
      float front = age * 0.16;
      float band = exp(-pow((dist - front) * 38.0, 2.0));
      float w = sin((dist - front) * 160.0) * band * exp(-age * 0.9) * rp.w;
      uv += normalize(dv + 1e-5) * w * 0.0035 * vec2(1.0 / uImgAspect, 1.0);
      rippleLight += band * exp(-age * 1.1) * rp.w;
    }
  }
  float below = smoothstep(uWater + 0.004, uWater + 0.03, uv.y);
  float surface = smoothstep(uHorizon - 0.01, uHorizon + 0.04, uv.y) * (1.0 - smoothstep(uWater - 0.012, uWater, uv.y));

  // Surface shimmer above the waterline, refraction beneath it.
  uv.x += surface * (sin(uv.y * 260.0 + t * 1.6) * 0.0009 + sin(uv.y * 90.0 - t * 0.9) * 0.0006);
  uv.y += surface * sin(uv.x * 120.0 + t * 1.1) * 0.0005;
  uv += below * vec2(sin(uv.y * 38.0 + t * 0.8), cos(uv.x * 32.0 + t * 0.65)) * (0.0021 + uFlow * 0.004);

  vec2 suv = clamp(uv, vec2(0.0015), vec2(0.9985));
  // Chromatic fringing towards the frame edges (stronger underwater).
  vec2 q0 = vUv - 0.5;
  vec2 ca = q0 * dot(q0, q0) * (0.004 + below * 0.006 + uFlow * 0.008);
  vec3 col = vec3(
    texture2D(uTex, clamp(suv + ca, 0.0015, 0.9985)).r,
    texture2D(uTex, suv).g,
    texture2D(uTex, clamp(suv - ca, 0.0015, 0.9985)).b);

  // Depth of field: a disc blur whose radius grows with distance from the focal plane.
  float coc = uDof * abs(d - uFocus) * 0.0065 / uCam.z;
  if (coc > 0.0004) {
    vec3 acc = col;
    float ga = 2.39996;
    for (int i = 1; i < 10; i++) {
      float fi = float(i);
      float rr = sqrt(fi / 9.0) * coc;
      vec2 o = vec2(cos(fi * ga), sin(fi * ga)) * rr * vec2(1.0 / uImgAspect, 1.0);
      acc += texture2D(uTex, clamp(suv + o, 0.0015, 0.9985)).rgb;
    }
    col = acc / 10.0;
  }

  // Past the bottom of the art the hull dissolves into the abyss.
  col = mix(col, ABYSS, smoothstep(0.88, 1.06, uv.y));

  // Drifting sea fog over the sky and horizon.
  float fogMask = 1.0 - smoothstep(uHorizon - 0.02, uHorizon + 0.06, uv.y);
  if (fogMask > 0.0) {
    float f = fbm(vec2(uv.x * 3.0 - t * 0.012, uv.y * 7.0 + t * 0.004));
    float f2 = noise(vec2(uv.x * 9.0 + t * 0.03, uv.y * 14.0));
    col = mix(col, FOG, fogMask * smoothstep(0.35, 0.9, f) * 0.28);
    col = mix(col, FOG * 1.05, (1.0 - smoothstep(0.0, 0.06, abs(uv.y - uHorizon + 0.015))) * f2 * 0.2);
  }

  // Caustics — strongest on the hull, fading with depth.
  float under = smoothstep(uWater + 0.005, uWater + 0.06, uv.y);
  float lum = dot(col, vec3(0.3, 0.59, 0.11));
  if (under > 0.0) {
    float cz = caustic(vec2(uv.x * uImgAspect * 9.0, uv.y * 9.0), t);
    float depthFade = exp(-(uv.y - uWater) * 2.6);
    col += vec3(0.32, 0.66, 0.7) * cz * under * depthFade * (0.15 + lum * 2.0) * 0.6;
  }

  // God-rays fanning down from the surface.
  vec2 o = vec2(0.5 + sin(t * 0.05) * 0.03, uWater - 0.18);
  vec2 r = uv - o;
  r.x *= aspect / uImgAspect;
  float a = atan(r.x, r.y);
  float rays = 0.5 + 0.5 * sin(a * 22.0 + sin(a * 7.0 + t * 0.21) * 1.7 + t * 0.12);
  rays *= 0.5 + 0.5 * sin(a * 9.0 - t * 0.17 + 1.3);
  rays = pow(rays, 5.0) * under * exp(-(uv.y - uWater) * 3.2);
  col += vec3(0.28, 0.55, 0.6) * rays * 0.16 * (1.0 - uDive * 0.6);

  // Glinting waterline.
  float wl = uWater + 0.002 + (sin(uv.x * 70.0 + t * 1.3) * 0.0011 + sin(uv.x * 23.0 - t * 0.7) * 0.0009) * uMotion;
  float glint = exp(-abs(uv.y - wl) * 1100.0) * (0.55 + 0.45 * sin(uv.x * 160.0 - t * 2.2));
  col += vec3(0.62, 0.85, 0.95) * glint * 0.3;

  // Ripple crests catch the light.
  col += vec3(0.55, 0.8, 0.9) * rippleLight * 0.08;

  // Descent: colour falls away to the deep, then the abyss.
  col = mix(col, DEEP * (0.6 + lum), smoothstep(0.15, 0.7, uDive) * 0.45 * under);
  col = mix(col, ABYSS, smoothstep(0.55, 1.0, uDive) * 0.72);

  // Lantern: a soft pool of light that follows the pointer underwater,
  // pulling detail out of the hull without changing the scene's palette.
  vec2 lq = (vUv - uLantern.xy) * vec2(aspect, 1.0);
  float pool = exp(-dot(lq, lq) * 9.0);
  float lit = uLantern.z * pool * max(under, step(0.5, uDive));
  vec3 base = texture2D(uTex, suv).rgb;
  col += (base * vec3(0.9, 1.25, 1.3) * 1.6 + vec3(0.02, 0.06, 0.07)) * lit * (0.35 + uDive * 0.65);

  // The golden spine breathes.
  float pulse = 0.65 + 0.35 * sin(uTime * 2.4);
  float gold = texture2D(uBloom, suv).r * step(uv.y, 1.02);
  col += vec3(1.0, 0.72, 0.32) * gold * uGlow * pulse * (0.3 + uDive * 0.9);

  // Lens: vignette, grain, exposure.
  vec2 q = vUv - 0.5;
  col *= 1.0 - dot(q * vec2(0.9, 1.15), q * vec2(0.9, 1.15)) * 0.95;
  col += (hash(vUv * uRes + fract(uTime * 7.0) * 113.0) - 0.5) * 0.035;
  col *= uExposure;
  gl_FragColor = vec4(col, 1.0);
}`;

const VERT_PTS = `
attribute vec4 aSeed;   // x, y, z(depth 0..1), kind/phase
uniform float uTime;
uniform float uAspect;
uniform vec2 uPar;
uniform vec3 uCam;
uniform float uDpr;
uniform float uDive;
uniform float uTravel;    // accumulated camera travel (scroll) — near particles move more
varying float vAlpha;
varying float vKind;
varying float vBlur;
void main() {
  float z = mix(0.6, 4.2, aSeed.z);             // distance from camera
  float bubble = step(0.9, aSeed.w);
  float speed = mix(0.006, 0.02, fract(aSeed.w * 7.31)) + bubble * 0.07;
  // camera travel: deeper → particles stream upward past the lens, nearest fastest
  float y = fract(aSeed.y + uTime * speed + uTravel * 0.7 / z) * 2.4 - 1.2;
  float x = aSeed.x * 1.6 + sin(uTime * 0.3 + aSeed.w * 40.0) * (0.03 + bubble * 0.02);
  vec2 par = uPar * vec2(0.09, 0.05) / z;
  vec2 ndc = vec2((x - par.x) / z * 1.7 / uAspect, (y + par.y) / z * 1.7);
  ndc *= uCam.z;
  gl_Position = vec4(ndc, 0.0, 1.0);
  float near = 1.0 - smoothstep(0.6, 1.3, z);
  gl_PointSize = (mix(2.2, 1.0, aSeed.z) + bubble * 4.0 + near * 26.0) * uDpr * uCam.z;
  vAlpha = (mix(0.65, 0.25, aSeed.z) + near * 0.1) * (0.6 + 0.4 * uDive);
  vKind = bubble;
  vBlur = near;
}`;

const FRAG_PTS = `
precision mediump float;
varying float vAlpha;
varying float vKind;
varying float vBlur;
uniform float uWaterScreen;  // waterline, 0 = top of the screen
uniform vec2 uRes;
uniform float uExp;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c);
  float disc = 1.0 - smoothstep(0.25 + vBlur * 0.1, 0.5, r);
  float ring = smoothstep(0.32, 0.42, r) * (1.0 - smoothstep(0.42, 0.5, r)) + (1.0 - smoothstep(0.0, 0.18, length(c + 0.14))) * 0.6;
  float shape = mix(disc, ring, vKind);
  float fromTop = 1.0 - gl_FragCoord.y / uRes.y;
  float under = smoothstep(uWaterScreen + 0.01, uWaterScreen + 0.06, fromTop);
  vec3 tint = mix(vec3(0.55, 0.85, 0.88), vec3(0.75, 0.92, 1.0), vKind);
  gl_FragColor = vec4(tint, shape * vAlpha * under * uExp * (1.0 - vBlur * 0.75));
}`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader error');
  return s;
}

function program(gl: WebGLRenderingContext, vs: string, fs: string) {
  const p = gl.createProgram()!;
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link error');
  return p;
}

type Uniforms = Record<string, WebGLUniformLocation | null>;
const locate = (gl: WebGLRenderingContext, p: WebGLProgram, names: string[]): Uniforms =>
  Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(p, n)]));

interface Frame { aspect: number; fit: [number, number]; cx: number; cy: number; zoom: number; roll: number; par: [number, number] }

/** Bakes a soft mask of the art's gold vertebrae, used for the spine glow. */
function bakeGoldMask(img: HTMLImageElement) {
  const w = 320;
  const h = Math.round((w * img.naturalHeight) / img.naturalWidth);
  const a = document.createElement('canvas');
  a.width = w; a.height = h;
  const ctx = a.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i] / 255, g = px[i + 1] / 255, b = px[i + 2] / 255;
    const warm = Math.max(0, (r - b) * 2.4 - 0.25) * Math.min(1, Math.max(0, (r - 0.28) * 3)) * (g > b ? 1 : 0);
    const v = Math.min(255, warm * 255);
    px[i] = px[i + 1] = px[i + 2] = v;
    px[i + 3] = 255;
  }
  ctx.putImageData(data, 0, 0);
  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  const o = out.getContext('2d')!;
  o.filter = 'blur(5px)';
  o.drawImage(a, 0, 0);
  o.filter = 'none';
  o.globalCompositeOperation = 'lighter';
  o.globalAlpha = 0.5;
  o.drawImage(a, 0, 0);
  return out;
}

export class OceanScene {
  readonly state: SceneState = {
    camX: 0, camY: 0, zoom: 1.04, roll: 0, exposure: 0, dive: 0, pointerX: 0, pointerY: 0,
    focus: 0.95, dof: 0, lantern: 0, glow: 0, velocity: 0,
  };

  private gl: WebGLRenderingContext;
  private quad: WebGLProgram;
  private pts: WebGLProgram;
  private uq: Uniforms;
  private up: Uniforms;
  private quadBuf: WebGLBuffer;
  private ptsBuf: WebGLBuffer;
  private count: number;
  private tex: WebGLTexture | null = null;
  private bloom: WebGLTexture | null = null;
  private art: ArtProfile | null = null;
  private imgAspect = 16 / 9;
  private raf = 0;
  private running = false;
  private start = performance.now();
  private last = performance.now();
  private target = { x: 0, y: 0 };
  private lamp = { x: 0.5, y: 0.6, tx: 0.5, ty: 0.6, on: 0, ton: 0 };
  private ripples = new Float32Array(16);
  private rippleIndex = 0;
  private travel = 0;
  private flow = 0;
  private dpr = 1;
  private frame: Frame | null = null;

  constructor(private canvas: HTMLCanvasElement, private motion = true) {
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
    if (!gl) throw new Error('WebGL unavailable');
    this.gl = gl;

    this.quad = program(gl, VERT_QUAD, FRAG_QUAD);
    this.uq = locate(gl, this.quad, ['uTex', 'uRes', 'uImgAspect', 'uTime', 'uCam', 'uRoll', 'uPar', 'uExposure',
      'uDive', 'uWater', 'uHorizon', 'uObjA', 'uObjB', 'uMotion', 'uBloom', 'uFocus', 'uDof', 'uLantern', 'uGlow',
      'uFlow', 'uRipple']);
    this.pts = program(gl, VERT_PTS, FRAG_PTS);
    this.up = locate(gl, this.pts, ['uTime', 'uAspect', 'uPar', 'uCam', 'uDpr', 'uDive', 'uWaterScreen', 'uRes', 'uExp', 'uTravel']);

    this.quadBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const small = Math.min(window.innerWidth, window.innerHeight) < 700;
    this.count = motion ? (small ? 170 : 460) : 0;
    const seeds = new Float32Array(this.count * 4);
    for (let i = 0; i < this.count; i++) {
      seeds.set([Math.random() * 2 - 1, Math.random(), Math.random() ** 0.7, Math.random()], i * 4);
    }
    this.ptsBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.ptsBuf);
    gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);

    window.addEventListener('pointermove', this.onPointer, { passive: true });
    document.documentElement.addEventListener('pointerleave', this.onLeave);
  }

  private upload(source: TexImageSource, format: number) {
    const gl = this.gl;
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, format, format, gl.UNSIGNED_BYTE, source);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }

  /** Loads (or swaps) the artwork; resolves once it is on the GPU. */
  load(art: ArtProfile): Promise<void> {
    if (this.art === art) return Promise.resolve();
    this.art = art;
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        if (this.art !== art) return resolve();
        const gl = this.gl;
        if (this.tex) gl.deleteTexture(this.tex);
        if (this.bloom) gl.deleteTexture(this.bloom);
        this.tex = this.upload(img, gl.RGB);
        try {
          this.bloom = this.upload(bakeGoldMask(img), gl.RGB);
        } catch {
          this.bloom = this.upload(new ImageData(1, 1), gl.RGB);
        }
        this.imgAspect = img.naturalWidth / img.naturalHeight;
        this.render();
        resolve();
      };
      img.onerror = () => reject(new Error(`Could not load ${art.src}`));
      img.src = art.src;
    });
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.round(this.canvas.clientWidth * this.dpr);
    const h = Math.round(this.canvas.clientHeight * this.dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    if (!this.running) this.render();
  }

  play() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const loop = () => {
      if (!this.running) return;
      this.render();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  pause() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  destroy() {
    this.pause();
    window.removeEventListener('pointermove', this.onPointer);
    document.documentElement.removeEventListener('pointerleave', this.onLeave);
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }

  /** Sends a ripple across the water from a point on screen (client px). */
  ripple(clientX: number, clientY: number, strength = 1) {
    if (!this.motion) return;
    const [u, v] = this.screenToImage(clientX / window.innerWidth, clientY / window.innerHeight);
    const i = (this.rippleIndex++ % 4) * 4;
    this.ripples.set([u, v, (performance.now() - this.start) / 1000, strength], i);
  }

  /** Image uv → viewport fraction (0…1, y from the top). `depth` applies the same parallax as the shader. */
  imageToScreen(u: number, v: number, depth = 0.95): [number, number] {
    const f = this.frame;
    if (!f) return [u, v];
    const ux = u + f.par[0] * (depth - 0.4) * 0.022;
    const uy = v + f.par[1] * (depth - 0.4) * 0.012;
    let px = ((ux - f.cx) * f.zoom) / f.fit[0];
    const py = ((uy - f.cy) * f.zoom) / f.fit[1];
    px *= f.aspect;
    const c = Math.cos(f.roll), s = Math.sin(f.roll);
    const sx = c * px - s * py;
    const sy = s * px + c * py;
    return [sx / f.aspect + 0.5, sy + 0.5];
  }

  screenToImage(x: number, y: number): [number, number] {
    const f = this.frame;
    if (!f) return [x, y];
    const px = (x - 0.5) * f.aspect, py = y - 0.5;
    const c = Math.cos(f.roll), s = Math.sin(f.roll);
    const rx = (c * px + s * py) / f.aspect;
    const ry = -s * px + c * py;
    return [f.cx + (rx * f.fit[0]) / f.zoom, f.cy + (ry * f.fit[1]) / f.zoom];
  }

  /** Waterline position on screen (0 = top, 1 = bottom), for DOM overlays. */
  waterlineOnScreen() {
    if (!this.art) return 0.5;
    return this.imageToScreen(0.5, this.art.water, 0.4)[1];
  }

  private onPointer = (e: PointerEvent) => {
    this.lamp.tx = e.clientX / window.innerWidth;
    this.lamp.ty = e.clientY / window.innerHeight;
    this.lamp.ton = 1;
    if (e.pointerType !== 'mouse') return;
    this.target.x = this.lamp.tx * 2 - 1;
    this.target.y = this.lamp.ty * 2 - 1;
  };

  private onLeave = () => {
    this.lamp.ton = 0;
    this.target.x = 0;
    this.target.y = 0;
  };

  private computeFrame(time: number): Frame {
    const s = this.state;
    const m = this.motion ? 1 : 0;
    const aspect = this.canvas.width / Math.max(this.canvas.height, 1);
    const fit: [number, number] = aspect > this.imgAspect ? [1, this.imgAspect / aspect] : [aspect / this.imgAspect, 1];
    // Slow "camera on a boat" drift, layered under whatever GSAP is doing.
    const zoom = s.zoom * 1.025;
    const hx = (0.5 * fit[0]) / zoom, hy = (0.5 * fit[1]) / zoom;
    const cx = Math.min(Math.max(0.5 + s.camX + Math.sin(time * 0.071) * 0.006 * m, hx), 1 - hx);
    const cy = Math.max(0.5 + s.camY + Math.sin(time * 0.093 + 1.2) * 0.004 * m, hy);
    const roll = s.roll + Math.sin(time * 0.37) * 0.0035 * m;
    const par: [number, number] = [s.pointerX + Math.sin(time * 0.11) * 0.25 * m, s.pointerY + Math.cos(time * 0.13) * 0.15 * m];
    return { aspect, fit, cx, cy, zoom, roll, par };
  }

  private render() {
    const gl = this.gl;
    if (!this.tex || !this.art) return;
    const s = this.state;
    const now = performance.now();
    const time = (now - this.start) / 1000;
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    const m = this.motion ? 1 : 0;

    s.pointerX += (this.target.x - s.pointerX) * 0.04;
    s.pointerY += (this.target.y - s.pointerY) * 0.04;
    const l = this.lamp;
    l.x += (l.tx - l.x) * 0.08;
    l.y += (l.ty - l.y) * 0.08;
    l.on += (l.ton - l.on) * 0.05;
    this.flow += (Math.min(1, Math.abs(s.velocity) * 0.35) - this.flow) * 0.08;
    this.travel += (s.velocity * 0.06 + 0.004) * dt * m;

    const f = (this.frame = this.computeFrame(time));

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.disable(gl.BLEND);
    gl.useProgram(this.quad);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.bloom);
    const u = this.uq;
    gl.uniform1i(u.uTex, 0);
    gl.uniform1i(u.uBloom, 1);
    gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(u.uImgAspect, this.imgAspect);
    gl.uniform1f(u.uTime, time);
    gl.uniform3f(u.uCam, f.cx - 0.5, f.cy - 0.5, f.zoom);
    gl.uniform1f(u.uRoll, f.roll);
    gl.uniform2f(u.uPar, f.par[0], f.par[1]);
    gl.uniform1f(u.uExposure, s.exposure);
    gl.uniform1f(u.uDive, s.dive);
    gl.uniform1f(u.uWater, this.art.water);
    gl.uniform1f(u.uHorizon, this.art.horizon);
    gl.uniform4f(u.uObjA, ...this.art.objA);
    gl.uniform3f(u.uObjB, ...this.art.objB);
    gl.uniform1f(u.uMotion, m);
    gl.uniform1f(u.uFocus, s.focus);
    gl.uniform1f(u.uDof, s.dof);
    gl.uniform3f(u.uLantern, l.x, l.y, s.lantern * l.on * m);
    gl.uniform1f(u.uGlow, s.glow);
    gl.uniform1f(u.uFlow, this.flow * m);
    gl.uniform4fv(u.uRipple, this.ripples);
    const aq = gl.getAttribLocation(this.quad, 'aPos');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuf);
    gl.enableVertexAttribArray(aq);
    gl.vertexAttribPointer(aq, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.disableVertexAttribArray(aq);

    if (!this.count) return;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.useProgram(this.pts);
    const p = this.up;
    gl.uniform1f(p.uTime, time);
    gl.uniform1f(p.uAspect, f.aspect);
    gl.uniform2f(p.uPar, f.par[0], f.par[1]);
    gl.uniform3f(p.uCam, s.camX, s.camY, s.zoom);
    gl.uniform1f(p.uDpr, this.dpr);
    gl.uniform1f(p.uDive, s.dive);
    gl.uniform1f(p.uWaterScreen, this.waterlineOnScreen());
    gl.uniform2f(p.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(p.uExp, s.exposure);
    gl.uniform1f(p.uTravel, this.travel + s.camY);
    const ap = gl.getAttribLocation(this.pts, 'aSeed');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.ptsBuf);
    gl.enableVertexAttribArray(ap);
    gl.vertexAttribPointer(ap, 4, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.POINTS, 0, this.count);
    gl.disableVertexAttribArray(ap);
  }
}
