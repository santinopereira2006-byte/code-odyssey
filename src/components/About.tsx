import { event } from '../event.config';
import PoweredBy from './PoweredBy';

const reasons = [
  { title: 'Build', text: 'Turn an idea into something that works over two focused days of making.' },
  { title: 'Collaborate', text: 'Sail with a crew of four: combine skills, divide the work, decide together.' },
  { title: 'Compete', text: `Contend for a prize pool worth ${event.prizePool}.` },
  { title: 'Launch', text: `Winners get an opportunity for a ${event.poweredBy.name} internship (T&C applied).` },
];

export default function About() {
  return (
    <section id="about" className="section about">
      <div className="about__grid">
        <div data-reveal>
          <p className="eyebrow">Chapter I — The Call</p>
          <h2>Welcome to Code Odyssey 5</h2>
        </div>
        <div className="about__copy" data-reveal>
          <p>
            {event.name} {event.edition} ({event.shortName}) is the hackathon organised by the Computer Society of
            India (CSI) student chapter of {event.organizer.college} (KJSIT). Its fifth edition takes its course from
            the oldest story of all: a long journey home through trials no one could plan for.
          </p>
          <p>
            Bring a crew, choose a problem, and find your way through on <strong>17th–18th October</strong>.
          </p>
          <PoweredBy />
        </div>
      </div>

      <div className="why" data-reveal>
        <h3 className="why__title">Why set sail</h3>
        <ol className="why__list">
          {reasons.map((r, i) => (
            <li key={r.title}>
              <span className="why__num">{['I', 'II', 'III', 'IV'][i]}</span>
              <h4>{r.title}</h4>
              <p>{r.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
