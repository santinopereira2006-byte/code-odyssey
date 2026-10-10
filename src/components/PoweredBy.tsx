import { event } from '../event.config';

/** "Powered by TATA STRIVE" lock-up with the supplied logo. */
export default function PoweredBy({ className = '' }: { className?: string }) {
  const { name, logo, url } = event.poweredBy;
  return (
    <a className={`powered ${className}`} href={url} target="_blank" rel="noopener noreferrer">
      <img src={logo} alt={`${name} logo`} width={225} height={225} />
      <span>Powered by <strong>{name}</strong></span>
    </a>
  );
}
