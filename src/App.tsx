import { useEffect, useLayoutEffect, useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Landing from './components/Landing';
import About from './components/About';
import Rules from './components/Rules';
import Timeline from './components/Timeline';
import ProblemStatements from './components/ProblemStatements';
import Prizes from './components/Prizes';
import Sponsors from './components/Sponsors';
import Faq from './components/Faq';
import Register from './components/Register';
import Contact from './components/Contact';
import Footer from './components/Footer';

export default function App() {
  const [loading, setLoading] = useState(true);

  // The page sits underneath the loading screen; keep it still until the screen has gone.
  useLayoutEffect(() => {
    document.documentElement.classList.toggle('is-loading', loading);
  }, [loading]);

  // Fade sections in as they scroll into view. Without IntersectionObserver everything simply shows.
  useEffect(() => {
    if (loading || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    document.documentElement.classList.add('can-reveal');
    document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [loading]);

  return (
    <>
      {loading && <Hero onDone={() => setLoading(false)} />}
      <a className="skip" href="#about">Skip to content</a>
      <Navbar />
      <main>
        <Landing />
        <About />
        <Rules />
        <Timeline />
        <ProblemStatements />
        <Prizes />
        <Sponsors />
        <Faq />
        <Register />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
