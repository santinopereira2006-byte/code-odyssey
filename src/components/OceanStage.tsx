import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { OceanScene, pickArt } from '../scene/OceanScene';
import { rig } from '../scene/rig';

interface Props {
  reducedMotion: boolean;
  onReady: () => void;
}

/**
 * The fixed WebGL stage behind the whole site. It owns the OceanScene and composes
 * the rig's camera layers every frame. Without WebGL it falls back to the still art,
 * darkened by the same dive value so the descent still reads.
 */
export default function OceanStage({ reducedMotion, onReady }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const veil = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);
  const [fallbackSrc, setFallbackSrc] = useState(() => pickArt(window.innerWidth, window.innerHeight).src);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    const el = canvas.current!;
    let s: OceanScene | null = null;
    try {
      s = new OceanScene(el, !reducedMotion);
    } catch (err) {
      console.warn('WebGL scene unavailable, using the still image.', err);
      setFallback(true);
      const img = new Image();
      img.onload = img.onerror = () => onReadyRef.current();
      img.src = fallbackSrc;
    }

    if (s) {
      rig.scene = s;
      s.resize();
      s.load(pickArt(window.innerWidth, window.innerHeight)).then(() => onReadyRef.current(), () => onReadyRef.current());
    }

    const compose = () => {
      const a = rig.intro, b = rig.scroll;
      if (s) {
        const st = s.state;
        st.camX = b.camX;
        st.camY = a.camY + b.camY;
        st.zoom = a.zoom * b.zoom;
        st.roll = a.roll;
        st.exposure = a.exposure;
        st.dive = b.dive;
        // The intro's rack focus hands over to the scroll-directed focus.
        const w = Math.min(1, a.dof / 0.5);
        st.focus = b.focus + (a.focus - b.focus) * w;
        st.dof = Math.max(a.dof, 0.22 + b.dive * 0.4);
        st.lantern = b.lantern;
        st.glow = b.glow;
        st.velocity = rig.velocity;
      }
      if (veil.current) veil.current.style.opacity = String(s ? 0 : Math.min(1, b.dive * 0.85 + (1 - a.exposure)));
    };
    gsap.ticker.add(compose);

    const onResize = () => {
      if (s) {
        s.resize();
        s.load(pickArt(window.innerWidth, window.innerHeight));
      } else {
        setFallbackSrc(pickArt(window.innerWidth, window.innerHeight).src);
      }
    };
    window.addEventListener('resize', onResize);

    const sync = () => (document.hidden ? s?.pause() : s?.play());
    sync();
    document.addEventListener('visibilitychange', sync);

    return () => {
      gsap.ticker.remove(compose);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', sync);
      s?.destroy();
      rig.scene = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  return (
    <div className="stage" aria-hidden="true">
      <canvas ref={canvas} className="stage__canvas" hidden={fallback} />
      {fallback && <img className="stage__fallback" src={fallbackSrc} alt="" />}
      <div className="stage__veil" ref={veil} />
    </div>
  );
}
