/**
 * Full-screen ocean, rendered in one fragment shader:
 * - a ray-marched height field of sharpened, dispersive swells rolling toward the camera,
 * - dusk sky with a low moon, cloud cover, moon glitter, crest foam and horizon mist,
 * - the poster's own ship, keyed out of the poster texture and billboarded on the sea,
 * - a per-pixel waterline, so the camera can pass through the surface,
 * - underwater: Snell's window, refracted ship silhouette, hull, light shafts,
 *   caustics, suspended particles and depth fog.
 *
 * uProg (0–1) drives the camera from the hero's last frame down through the surface;
 * uDeep (0–1) continues the descent while the description is read.
 */
export const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

export const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 uRes;
uniform float uTime;
uniform float uProg;
uniform float uDeep;
uniform float uShipOn;
uniform sampler2D uShip;
uniform vec4 uShipRect;

#define GEO 4
#define DET 7

const vec3 MOON = vec3(-0.2703, 0.1502, -0.9510);
const vec3 SUN_UNDER = vec3(-0.1414, 0.9428, -0.3015); // refracted moonlight, pointing up
const float SHIP_X = 0.0;
const float SHIP_Z = -64.0;
const float SHIP_H = 19.0;
const float SHIP_W = 15.45;
const float SHIP_BASE = -4.4;
const float SHIP_YAW = 0.62;

float hash12(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x),
             mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 5; i++) {
    s += a * noise(p);
    p = mat2(1.6, 1.2, -1.2, 1.6) * p;
    a *= 0.5;
  }
  return s;
}

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

/* Swell: each octave is exp(k(sin - 1)) — narrow crests, broad troughs — travelling
   toward +z (the camera) with deep-water dispersion, bent along its crest so the
   wave fronts never read as straight lines. */
float waves(vec2 p, int n) {
  float h = 0.0, amp = 1.45, k = 0.095, sharp = 2.5;
  for (int i = 0; i < DET; i++) {
    if (i >= n) break;
    float fi = float(i);
    float ang = sin(fi * 2.4 + 0.3) * 0.9;
    vec2 d = vec2(sin(ang), cos(ang));
    float x = dot(p, d) * k;
    x += 0.55 * sin(dot(p, vec2(d.y, -d.x)) * k * 0.43 + fi * 1.3 + uTime * 0.05);
    float w = sqrt(9.81 * k) * 0.85;
    float s = sin(x - w * uTime + fi * 0.9);
    h += amp * (exp(sharp * (s - 1.0)) - 0.3);
    amp *= 0.5; k *= 1.82; sharp = max(sharp - 0.25, 1.2);
  }
  return h;
}

float chop(vec2 p) {
  return 0.07 * noise(p * 1.3 + vec2(uTime * 0.3, uTime * 0.9))
       + 0.035 * noise(p * 3.1 - vec2(uTime * 0.5, uTime * 1.4));
}

vec3 waterNormal(vec2 p, float eps, float far) {
  float c = mix(1.0, 0.0, far);
  float h = waves(p, DET) + chop(p) * c;
  float hx = waves(p + vec2(eps, 0.0), DET) + chop(p + vec2(eps, 0.0)) * c;
  float hz = waves(p + vec2(0.0, eps), DET) + chop(p + vec2(0.0, eps)) * c;
  return normalize(vec3(h - hx, eps, h - hz));
}

vec3 sky(vec3 rd) {
  float y = max(rd.y, 0.0);
  vec3 c = mix(vec3(0.60, 0.60, 0.58), vec3(0.27, 0.34, 0.43), smoothstep(0.0, 0.2, y));
  c = mix(c, vec3(0.06, 0.10, 0.16), smoothstep(0.18, 0.75, y));
  float m = max(dot(rd, MOON), 0.0);
  c += vec3(0.95, 0.86, 0.68) * (pow(m, 7.0) * 0.16 + pow(m, 60.0) * 0.32);
  vec2 cuv = rd.xz / (rd.y + 0.09) * 0.9 + vec2(uTime * 0.008, uTime * 0.003);
  float cl = smoothstep(0.42, 0.88, fbm(cuv));
  c = mix(c, c * 0.62 + vec3(0.02, 0.03, 0.04), cl * smoothstep(0.0, 0.1, y) * 0.85);
  float disc = smoothstep(0.99975, 0.99988, m);
  c += vec3(0.92, 0.88, 0.78) * (disc * 0.5 + pow(m, 2400.0) * 0.2) * (1.0 - cl * 0.8);
  return c;
}

