import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { event } from '../event.config';
import { POSTER_WIDE, cloneStyle, type Rect } from '../poster';
import RegisterButton, { registrationReady } from './RegisterButton';

gsap.registerPlugin(ScrollTrigger);

const { registrationDeadline: deadline, instagram } = event;

const guidelines: { term: string; text: ReactNode }[] = [
  { term: 'Eligibility', text: 'Open to KJSIT third-year and final-year students only.' },
  { term: 'Team size', text: 'Exactly four members per team.' },
  { term: 'Diversity', text: 'At least one female participant per team.' },
  {
    term: 'Registration deadline',
    text: <>{deadline.day}{deadline.date ? `, ${deadline.date}` : ''}, {deadline.time}.{!deadline.date && <span className="rules__tbc"> Date to be confirmed.</span>}</>,
  },
  {
    term: 'Shortlisting',
    text: <>Shortlisted teams are announced on Sunday night on the official website and/or Instagram{' '}
      <a href={instagram.url} target="_blank" rel="noopener noreferrer">{instagram.handle}</a>.</>,
  },
  { term: 'Event briefing', text: 'Shortlisted teams must report to college on Monday, in formal attire, for the event briefing.' },
  { term: 'Hackathon dates', text: event.details.date ?? 'To be announced.' },
  { term: 'Your details', text: 'Make sure your KJSIT ID proof, Somaiya email address and uploaded resume are accurate.' },
];

/** A strip of the poster's open sea — below the title and above the release line, so no film lettering. */
const SEA_STRIP: Rect = [300, 715, 1000, 125];

const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

/**
 * The scene after the hero: the camera has sunk into the sea, so this section opens
 * in the same navy the hero ends on. Content is fully visible by default; with motion
 * allowed, each block eases in once as it enters and reverses when scrolled back past.
 */
export default function Description() {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const q = gsap.utils.selector(root);
      const reveal = (trigger: Element, start = 'top 82%') => gsap.timeline({
        defaults: { ease: 'power3.out', duration: 0.8 },
        scrollTrigger: { trigger, start, toggleActions: 'play none none reverse' },
      });

      // Stage 1–2: label, gold line drawn across the page, then the title.
      reveal(q('.desc__intro')[0], 'top 88%')
        .from(q('.desc__label'), { opacity: 0, y: 10, duration: 0.6 })
        .from(q('.desc__line'), { scaleX: 0, duration: 1.1, ease: 'power2.inOut' }, 0.1)
        .from(q('.desc__title'), { opacity: 0, y: 32 }, 0.3)
        .from(q('.desc__subtitle'), { opacity: 0, y: 16 }, 0.5);

      // Stage 3: the description, one block at a time.
      reveal(q('.desc__body')[0])
        .from(q('.desc__body p'), { opacity: 0, y: 24, stagger: 0.14 });

      // Stage 4: highlights.
      reveal(q('.stats')[0], 'top 86%')
        .from(q('.stats__item'), { opacity: 0, y: 20, stagger: 0.09 })
        .from(q('.stats__rule'), { scaleX: 0, duration: 1, ease: 'power2.inOut' }, 0);

      // Stage 5: guidelines — the heading, then the rules in quick succession.
      reveal(q('.rules')[0])
        .from(q('.rules__head > *'), { opacity: 0, y: 16, stagger: 0.1 })
        .from(q('.rules__item'), { opacity: 0, y: 14, duration: 0.6, stagger: 0.05 }, 0.2);

      // Stage 6: call to action.
      reveal(q('.desc__cta')[0], 'top 88%')
        .from(q('.desc__cta > *'), { opacity: 0, y: 18, stagger: 0.1 });
    });
    return () => mm.revert();
  }, []);

  return (
    <section id="about" className="desc" ref={root} aria-labelledby="about-title">
      <div className="desc__atmos" aria-hidden="true">
        <div className="desc__sea">
          <img src={POSTER_WIDE} alt="" style={cloneStyle(SEA_STRIP)} />
        </div>
      </div>

      <header className="desc__intro">
        <p className="eyebrow desc__label">About the Hackathon</p>
        <span className="desc__line" aria-hidden="true" />
        <h2 className="desc__title" id="about-title">
          {event.name} <em>{event.edition}</em>
        </h2>
        <p className="desc__subtitle">{event.about.subtitle}</p>
      </header>

      <div className="desc__body">
        {event.about.description.map((para) => <p key={para}>{para}</p>)}
      </div>

      <div className="stats">
        <span className="stats__rule" aria-hidden="true" />
        <dl className="stats__grid">
          {event.about.highlights.map((h) => (
            <div className="stats__item" key={h.label}>
              <dt>{h.label}</dt>
              <dd>
                <span className="stats__value">{h.value}</span>
                <span className="stats__unit" aria-hidden={!h.unit}>{h.unit ?? '\u00a0'}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <section className="rules" aria-labelledby="rules-title">
        <div className="rules__head">
          <p className="eyebrow">Before you register</p>
          <h3 id="rules-title">Participation Guidelines</h3>
        </div>
        <ol className="rules__list">
          {guidelines.map((g, i) => (
            <li className="rules__item" key={g.term}>
              <span className="rules__num" aria-hidden="true">{roman[i]}</span>
              <div>
                <h4>{g.term}</h4>
                <p>{g.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="desc__cta">
        <h3>Ready to register?</h3>
        {registrationReady ? (
          <RegisterButton className="btn--gold btn--lg" label="Register now" />
        ) : (
          <span className="btn btn--lg is-disabled" aria-disabled="true">Register now</span>
        )}
        {!registrationReady && <p className="desc__cta-note">Registration link opening soon.</p>}
        {!registrationReady && import.meta.env.DEV && (
          <p className="config-note">Set <code>registrationUrl</code> in <code>src/event.config.ts</code> to enable this button.</p>
        )}
      </div>
    </section>
  );
}
