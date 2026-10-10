import { event } from '../event.config';

// Draft copy — edit freely.
const reasons = [
  { title: 'Build', text: 'Turn an idea into something that works, in a single focused stretch of making.' },
  { title: 'Collaborate', text: 'Sail with a crew — combine skills, divide the work, decide together.' },
  { title: 'Experiment', text: 'Try the approach you have been curious about. The unknown is the point.' },
  { title: 'Present', text: 'Stand before judges and peers and make the case for what you built.' },
];

export default function About() {
  return (
    <section id="about" className="section about">
      <div className="about__grid">
        <div data-reveal>
          <p className="eyebrow">About the event</p>
          <h2>A voyage in its fifth edition</h2>
        </div>
        <p className="about__copy" data-reveal>
          {event.name} is the hackathon organised by {event.organizer.fullName}. Edition {event.edition} takes
          its course from the oldest story of all: a long journey home through trials no one could plan for.
          Bring a crew, choose a problem, and find your way through.
        </p>
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