/* The poster's ship: alpha = (hand-fitted silhouette) × (darkness key). */
float shipMask(vec2 uv) {
  float v = 1.0 - uv.y, u = uv.x;
  float mast = (1.0 - smoothstep(0.008, 0.016, abs(u - 0.49))) * step(0.02, v) * step(v, 0.76);
  float flag = step(0.49, u) * step(u, 0.6) * step(0.06, v) * step(v, 0.17);
  float sv = clamp((v - 0.24) / 0.5, 0.0, 1.0);
  float left = mix(0.02, 0.25, sv), right = mix(0.98, 0.78, sv);
  float sail = smoothstep(left, left + 0.015, u) * (1.0 - smoothstep(right - 0.015, right, u))
             * smoothstep(0.235, 0.25, v) * (1.0 - smoothstep(0.73, 0.75, v));
  vec2 e = (vec2(u, v) - vec2(0.49, 0.86)) / vec2(0.27, 0.16);
  float hull = 1.0 - smoothstep(0.85, 1.0, dot(e, e));
  return max(max(mast, flag), max(sail, hull));
}

vec4 shipLayer(vec3 ro, vec3 rd, out float ts) {
  ts = 1e5;
  if (uShipOn < 0.5 || rd.z > -0.01) return vec4(0.0);
  ts = (SHIP_Z - ro.z) / rd.z;
  if (ts < 0.0) return vec4(0.0);
  vec3 q = ro + rd * ts;
  float bob = waves(vec2(SHIP_X, SHIP_Z), GEO) * 0.55;
  vec2 lp = vec2(q.x - SHIP_X, q.y - (SHIP_BASE + bob));
  lp = rot(sin(uTime * 0.55) * 0.035) * lp;
  vec2 uv = vec2(lp.x / SHIP_W + 0.5, lp.y / SHIP_H);
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec4(0.0);
  vec2 tuv = vec2(uShipRect.x + uv.x * uShipRect.z, uShipRect.y + (1.0 - uv.y) * uShipRect.w);
  vec3 tc = texture2D(uShip, tuv).rgb;
  float lum = dot(tc, vec3(0.299, 0.587, 0.114));
  float a = (1.0 - smoothstep(0.47, 0.62, lum)) * shipMask(uv);
  return vec4(tc, a);
}

float traceWater(vec3 ro, vec3 rd) {
  if (rd.y > -0.0005) return 1e5;
  float t = max(0.0, (2.3 - ro.y) / rd.y);
  float tEnd = min((-1.1 - ro.y) / rd.y, 2500.0);
  float slope = -rd.y + 0.75 * length(rd.xz);
  float tPrev = t, dPrev = 1.0;
  for (int i = 0; i < 64; i++) {
    vec3 p = ro + rd * t;
    float d = p.y - waves(p.xz, GEO);
    if (d < 0.0) {
      for (int j = 0; j < 5; j++) {
        float tm = mix(tPrev, t, dPrev / (dPrev - d));
        vec3 pm = ro + rd * tm;
        float dm = pm.y - waves(pm.xz, GEO);
        if (dm < 0.0) { t = tm; d = dm; } else { tPrev = tm; dPrev = dm; }
      }
      return mix(tPrev, t, dPrev / (dPrev - d));
    }
    if (d < 0.002 * t) return t;
    tPrev = t; dPrev = d;
    t += max(d / slope, 0.04 * t + 0.02);
    if (t > tEnd) return tEnd;
  }
  return t;
}

