import { useEffect, useState } from 'react';
import { event } from '../../event.config';

const TARGETS = [
  { at: Date.parse(event.registrationClosesAt), label: 'Registration closes in' },
  { at: Date.parse(event.hackathonStartsAt), label: 'The voyage begins in' },
];

const pad = (n: number) => String(n).padStart(2, '0');

/** Counts down to the next milestone; hides itself once the hackathon has begun. */
export default function Countdown({ className = '' }: { className?: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const next = TARGETS.find((t) => t.at > now);
  if (!next) return null;
  const s = Math.floor((next.at - now) / 1000);
  const parts = [
    ['Days', Math.floor(s / 86400)],
    ['Hrs', Math.floor((s % 86400) / 3600)],
    ['Min', Math.floor((s % 3600) / 60)],
    ['Sec', s % 60],
  ] as const;

  return (
    <div className={`countdown ${className}`} role="timer" aria-label={`${next.label} ${parts.map(([l, v]) => `${v} ${l}`).join(' ')}`}>
      <p className="countdown__label">{next.label}</p>
      <div className="countdown__cells" aria-hidden="true">
        {parts.map(([l, v]) => (
          <span key={l} className="countdown__cell"><b>{pad(v)}</b><small>{l}</small></span>
        ))}
      </div>
    </div>
  );
}
