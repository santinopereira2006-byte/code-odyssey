import { event } from '../event.config';

export default function Rules() {
  return (
    <section id="rules" className="section rules">
      <header className="section__head" data-reveal>
        <p className="eyebrow">Chapter II — The Code of the Sea</p>
        <h2>Key Rules &amp; Schedule</h2>
        <p className="lede">Read these before you assemble your crew. They are strict.</p>
      </header>
      <ol className="rules__list">
        {event.rules.map((r, i) => (
          <li key={r.label} data-reveal>
            <span className="rules__num">{String(i + 1).padStart(2, '0')}</span>
            <p className="eyebrow">{r.label}</p>
            <h3>{r.value}</h3>
            {r.note && <p className="muted">{r.note}</p>}
          </li>
        ))}
      </ol>
      <p className="rules__note" data-reveal>{event.registrationNote}</p>
    </section>
  );
}