vec3 shadeWater(vec3 p, vec3 rd, float t) {
  float far = smoothstep(60.0, 400.0, t);
  vec3 n = waterNormal(p.xz, 0.03 + t * 0.003, far);
  n = normalize(mix(n, vec3(0.0, 1.0, 0.0), far * 0.55));
  float fres = 0.02 + 0.98 * pow(1.0 - max(dot(n, -rd), 0.0), 5.0);
  vec3 r = reflect(rd, n);
  r.y = abs(r.y);
  vec3 refl = sky(r);
  vec3 deep = vec3(0.010, 0.038, 0.062);
  vec3 scatter = vec3(0.07, 0.21, 0.22);
  float back = pow(max(dot(rd, MOON) * 0.5 + 0.5, 0.0), 3.0);
  float crest = smoothstep(-0.4, 2.0, p.y);
  vec3 body = deep + scatter * (0.30 * back * crest + 0.10 * max(p.y, 0.0)) * (1.0 - far);
  vec3 col = mix(body, refl, clamp(fres, 0.0, 1.0) * 0.92);
  float sp = max(dot(r, MOON), 0.0);
  col += vec3(1.0, 0.93, 0.80) * (pow(sp, 900.0) * 2.0 + pow(sp, 110.0) * 0.18);
  float fn = fbm(p.xz * 0.8 + vec2(0.0, uTime * 0.35));
  float foam = smoothstep(1.1, 2.0, p.y + fn * 0.8) * smoothstep(0.3, 0.68, fn) * (1.0 - far);
  col = mix(col, vec3(0.64, 0.68, 0.68) * (0.55 + 0.45 * max(n.y, 0.0)), foam * 0.7);
  return col;
}

float cells(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  float d1 = 8.0, d2 = 8.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 g = vec2(float(x), float(y));
      vec2 o = vec2(hash12(i + g), hash12(i + g + 19.19));
      o = 0.5 + 0.42 * sin(uTime * 0.55 + 6.2831 * o);
      float d = length(g + o - f);
      if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
    }
  }
  return pow(1.0 - smoothstep(0.0, 0.42, d2 - d1), 2.6);
}

/* Warped, layered cell edges, so the light web never reads as a regular grid. */
float caustic(vec2 p) {
  p += 0.45 * vec2(noise(p * 0.6 + uTime * 0.08), noise(p * 0.6 + 7.3 - uTime * 0.07));
  return cells(p) * 0.65 + cells(p * 1.63 + 4.1) * 0.35;
}

float particles(vec2 uv, float shift, float density) {
  float acc = 0.0;
  for (int l = 0; l < 3; l++) {
    float fl = float(l);
    float scale = 7.0 + fl * 6.0;
    vec2 g = uv * scale + vec2(uTime * 0.04 * (1.0 + fl * 0.4), shift * (0.5 + fl * 0.45) + uTime * 0.025);
    vec2 id = floor(g), f = fract(g) - 0.5;
    float r = hash12(id + fl * 17.0);
    vec2 o = vec2(hash12(id + 3.1), hash12(id + 7.7)) - 0.5;
    float d = length(f - o * 0.7);
    float size = 0.025 + 0.035 * r;
    acc += smoothstep(size, 0.0, d) * step(1.0 - density, r) * (0.35 + 0.3 * fl);
  }
  return acc;
}

/* Ray/ellipsoid: x = hit distance (-1 on miss), y = soft-edge coverage. */
vec2 ellipsoid(vec3 ro, vec3 rd, vec3 c, vec3 r) {
  vec3 oc = (ro - c) / r, d = rd / r;
  float a = dot(d, d), b = dot(oc, d), cc = dot(oc, oc) - 1.0;
  float h = b * b - a * cc;
  if (h < 0.0) return vec2(-1.0, 0.0);
  float closest = sqrt(max(cc + 1.0 - b * b / a, 0.0));
  return vec2((-b - sqrt(h)) / a, smoothstep(1.0, 0.7, closest));
}

