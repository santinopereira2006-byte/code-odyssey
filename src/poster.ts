/**
 * Geometry for the landscape poster (public/assets/odyssey-poster-wide.webp, 1672 × 941).
 * Every coordinate is in source-image pixels and converted to % so all layers stay
 * aligned at any rendered size.
 */
import type { CSSProperties } from 'react';

export const POSTER_WIDE = 'assets/odyssey-poster-wide.webp';
export const W = 1672;
export const H = 941;

export type Pt = [number, number];
export type Rect = [x: number, y: number, w: number, h: number];

const px = (v: number) => `${(v / W) * 100}%`;
const py = (v: number) => `${(v / H) * 100}%`;

export const rectStyle = ([x, y, w, h]: Rect): CSSProperties => ({
  left: px(x), top: py(y), width: px(w), height: py(h),
});

/** Positions an <img> of the full poster inside a box so that `src` fills the box. */
export const cloneStyle = ([sx, sy, sw, sh]: Rect): CSSProperties => ({
  width: `${(W / sw) * 100}%`,
  height: `${(H / sh) * 100}%`,
  left: `${(-sx / sw) * 100}%`,
  top: `${(-sy / sh) * 100}%`,
});

/** Linear feathering on all four edges (fractions of the box). */
export const featherStyle = (fx: number, fy: number): CSSProperties => {
  const m = `linear-gradient(to right, transparent, #000 ${fx * 100}%, #000 ${100 - fx * 100}%, transparent), linear-gradient(to bottom, transparent, #000 ${fy * 100}%, #000 ${100 - fy * 100}%, transparent)`;
  return { WebkitMaskImage: m, maskImage: m, WebkitMaskComposite: 'source-in', maskComposite: 'intersect' };
};

export const polygon = (pts: Pt[]) =>
  `polygon(${pts.map(([x, y]) => `${(x / W) * 100}% ${(y / H) * 100}%`).join(', ')})`;

export interface Patch { src: Rect; dst: Rect; fx: number; fy: number }

/**
 * Clone patches that paint over the film's own lettering (credits, tagline, title,
 * release line, studio marks) with nearby pixels of the same poster.
 */
export const TEXT_PATCHES: Patch[] = [
  { src: [160, 8, 470, 70], dst: [600, 8, 470, 70], fx: 0.1, fy: 0.15 },      // director credit
  { src: [500, 510, 652, 76], dst: [500, 432, 652, 76], fx: 0.04, fy: 0.12 }, // title (lower line)
  { src: [932, 188, 12, 326], dst: [794, 188, 154, 326], fx: 0.04, fy: 0.06 },// tagline + "THE" on the navy panel
  { src: [781, 348, 32, 40], dst: [781, 388, 32, 40], fx: 0.2, fy: 0.2 },    // edge of "T"
  { src: [250, 845, 370, 80], dst: [650, 845, 370, 80], fx: 0.08, fy: 0.15 }, // release line
  { src: [230, 868, 125, 50], dst: [35, 868, 125, 50], fx: 0.15, fy: 0.2 },   // studio mark, left
  { src: [1330, 852, 125, 62], dst: [1520, 852, 125, 62], fx: 0.15, fy: 0.2 },// studio mark, right
];

/** Hides the hull in the waves; the sail is hidden by the mist bank. */
export const SHIP_SEA_PATCH: Patch = { src: [590, 760, 150, 60], dst: [770, 716, 150, 80], fx: 0.18, fy: 0.15 };
export const SHIP_MIST: Rect = [690, 605, 320, 165];

/** Ivory sky that sits behind the helmet once it breaks apart (cloned from the left sky). */
export const BACKPLATE = { src: [40, 30, 490, 550] as Rect, dst: [520, 20, 650, 650] as Rect };
/** Bottom edge of the backplate follows the same broken line as the fragments. */
export const BREAK_LINE: Pt[] = [
  [1060, 662], [1010, 652], [950, 598], [870, 610], [800, 596], [740, 604], [690, 592], [650, 606], [600, 598], [560, 612],
];

/** Art-directed helmet fragments, cut along the poster's own vertical collage panels. */
export interface Fragment {
  id: string;
  pts: Pt[];
  /** Final drift in poster px, rotation in deg, scale, and start offset in the timeline. */
  x: number; y: number; r: number; s: number; at: number;
}

export const FRAGMENTS: Fragment[] = [
  { id: 'stripe3', at: 0, x: -70, y: -40, r: -2, s: 1.06,
    pts: [[740, 85], [745, 81], [760, 76], [790, 69], [800, 67], [800, 596], [740, 604]] },
  { id: 'panel', at: 0.1, x: 60, y: 45, r: 1.5, s: 1.08,
    pts: [[800, 250], [950, 250], [950, 598], [870, 610], [800, 596]] },
  { id: 'stripe2', at: 0.35, x: -150, y: 30, r: 3, s: 1.1,
    pts: [[690, 113], [700, 108], [715, 100], [730, 94], [740, 85], [740, 604], [690, 592]] },
  { id: 'face', at: 0.45, x: 230, y: 20, r: 5, s: 1.12,
    pts: [[950, 250], [1051, 250], [1042, 260], [1034, 280], [1018, 300], [1022, 320], [1036, 340], [1052, 360], [1059, 380],
      [1056, 400], [1059, 420], [1077, 440], [1084, 460], [1076, 480], [1072, 500], [1078, 520], [1085, 540], [1062, 560],
      [1059, 580], [1066, 610], [1060, 662], [1010, 652], [950, 598]] },
  { id: 'crest', at: 0.6, x: 170, y: -150, r: 7, s: 1.14,
    pts: [[800, 67], [820, 63], [850, 63], [880, 65], [910, 64], [940, 68], [970, 79], [1000, 90], [1030, 107], [1060, 129],
      [1090, 150], [1105, 165], [1121, 180], [1093, 200], [1074, 220], [1060, 240], [1051, 250], [800, 250]] },
  { id: 'stripe1', at: 0.7, x: -230, y: -70, r: -4, s: 1.12,
    pts: [[650, 144], [655, 137], [670, 125], [685, 115], [690, 113], [690, 592], [650, 606]] },
  { id: 'hair', at: 0.85, x: -320, y: 30, r: -7, s: 1.16,
    pts: [[595, 255], [610, 205], [625, 180], [640, 157], [650, 144], [650, 606], [600, 598], [560, 612], [582, 580],
      [595, 560], [604, 540], [606, 520], [588, 500], [595, 480], [604, 460], [587, 420], [589, 380], [583, 340],
      [584, 300], [589, 260]] },
];

/** Vertical seams between fragments, for the brief light-through-the-cracks moment. */
export const SEAMS: Pt[][] = [
  [[650, 144], [650, 606]], [[690, 113], [690, 592]], [[740, 85], [740, 604]],
  [[800, 67], [800, 596]], [[800, 250], [1051, 250]], [[950, 250], [950, 598]],
];
