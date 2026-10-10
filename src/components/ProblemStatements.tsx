import data from '../data/problem-statements.json';

interface ProblemStatement {
  id: string;
  title: string;
  domain?: string;
  description: string;
}

/** Content comes from src/data/problem-statements.json — set "released" to true to show the list. */
export default function ProblemStatements() {
  const statements = data.statements as ProblemStatement[];
  const show = data.released && statements.length > 0;

  return (
    <section id="problems" className="section problems">
      <header className="section__head" data-reveal>
        <p className="eyebrow">Chapter IV — The Trials</p>
        <h2>Problem Statements</h2>
      </header>
      {show ? (
        <ol className="problems__list">
          {statements.map((p) => (
            <li key={p.id} data-reveal>
              <p className="eyebrow">{p.id}{p.domain ? ` · ${p.domain}` : ''}</p>
              <h3>{p.title}</h3>
              <p className="muted">{p.description}</p>
            </li>
          ))}
        </ol>
      ) : (
        <div className="problems__sealed" data-reveal>
          <span className="problems__seal" aria-hidden="true">?</span>
          <p className="problems__placeholder">{data.placeholder}</p>
          {data.note && <p className="muted">{data.note}</p>}
        </div>
      )}
    </section>
  );
}