vec3 above(vec3 ro, vec3 rd, vec2 uv) {
  float tw = traceWater(ro, rd);
  vec3 haze = sky(vec3(rd.x, 0.0, rd.z)) * 0.93;
  vec3 col;
  if (tw < 1e4) {
    col = shadeWater(ro + rd * tw, rd, tw);
    col = mix(col, haze, 1.0 - exp(-tw * 0.0055));
  } else {
    col = sky(rd);
  }
  float ts;
  vec4 sh = shipLayer(ro, rd, ts);
  if (sh.a > 0.001 && ts < tw) {
    // Backlit by the moon: a near-silhouette, with a little of the poster's sail texture left in.
    vec3 sc = sh.rgb * vec3(0.30, 0.34, 0.40) + vec3(0.012, 0.018, 0.026);
    sc = mix(sc, haze, 1.0 - exp(-ts * 0.0065));
    col = mix(col, sc, sh.a);
  }
  // Low sea mist drifting across the horizon, thick enough to veil the ship's hull.
  float band = exp(-abs(rd.y + 0.01) * 26.0);
  float mn = fbm(vec2(rd.x * 4.5 / max(-rd.z, 0.2) + uTime * 0.022, rd.y * 20.0 - uTime * 0.012));
  col = mix(col, haze * 1.02, band * smoothstep(0.32, 0.85, mn) * 0.72);
  // Wind-blown spray close to the lens.
  col += vec3(0.75, 0.8, 0.8) * particles(uv + vec2(-uTime * 0.12, 0.0), 0.0, 0.05) * 0.10 * smoothstep(0.2, -0.6, uv.y);
  return col;
}

