import { event } from '../../event.config';

// `count` values tick up when they scroll into view.
const stats = [
  { prefix: '₹', count: 50000, label: 'Prize pool' },
  { count: 4, label: 'Crew per team' },
  { count: 2, label: 'Days at sea' },
  { text: '17—18', label: 'October 2026' },
];

export default function TheCall() {
  return (
    <section id="about" className="section call">
      <div className="section__head" data-reveal>
        <p className="eyebrow">Chapter I — The Call</p>
        <h2 className="display" data-track>The Voyage Begins</h2>
      </div>
      <div className="call__body">
        <p className="lede" data-reveal>
          Welcome to {event.name} {event.edition}, organised by the Computer Society of India (CSI) student
          chapter of K. J. Somaiya Institute of Technology (KJSIT). Like Odysseus, every crew sets out into the unknown — with
          nothing but their wits, their code and each other — and must find their way home.
        </p>
        <p className="muted" data-reveal>{event.perk}</p>
      </div>
      <dl className="stats">
        {stats.map((s) => (
          <div className="stat" key={s.label} data-reveal>
            <dt>{s.label}</dt>
            <dd>
              {s.prefix}
              {s.count !== undefined
                ? <span data-count={s.count}>{s.count.toLocaleString('en-IN')}</span>
                : s.text}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
