import { event } from '../event.config';

/** CSI emblem (cut from the supplied CSI KJSIT logo onto a transparent background). */
export default function Logo({ size = 40 }: { size?: number }) {
  return (
    <img
      className="csi-logo"
      src={event.organizer.logo}
      alt={`${event.organizer.name} logo`}
      width={size}
      height={size}
    />
  );
}
