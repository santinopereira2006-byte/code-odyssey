import { event } from '../event.config';
import { PosterArt } from './Hero';
import PoweredBy from './PoweredBy';
import RegisterButton from './RegisterButton';

/** First screen of the page once the loading screen has faded. */
export default function Landing() {
  return (
    <section id="home" className="landing" aria-labelledby="landing-title">
      <div className="landing__art" aria-hidden="true">
        <div className="landing__poster"><PosterArt /></div>
      </div>
      <div className="landing__shade" aria-hidden="true" />

      <div className="landing__inner">
        <p className="eyebrow">{event.organizer.name} presents</p>
        <h1 id="landing-title" className="landing__title">
          {event.name} <span>{event.edition}</span>
        </h1>
        <PoweredBy className="landing__powered" />
        <p className="landing__tagline">{event.tagline}</p>

        <dl className="landing__facts">
          {event.highlights.map((h) => (
            <div key={h.label}>
              <dt>{h.label}</dt>
              <dd>{h.value}</dd>
            </div>
          ))}
        </dl>

        <div className="landing__actions">
          <RegisterButton className="btn--gold btn--lg" label="Register now" />
          <a className="btn btn--lg" href="#rules">Read the rules</a>
        </div>
      </div>

      <a href="#about" className="landing__cue"><span>Scroll</span><i aria-hidden="true" /></a>
    </section>
  );
}
