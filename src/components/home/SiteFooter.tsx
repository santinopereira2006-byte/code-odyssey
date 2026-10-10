import { event, navLinks } from '../../event.config';
import Logo from '../Logo';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <Logo size={56} />
          <div>
            <p className="site-footer__name">{event.name} <em>{event.edition}</em></p>
            <p className="muted">Organised by {event.organizer.fullName}</p>
          </div>
        </div>
        <nav aria-label="Footer">
          <ul className="site-footer__links">
            {navLinks.map((l) => <li key={l.href}><a href={l.href}>{l.label}</a></li>)}
            <li><a href={event.organizer.instagram.url} target="_blank" rel="noopener noreferrer">Instagram</a></li>
          </ul>
        </nav>
      </div>
      <p className="site-footer__legal">© 2026 {event.organizer.name}. All rights reserved.</p>
    </footer>
  );
}
