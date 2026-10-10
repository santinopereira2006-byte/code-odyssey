import { event } from '../event.config';

export default function Prizes() {
  return (
    <section id="prizes" className="section prizes">
      <header className="section__head" data-reveal>
        <p className="eyebrow">Chapter III — The Reward</p>
        <h2>The Treasure Awaits</h2>
        <p className="lede">
          {event.prizePool ? `A prize pool of ${event.prizePool}.` : 'The treasure will be revealed as the voyage draws near.'}
        </p>
      </header>
      <ol className="prizes__list">
        {event.prizes.map((p, i) => (
          <li key={p.title} className={i === 0 ? 'is-first' : ''} data-reveal>
            <span className="prizes__rank">{String(i + 1).padStart(2, '0')}</span>
            <h3>{p.title}</h3>
            <p className={`prizes__amount ${p.amount ? '' : 'is-tba'}`}>{p.amount ?? 'To be announced'}</p>
            {p.note && <p className="muted">{p.note}</p>}
          </li>
        ))}
      </ol>
    </section>
  );
}
