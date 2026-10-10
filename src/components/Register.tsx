import { event } from '../event.config';
import PoweredBy from './PoweredBy';
import RegisterButton, { registrationReady } from './RegisterButton';

export default function Register() {
  return (
    <section id="register" className="section register">
      <div className="register__inner" data-reveal>
        <p className="eyebrow">The final chapter is yours</p>
        <h2 className="display">Begin the Odyssey</h2>
        <p className="lede">Registrations close Saturday at 12:00 AM (midnight). Crews of exactly four, with at least one female participant.</p>
        {registrationReady ? (
          <RegisterButton className="btn--gold btn--lg" label="Register now" />
        ) : (
          <span className="btn btn--lg is-disabled" aria-disabled="true">Registration opening soon</span>
        )}
        <p className="register__note">{event.registrationNote}</p>
        <PoweredBy />
      </div>
    </section>
  );
}
