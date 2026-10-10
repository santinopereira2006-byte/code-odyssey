import { event } from '../event.config';

export const registrationReady = event.registrationUrl.trim() !== '';

/** Opens the registration form in a new tab; until one is set it scrolls to the register section. */
export default function RegisterButton({ className = '', label = 'Register' }: { className?: string; label?: string }) {
  return registrationReady ? (
    <a className={`btn ${className}`} href={event.registrationUrl} target="_blank" rel="noopener noreferrer">
      {label}
    </a>
  ) : (
    <a className={`btn ${className}`} href="#register" title="Registration link not configured yet">
      {label}
    </a>
  );
}
