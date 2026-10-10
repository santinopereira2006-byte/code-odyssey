import { event } from '../event.config';
import Logo from './Logo';

export default function Sponsors() {
  return (
    <section id="sponsors" className="section sponsors">
      <header className="section__head" data-reveal>
        <p className="eyebrow">Chapter VI — The Patrons</p>
        <h2>Those Who Make the Voyage Possible</h2>
      </header>

      <div className="organiser" data-reveal>
        <Logo size={96} />
        <div>
          <p className="eyebrow">Organised by</p>
          <p className="organiser__name">{event.organizer.fullName}</p>
        </div>
      </div>

      {event.sponsors.length ? (
        event.sponsors.map((tier) => (
          <div key={tier.tier} className="tier" data-reveal>
            <h3 className="tier__title">{tier.tier}</h3>
            <ul className="tier__logos">
              {tier.sponsors.map((s) => {
                const img = <img src={s.logo} alt={`${s.name} logo`} loading="lazy" />;
                return (
                  <li key={s.name}>
                    {s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer">{img}</a> : img}
                  </li>
                );
              })}
            </ul>
          </div>
        ))
      ) : (
        <p className="sponsors__empty muted" data-reveal>Sponsors for this voyage will be announced soon.</p>
      )}
    </section>
  );
}
