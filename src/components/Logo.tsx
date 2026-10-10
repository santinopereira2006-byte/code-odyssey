import { event } from '../event.config';

/** The supplied CSI logo, cropped to its circular emblem (no redraw, proportions kept). */
export default function Logo({ size = 40 }: { size?: number }) {
  return (
    <span className="csi-logo" style={{ width: size, height: size }}>
      <img src={event.organizer.logo} alt={`${event.organizer.name} logo`} width={700} height={400} />
    </span>
  );
}
