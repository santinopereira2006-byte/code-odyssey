import { event } from '../../event.config';
import RegisterButton, { registrationReady } from '../RegisterButton';
import Countdown from './Countdown';
import Hud from './Hud';

export default function SetSail() {
  return (
    <section id="register" className="section sail">
      <div className="sail__glow" aria-hidden="true" />
      <Hud index="Chapter IV" name={`${event.name} ${event.edition}`} depth="Surface" />
      <h2 className="sail__title" data-split>Set Sail</h2>
      <p className="lede" data-lines>
        Assemble your crew of four, check your KJSIT ID proofs, Somaiya email addresses and resumes —
        and register before Saturday, 12:00 AM.
      </p>
      <div className="sail__actions" data-reveal>
        {registrationReady ? (
          <RegisterButton className="btn--solid" label="Register now" />
        ) : (
          <span className="btn is-disabled" aria-disabled="true">Registration link coming soon</span>
        )}
        <a className="btn btn--ghost" href={event.organizer.instagram.url} target="_blank" rel="noopener noreferrer">
          Follow {event.organizer.instagram.handle}
        </a>
      </div>
      {!registrationReady && import.meta.env.DEV && (
        <p className="config-note">Set <code>registrationUrl</code> in <code>src/event.config.ts</code> to enable registration.</p>
      )}
      <div data-reveal><Countdown className="countdown--center" /></div>
    </section>
  );
}
