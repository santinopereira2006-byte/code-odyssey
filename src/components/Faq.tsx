import { event } from '../event.config';

/** Native <details> gives an accessible, keyboard-friendly accordion for free. */
export default function Faq() {
  return (
    <section id="faq" className="section faq">
      <header className="section__head" data-reveal>
        <p className="eyebrow">Chapter V — Questions</p>
        <h2>Before You Set Sail</h2>
      </header>
      <div className="faq__list" data-reveal>
        {event.faqs.map((f) => (
          <details key={f.question}>
            <summary>{f.question}</summary>
            <p className={f.answer ? '' : 'muted'}>{f.answer ?? 'This will be confirmed by the organisers soon.'}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
