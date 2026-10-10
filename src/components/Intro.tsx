import { event } from '../event.config';
import RegisterButton from './RegisterButton';

const detailLabels: Record<keyof typeof event.details, string> = {
  date: 'Date',
  venue: 'Venue',
  teamSize: 'Team size',
  eligibility: 'Eligibility',
  format: 'Format',
  registrationDeadline: 'Registration deadline',
};

export default function Intro() {
  const details = (Object.keys(detailLabels) as (keyof typeof detailLabels)[])
    .filter((k) => event.details[k])
    .map((k) => [detailLabels[k], event.details[k]!] as const);

  return (
    <section id="journey" className="section intro">
      <div className="intro__grid">
        <header data-reveal>
          <p className="eyebrow">Chapter I — The Journey</p>
          <h2 className="display">The Call<br />to Adventure</h2>
        </header>
        <div className="intro__copy" data-reveal>
          {/* Draft copy — edit freely. */}
          <p className="intro__lead">
            Every great journey begins with the unknown. {event.name} {event.edition} brings together
            innovators, developers, and problem-solvers to transform ambitious ideas into meaningful solutions.
          </p>
          <RegisterButton className="btn--gold" label="Answer the call" />
        </div>
      </div>

      <div className="details" data-reveal>
        <h3 className="details__title">Voyage details</h3>
        {details.length ? (
          <dl className="details__list">
            {details.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="muted">Date, venue, team size and eligibility will be announced by {event.organizer.name}.</p>
        )}
      </div>
    </section>
  );
}
