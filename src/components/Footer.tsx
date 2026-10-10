import { event, navLinks } from '../event.config';
import Logo from './Logo';
import PoweredBy from './PoweredBy';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <Logo size={52} />
          <div>
            <p className="footer__name">{event.name} {event.edition}</p>
            <p className="muted">{event.organizer.fullName}</p>
          </div>
        </div>
        <nav aria-label="Footer">
          <ul className="footer__links">
            {navLinks.map((l) => <li key={l.href}><a href={l.href}>{l.label}</a></li>)}
          </ul>
        </nav>
        <PoweredBy />
      </div>
      <p className="footer__legal">
        © {new Date().getFullYear()} {event.organizer.name}
        {event.social.map((s) => (
          <span key={s.url}> · <a href={s.url} target="_blank" rel="noopener noreferrer">{s.handle}</a></span>
        ))}
      </p>
    </footer>
  );
}
