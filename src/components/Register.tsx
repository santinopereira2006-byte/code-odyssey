import { event } from '../event.config';
import RegisterButton, { registrationReady } from './RegisterButton';

export default function Register() {
  return (
    <section id="register" className="section register">
      <div className="register__inner" data-reveal>
        <p className="eyebrow">The final chapter is yours</p>
        <h2 className="display">Begin the Odyssey</h2>
        <p className="lede">{event.tagline}</p>
        {registrationReady ? (
          <RegisterButton className="btn--gold btn--lg" label="Register now" />
        ) : (
          <>
            <span className="btn btn--lg is-disabled" aria-disabled="true">Registration opening soon</span>
            {import.meta.env.DEV && (
              <p className="config-note">Set <code>registrationUrl</code> in <code>src/event.config.ts</code> to enable registration.</p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
