import { useEffect, useState, type CSSProperties } from 'react';
import { event, navLinks } from '../event.config';
import Logo from './Logo';
import RegisterButton from './RegisterButton';

export default function Navbar({ visible = true, active = '' }: { visible?: boolean; active?: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className={`nav ${scrolled || open ? 'is-scrolled' : ''} ${open ? 'is-open' : ''} ${visible ? '' : 'is-hidden'}`}>
      <div className="nav__inner">
        <a href="#home" className="nav__brand" onClick={close}>
          <Logo size={32} />
          <span className="nav__wordmark">
            {event.name} <em>{event.edition}</em>
          </span>
        </a>
        <nav aria-label="Primary">
          <ul className="nav__links" id="nav-menu">
            {navLinks.map((l, i) => (
              <li key={l.href} style={{ '--i': i } as CSSProperties}>
                <a
                  href={l.href}
                  onClick={close}
                  className={l.href === `#${active}` ? 'is-active' : undefined}
                  aria-current={l.href === `#${active}` ? 'location' : undefined}
                >
                  <span className="nav__num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  {l.label}
                </a>
              </li>
            ))}
            <li className="nav__cta-mobile"><RegisterButton /></li>
          </ul>
        </nav>
        <RegisterButton className="nav__cta" />
        <button
          className="nav__toggle"
          aria-expanded={open}
          aria-controls="nav-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((o) => !o)}
        >
          <span /><span />
        </button>
      </div>
      <span className="nav__progress" aria-hidden="true" />
    </header>
  );
}
