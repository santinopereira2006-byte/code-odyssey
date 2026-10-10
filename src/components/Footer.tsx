import { event, navLinks } from '../event.config';
import Logo from './Logo';

export default function Footer() {
  const { email, phone } = event.contact;
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
        {(email || phone || event.social.length > 0) && (
          <div className="footer__contact">
            {email && <a href={`mailto:${email}`}>{email}</a>}
            {phone && <a href={`tel:${phone}`}>{phone}</a>}
            {event.social.map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a>
            ))}
          </div>
        )}
      </div>
      <p className="footer__legal">© {new Date().getFullYear()} {event.organizer.name}. All rights reserved.</p>
    </footer>
  );
}
