import { event } from '../event.config';

export default function Prizes() {
  return (
    <section id="prizes" className="section prizes">
      <header className="section__head" data-reveal>
        <p className="eyebrow">Chapter V — The Reward</p>
        <h2>The Treasure Awaits</h2>
      </header>
      <div className="prizes__grid">
        <div className="prizes__pool" data-reveal>
          <p className="eyebrow">Prize pool</p>
          <p className="prizes__amount">{event.prizePool}</p>
          <p className="muted">Shared among the winning crews.</p>
        </div>
        <div className="prizes__perk" data-reveal>
          <img src={event.poweredBy.logo} alt={`${event.poweredBy.name} logo`} width={225} height={225} loading="lazy" />
          <div>
            <p className="eyebrow">Winners' perk</p>
            <h3>{event.perk.title}</h3>
            <p>{event.perk.text}</p>
            <p className="muted">{event.perk.terms}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
