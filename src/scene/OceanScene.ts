/**
 * The Odyssey ocean — a single WebGL canvas that turns the flat key art
 * (public/assets/odyssey-bg-*.jpg) into a living, camera-driven 2.5D scene:
 *
 *  - a virtual camera (pan / dolly / roll) with depth-aware parallax, using a
 *    hand-authored depth map of the artwork (sky far, helmet + hull near),
 *  - shimmering surface water, refraction below the waterline, moving caustics,
 *    swaying god-rays, a glinting waterline and drifting sea fog,
 *  - a perspective particle field (plankton, bokeh, bubbles) that only lives underwater,
 *  - a seamless descent past the bottom of the artwork into the abyss.
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
  float below = smoothstep(uWater + 0.004, uWater + 0.03, uv.y);
  float surface = smoothstep(uHorizon - 0.01, uHorizon + 0.04, uv.y) * (1.0 - smoothstep(uWater - 0.012, uWater, uv.y));

  // Surface shimmer above the waterline, refraction beneath it.
  uv.x += surface * (sin(uv.y * 260.0 + t * 1.6) * 0.0009 + sin(uv.y * 90.0 - t * 0.9) * 0.0006);
  uv.y += surface * sin(uv.x * 120.0 + t * 1.1) * 0.0005;
  uv += below * vec2(sin(uv.y * 38.0 + t * 0.8), cos(uv.x * 32.0 + t * 0.65)) * 0.0021;

  vec2 suv = clamp(uv, vec2(0.0015), vec2(0.9985));
  vec3 col = texture2D(uTex, suv).rgb;

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

  // Descent: colour falls away to the deep, then the abyss.
  col = mix(col, DEEP * (0.6 + lum), smoothstep(0.15, 0.7, uDive) * 0.45 * under);
  col = mix(col, ABYSS, smoothstep(0.55, 1.0, uDive) * 0.75);

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
varying float vAlpha;
varying float vKind;
varying float vBlur;
void main() {
  float z = mix(0.6, 4.2, aSeed.z);             // distance from camera
  float bubble = step(0.9, aSeed.w);
  float speed = mix(0.006, 0.02, fract(aSeed.w * 7.31)) + bubble * 0.07;
  float y = fract(aSeed.y + uTime * speed) * 2.4 - 1.2;
  float x = aSeed.x * 1.6 + sin(uTime * 0.3 + aSeed.w * 40.0) * (0.03 + bubble * 0.02);
  // camera travel: deeper → particles stream upward past the lens
  y += uCam.y * 1.6 / z;
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

export class OceanScene {
  readonly state: SceneState = {
    camX: 0, camY: 0, zoom: 1.04, roll: 0, exposure: 0, dive: 0, pointerX: 0, pointerY: 0,
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
  private art: ArtProfile | null = null;
  private imgAspect = 16 / 9;
  private raf = 0;
  private running = false;
  private start = performance.now();
  private target = { x: 0, y: 0 };
  private dpr = 1;

  constructor(private canvas: HTMLCanvasElement, private motion = true) {
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
    if (!gl) throw new Error('WebGL unavailable');
    this.gl = gl;

    this.quad = program(gl, VERT_QUAD, FRAG_QUAD);
    this.uq = locate(gl, this.quad, ['uTex', 'uRes', 'uImgAspect', 'uTime', 'uCam', 'uRoll', 'uPar', 'uExposure',
      'uDive', 'uWater', 'uHorizon', 'uObjA', 'uObjB', 'uMotion']);
    this.pts = program(gl, VERT_PTS, FRAG_PTS);
    this.up = locate(gl, this.pts, ['uTime', 'uAspect', 'uPar', 'uCam', 'uDpr', 'uDive', 'uWaterScreen', 'uRes', 'uExp']);

    this.quadBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const small = Math.min(window.innerWidth, window.innerHeight) < 700;
    this.count = motion ? (small ? 160 : 420) : 0;
    const seeds = new Float32Array(this.count * 4);
    for (let i = 0; i < this.count; i++) {
      seeds.set([Math.random() * 2 - 1, Math.random(), Math.random() ** 0.7, Math.random()], i * 4);
    }
    this.ptsBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.ptsBuf);
    gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);

    window.addEventListener('pointermove', this.onPointer, { passive: true });
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
        this.tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
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
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }

  /** Waterline position on screen (0 = top, 1 = bottom), for DOM overlays. */
  waterlineOnScreen() {
    if (!this.art) return 0.5;
    const { width, height } = this.canvas;
    const aspect = width / Math.max(height, 1);
    const fitY = aspect > this.imgAspect ? this.imgAspect / aspect : 1;
    const s = this.state;
    const zoom = s.zoom * 1.025;
    const halfY = (0.5 * fitY) / zoom;
    const cy = Math.max(0.5 + s.camY, halfY);
    return 0.5 + ((this.art.water - cy) * zoom) / fitY;
  }

  private onPointer = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    this.target.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.target.y = (e.clientY / window.innerHeight) * 2 - 1;
  };

  private render() {
    const gl = this.gl;
    if (!this.tex || !this.art) return;
    const s = this.state;
    const time = (performance.now() - this.start) / 1000;
    const m = this.motion ? 1 : 0;

    s.pointerX += (this.target.x - s.pointerX) * 0.04;
    s.pointerY += (this.target.y - s.pointerY) * 0.04;
    // Slow "camera on a boat" drift, layered under whatever GSAP is doing.
    const driftX = Math.sin(time * 0.071) * 0.006 * m;
    const driftY = Math.sin(time * 0.093 + 1.2) * 0.004 * m;
    const sway = Math.sin(time * 0.37) * 0.0035 * m;
    const par: [number, number] = [s.pointerX + Math.sin(time * 0.11) * 0.25 * m, s.pointerY + Math.cos(time * 0.13) * 0.15 * m];

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.disable(gl.BLEND);
    gl.useProgram(this.quad);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    const u = this.uq;
    gl.uniform1i(u.uTex, 0);
    gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(u.uImgAspect, this.imgAspect);
    gl.uniform1f(u.uTime, time);
    gl.uniform3f(u.uCam, s.camX + driftX, s.camY + driftY, s.zoom * 1.025);
    gl.uniform1f(u.uRoll, s.roll + sway);
    gl.uniform2f(u.uPar, par[0], par[1]);
    gl.uniform1f(u.uExposure, s.exposure);
    gl.uniform1f(u.uDive, s.dive);
    gl.uniform1f(u.uWater, this.art.water);
    gl.uniform1f(u.uHorizon, this.art.horizon);
    gl.uniform4f(u.uObjA, ...this.art.objA);
    gl.uniform3f(u.uObjB, ...this.art.objB);
    gl.uniform1f(u.uMotion, m);
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
    gl.uniform1f(p.uAspect, this.canvas.width / Math.max(this.canvas.height, 1));
    gl.uniform2f(p.uPar, par[0], par[1]);
    gl.uniform3f(p.uCam, s.camX, s.camY, s.zoom);
    gl.uniform1f(p.uDpr, this.dpr);
    gl.uniform1f(p.uDive, s.dive);
    gl.uniform1f(p.uWaterScreen, this.waterlineOnScreen());
    gl.uniform2f(p.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(p.uExp, s.exposure);
    const ap = gl.getAttribLocation(this.pts, 'aSeed');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.ptsBuf);
    gl.enableVertexAttribArray(ap);
    gl.vertexAttribPointer(ap, 4, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.POINTS, 0, this.count);
    gl.disableVertexAttribArray(ap);
  }
}
