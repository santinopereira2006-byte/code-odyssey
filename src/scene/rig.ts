import type { OceanScene } from './OceanScene';

/**
 * One camera for the whole site. Each layer is driven by a different system and
 * composed every frame by <OceanStage>:
 *  - intro:  the time-based opening shot (Hero),
 *  - scroll: the scrubbed descent, cruise and ascent (Hero + sections),
 *  - the scene's own idle drift and pointer parallax (OceanScene).
 */
export const rig = {
  intro: { camY: -0.04, zoom: 1.85, roll: 0.045, exposure: 0, focus: 0.5, dof: 1.4 },
  scroll: { camX: 0, camY: 0, zoom: 1, dive: 0, focus: 0.95, lantern: 0, glow: 0.35 },
  velocity: 0,
  /** Whole-page scroll progress, 0 → 1. */
  progress: 0,
  scene: null as OceanScene | null,
};

/** Depth gauge reading, in metres, derived from the camera. */
export const depthMetres = () =>
  Math.max(0, Math.round(Math.min(1, rig.scroll.camY / 0.5) * (rig.scroll.dive * 120 + rig.progress * 320)));
