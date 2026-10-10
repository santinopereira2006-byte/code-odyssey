import { event } from '../event.config';
import Logo from './Logo';

export default function Contact() {
  const { email, phone, people } = event.contact;
  return (
    <section id="contact" className="section contact">
      <header className="section__head" data-reveal>
        <p className="eyebrow">Chapter VIII — Send Word</p>
        <h2>Contact Us</h2>
        <p className="lede">Questions about the voyage? Reach the {event.organizer.name} crew.</p>
      </header>

      <div className="contact__grid">
        {event.social.map((s) => (
          <a key={s.url} className="contact__card" href={s.url} target="_blank" rel="noopener noreferrer" data-reveal>
            <p className="eyebrow">{s.label}</p>
            <h3>{s.handle}</h3>
            <p className="muted">Shortlists and announcements are posted here.</p>
          </a>
        ))}
        {email && (
          <a className="contact__card" href={`mailto:${email}`} data-reveal>
            <p className="eyebrow">Email</p>
            <h3>{email}</h3>
          </a>
        )}
        {phone && (
          <a className="contact__card" href={`tel:${phone.replace(/\s+/g, '')}`} data-reveal>
            <p className="eyebrow">Phone</p>
            <h3>{phone}</h3>
          </a>
        )}
        {people.map((p) => (
          <div key={p.name} className="contact__card" data-reveal>
            <p className="eyebrow">{p.role}</p>
            <h3>{p.name}</h3>
            {p.phone && <a href={`tel:${p.phone.replace(/\s+/g, '')}`}>{p.phone}</a>}
            {p.email && <a href={`mailto:${p.email}`}>{p.email}</a>}
          </div>
        ))}
        <div className="contact__card contact__card--org" data-reveal>
          <Logo size={56} />
          <div>
            <p className="eyebrow">Organised by</p>
            <h3>{event.organizer.fullName}</h3>
            <p className="muted">{event.organizer.college}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
