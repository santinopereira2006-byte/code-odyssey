import Navbar from './components/Navbar';
import Hero from './components/Hero';
import { event } from './event.config';
import RegisterButton, { registrationReady } from './components/RegisterButton';

// Homepage prototype: anchor targets only — the full sections come later.
const stubs = [
  { id: 'timeline', eyebrow: 'Chapter I', title: 'The Voyage Ahead' },
  { id: 'prizes', eyebrow: 'Chapter II', title: 'The Treasure Awaits' },
  { id: 'sponsors', eyebrow: 'Chapter III', title: 'Those Who Make the Voyage Possible' },
];

export default function App() {
  return (
    <>
      <a className="skip" href="#timeline">Skip to content</a>
      <Navbar />
      <main>
        <Hero />
        {stubs.map((s) => (
          <section key={s.id} id={s.id} className="stub">
            <p className="eyebrow">{s.eyebrow}</p>
            <h2>{s.title}</h2>
            <p className="muted">Coming soon.</p>
          </section>
        ))}
        <section id="register" className="stub stub--register">
          <p className="eyebrow">{event.name} {event.edition}</p>
          <h2>Begin the Odyssey</h2>
          {registrationReady ? (
            <RegisterButton className="btn--gold" label="Register now" />
          ) : (
            <>
              <span className="btn is-disabled" aria-disabled="true">Registration opening soon</span>
              {import.meta.env.DEV && (
                <p className="config-note">Set <code>registrationUrl</code> in <code>src/event.config.ts</code> to enable registration.</p>
              )}
            </>
          )}
        </section>
      </main>
    </>
  );
}