vec3 below(vec3 ro, vec3 rd, vec2 uv) {
  float depth = max(-ro.y, 0.0);
  float dk = smoothstep(0.0, 34.0, depth);
  vec3 fogC = mix(vec3(0.040, 0.165, 0.190), vec3(0.004, 0.022, 0.038), dk);
  fogC = mix(fogC * 0.32, fogC * 1.3, smoothstep(-0.7, 0.7, rd.y));
  vec3 col = fogC;

  if (rd.y > 0.0) {
    float t = -ro.y / rd.y;
    for (int i = 0; i < 4; i++) {
      vec3 p = ro + rd * t;
      t = (waves(p.xz, GEO) - ro.y) / rd.y;
    }
    t = max(t, 0.0);
    vec3 s = ro + rd * t;
    vec3 n = waterNormal(s.xz, 0.06 + t * 0.004, smoothstep(30.0, 120.0, t));
    vec3 tr = refract(rd, -n, 1.33);
    vec3 surf;
    if (dot(tr, tr) > 0.0) {
      surf = sky(tr) * 0.78;
      float tsh;
      vec4 sh = shipLayer(s, tr, tsh);
      surf = mix(surf, vec3(0.01, 0.025, 0.035), sh.a * 0.92);
      float rim = pow(1.0 - clamp(tr.y, 0.0, 1.0), 6.0);
      surf += vec3(0.18, 0.3, 0.3) * rim;
    } else {
      surf = fogC * 0.55 + vec3(0.02, 0.06, 0.065);
    }
    surf += vec3(0.45, 0.65, 0.6) * caustic(s.xz * 0.32) * 0.09;
    col = mix(fogC, surf, exp(-t * 0.032));
  }

  // The hull, seen from beneath.
  mat2 yaw = rot(SHIP_YAW);
  vec3 hro = ro - vec3(SHIP_X, 0.2, SHIP_Z), hrd = rd;
  hro.xz = yaw * hro.xz; hrd.xz = yaw * hrd.xz;
  vec2 hit = ellipsoid(hro, hrd, vec3(0.0), vec3(2.2, 1.7, 10.5));
  if (hit.x > 0.0 && (ro + rd * hit.x).y < 0.0) {
    col = mix(col, vec3(0.006, 0.016, 0.024), exp(-hit.x * 0.035) * 0.9 * hit.y);
  }

  // Light shafts: march a few samples, each looking up along the light to the surface.
  float jitter = hash12(gl_FragCoord.xy + fract(uTime) * 61.0);
  float shafts = 0.0;
  for (int i = 0; i < 6; i++) {
    float tt = (float(i) + jitter) * 4.5;
    vec3 q = ro + rd * tt;
    if (q.y > 0.0) break;
    vec2 sp = q.xz - SUN_UNDER.xz / SUN_UNDER.y * q.y;
    float g = noise(sp * 0.11 + vec2(uTime * 0.03, uTime * 0.018)) * noise(sp * 0.27 - vec2(uTime * 0.022, 0.0));
    shafts += smoothstep(0.1, 0.4, g) * exp(q.y * 0.06);
  }
  col += vec3(0.30, 0.48, 0.45) * shafts * 0.14 * (1.0 - dk * 0.75) * smoothstep(-0.5, 0.4, rd.y);

  // Caustic light drifting through the water in front of the camera.
  vec3 cq = ro + rd * 7.0;
  col += vec3(0.25, 0.42, 0.4) * caustic(cq.xz * 0.45 + cq.y * 0.2) * 0.035 * exp(cq.y * 0.12);

  // Suspended particles, drifting up past the lens as the camera descends.
  col += vec3(0.55, 0.7, 0.68) * particles(uv, ro.y * 0.18, 0.5) * 0.10 * (1.0 - dk * 0.5);
  return col;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y * 2.0;
  float p = uProg, q = uDeep, t = uTime;

  float a1 = smoothstep(0.0, 0.38, p);
  float b1 = smoothstep(0.18, 0.62, p);
  float c1 = clamp((p - 0.5) / 0.32, 0.0, 1.0);
  float d1 = smoothstep(0.7, 1.0, p);
  float camZ = -24.0 * b1 - 25.0 * d1 - 8.0 * q;
  float camY = mix(3.4, 2.7, b1);
  float e = c1 - 0.5;
  float g = 0.5 + 4.0 * e * e * e;
  camY = mix(camY, -2.6, g); // lingers at the surface mid-crossing
  camY = mix(camY, -9.0, d1) - 13.0 * q;
  float pitch = mix(0.3, -0.07, a1);
  pitch = mix(pitch, 0.05, c1);
  pitch = mix(pitch, 0.5, d1);
  pitch = mix(pitch, 0.08, smoothstep(0.0, 0.5, q)); // settle into the dark water behind the text
  float above0 = 1.0 - c1;
  camY += 0.22 * sin(t * 0.6) * above0;

  vec3 ro = vec3(0.0, camY, camZ);
  vec3 rd = normalize(vec3(uv.x, uv.y, -1.75));
  rd.xy = rot(sin(t * 0.45) * 0.012 * above0) * rd.xy;
  rd = vec3(rd.x, rd.y * cos(pitch) - rd.z * sin(pitch), rd.y * sin(pitch) + rd.z * cos(pitch));

  // Per-pixel waterline: a point just ahead of the lens decides above or below.
  vec3 fwd = vec3(0.0, sin(pitch), -cos(pitch));
  vec3 np = ro + rd * (1.0 / dot(rd, fwd)); // flat near plane, so the waterline is a true line
  float wl = np.y - waves(np.xz, GEO);
  vec3 col = wl > 0.0 ? above(np, rd, uv) : below(np, rd, uv);
  float line = exp(-abs(wl) * 22.0);
  col = mix(col, col * 0.35 + vec3(0.06, 0.13, 0.14), line * 0.65);

  float vig = smoothstep(1.9, 0.4, length(uv * vec2(0.75, 1.0)));
  col *= mix(0.55, 1.0, vig);
  col += (hash12(gl_FragCoord.xy + fract(t * 7.0) * 113.0) - 0.5) * 0.03;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;
