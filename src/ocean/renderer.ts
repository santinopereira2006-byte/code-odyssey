import { FRAG, VERT } from './shader';
import { H, POSTER_WIDE, W } from '../poster';

/** Ship crop in the supplied poster, in poster pixels (x, y, w, h). */
const SHIP_RECT = [780, 630, 122, 150];

export interface OceanRenderer {
  /** Scroll targets; the rendered camera eases toward them every frame. */
  setTargets(prog: number, deep: number, snap?: boolean): void;
  setActive(active: boolean): void;
  /** Draw a single frame (reduced motion). */
  renderStill(prog: number, deep: number, time: number): void;
  destroy(): void;
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
  return s;
}

/**
 * Raw WebGL1, one full-screen triangle, no dependencies. Renders below device
 * resolution and adapts that resolution to the measured frame time.
 * Returns null when WebGL is unavailable so the caller can fall back to CSS.
 */
export function createOcean(canvas: HTMLCanvasElement): OceanRenderer | null {
  const gl = canvas.getContext('webgl', {
    alpha: false, antialias: false, depth: false, stencil: false,
    premultipliedAlpha: false, powerPreference: 'high-performance',
  });
  if (!gl) return null;

  let prog: WebGLProgram;
  try {
    prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link');
  } catch (err) {
    console.warn('Ocean shader unavailable:', err);
    return null;
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const u = (n: string) => gl.getUniformLocation(prog, n);
  const uRes = u('uRes'), uTime = u('uTime'), uProg = u('uProg'), uDeep = u('uDeep'), uShipOn = u('uShipOn');
  gl.uniform4f(u('uShipRect'), SHIP_RECT[0] / W, SHIP_RECT[1] / H, SHIP_RECT[2] / W, SHIP_RECT[3] / H);
  gl.uniform1i(u('uShip'), 0);
  gl.uniform1f(uShipOn, 0);

  const tex = gl.createTexture();
  let lastStill: [number, number, number] | null = null;
  const img = new Image();
  img.onload = () => {
    if (destroyed) return;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    gl.uniform1f(uShipOn, 1);
    if (lastStill) draw(...lastStill);
  };
  img.src = POSTER_WIDE;

  // Resolution: a pixel budget per frame, scaled by `quality`, which adapts to frame time.
  const mobile = window.matchMedia('(max-width: 820px)').matches;
  const budget = mobile ? 300_000 : 900_000;
  let quality = 1;
  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const scale = Math.min(dpr, Math.sqrt(budget / (w * h))) * quality;
    const cw = Math.max(1, Math.round(w * scale)), ch = Math.max(1, Math.round(h * scale));
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw; canvas.height = ch;
      gl.viewport(0, 0, cw, ch);
    }
    gl.uniform2f(uRes, cw, ch);
  };

  const draw = (p: number, d: number, time: number) => {
    gl.uniform1f(uTime, time);
    gl.uniform1f(uProg, p);
    gl.uniform1f(uDeep, d);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  let destroyed = false, active = false, raf = 0, last = 0, time = 8;
  let cur = { p: 0, d: 0 }, target = { p: 0, d: 0 };
  let slow = 0, fast = 0;

  const frame = (now: number) => {
    raf = 0;
    if (!active || destroyed) return;
    const dt = last ? Math.min((now - last) / 1000, 0.1) : 1 / 60;
    last = now;
    time += dt;
    const k = 1 - Math.exp(-dt * 7);
    cur.p += (target.p - cur.p) * k;
    cur.d += (target.d - cur.d) * k;
    draw(cur.p, cur.d, time);

    // Adaptive resolution: back off quickly when frames run long, recover slowly.
    if (dt > 0.026) { slow++; fast = 0; } else if (dt < 0.0175) { fast++; slow = 0; }
    if (slow > 20 && quality > 0.45) { quality *= 0.85; slow = 0; resize(); }
    if (fast > 240 && quality < 1) { quality = Math.min(1, quality * 1.1); fast = 0; resize(); }
    raf = requestAnimationFrame(frame);
  };

  const onVisibility = () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
    else if (active && !raf) { last = 0; raf = requestAnimationFrame(frame); }
  };
  document.addEventListener('visibilitychange', onVisibility);
  // Resizing the drawing buffer clears it, so a paused or still canvas redraws itself.
  let stillRaf = 0;
  const ro = new ResizeObserver(() => {
    resize();
    if (lastStill) draw(...lastStill);
    else if (!active) draw(cur.p, cur.d, time);
  });
  ro.observe(canvas);
  resize();

  return {
    setTargets(p, d, snap) {
      target = { p, d };
      if (snap) cur = { p, d };
    },
    setActive(a) {
      if (a === active) return;
      active = a;
      if (a && !raf && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); }
      if (!a && raf) { cancelAnimationFrame(raf); raf = 0; }
    },
    renderStill(p, d, t) {
      lastStill = [p, d, t];
      cancelAnimationFrame(stillRaf);
      stillRaf = requestAnimationFrame(() => { resize(); draw(p, d, t); });
    },
    destroy() {
      destroyed = true;
      active = false;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(stillRaf);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      gl.deleteTexture(tex);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    },
  };
}
