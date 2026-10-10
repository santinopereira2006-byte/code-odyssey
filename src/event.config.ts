/**
 * CODE ODYSSEY 5.0 — central event configuration.
 *
 * Edit everything here. Anything set to `null` (or an empty array) is treated
 * as "not yet verified" and is either hidden or shown as "to be announced".
 * Details below come from the official CO5 registration form.
 */

export type MilestoneStatus = 'upcoming' | 'live' | 'completed';

export interface Milestone {
  /** Short voyage name shown on the map and in the panel. */
  title: string;
  /** What actually happens at this stage. */
  subtitle: string;
  description: string;
  /** Location on the supplied map, in map pixels (map is 1600 × 900). */
  x: number;
  y: number;
  /** Map waypoint the marker sits on — flavour text only. */
  place: string;
  date: string | null;
  status: MilestoneStatus | null;
}

export interface Prize {
  title: string;
  amount: string | null;
  note: string | null;
}

export interface Sponsor {
  name: string;
  /** Path under /public, e.g. '/assets/sponsors/acme.svg'. */
  logo: string;
  url: string | null;
}

export interface SponsorTier {
  tier: string;
  sponsors: Sponsor[];
}

export interface Faq {
  question: string;
  answer: string | null;
}

export interface SocialLink {
  label: string;
  url: string;
}

export const event = {
  name: 'CODE ODYSSEY',
  edition: '5.0',
  tagline: 'Every great journey begins with the unknown.',
  theme: 'A journey through the unknown',

  organizer: {
    name: 'CSI KJSIT',
    fullName: 'Computer Society of India — KJSIT Student Chapter',
    logo: 'assets/csi-emblem.png',
    instagram: { handle: '@csi_kjsit', url: 'https://www.instagram.com/csi_kjsit/' },
  },

  /** Short form used on the loader, in the poster's DD.MM.YY style. */
  loaderDate: '17.10.26',
  heroDate: '17 — 18 . 10 . 26',

  /** Countdown targets (IST). The hackathon start time is a TODO — set it once confirmed. */
  registrationClosesAt: '2026-10-11T00:00:00+05:30',
  hackathonStartsAt: '2026-10-17T09:00:00+05:30',

  perk: 'Winners get an opportunity for a TATA STRIVE Internship (T&C applied).',

  /** Key rules, exactly as stated on the registration form. */
  rules: [
    { title: 'Eligibility', body: 'Strictly open to KJSIT students only — Third Year (TY) and Last Year (LY).' },
    { title: 'Crew of Four', body: 'Strictly 4 members per team. No less, no more.' },
    { title: 'Diversity', body: 'At least 1 compulsory female participant in every team.' },
    { title: 'Documents', body: 'KJSIT ID proofs, Somaiya email addresses and resumes must be accurate when you register.' },
  ],

  /** The road to the hackathon, from the registration form. */
  schedule: [
    { day: 'Saturday', date: '10 Oct', title: 'Registrations Close', body: 'Submit your crew by 12:00 AM (midnight).' },
    { day: 'Sunday', date: '11 Oct', title: 'Shortlist Revealed', body: 'Shortlisted teams are announced at night on our website and Instagram (@csi_kjsit).' },
    { day: 'Monday', date: '12 Oct', title: 'Briefing Day', body: 'Shortlisted teams report to college in formal attire for the event briefing.' },
    { day: 'Sat — Sun', date: '17 — 18 Oct', title: 'The Hackathon', body: 'Two days at sea. Build, break, iterate — and find your way home.' },
  ],

  /** TODO: set the real registration form URL. Empty = "requires configuration". */
  registrationUrl: '',

  /** TODO: fill in once verified. `null` fields are hidden. */
  details: {
    date: '17 – 18 October 2026' as string | null,
    venue: 'K. J. Somaiya Institute of Technology' as string | null,
    teamSize: 'Exactly 4 members, at least 1 female participant' as string | null,
    eligibility: 'KJSIT students — TY and LY only' as string | null,
    format: null as string | null,
    registrationDeadline: 'Saturday, 10 October 2026 — 12:00 AM (midnight)' as string | null,
  },

  contact: {
    email: null as string | null,
    phone: null as string | null,
  },

  social: [{ label: 'Instagram', url: 'https://www.instagram.com/csi_kjsit/' }] as SocialLink[],

  /** Suggested stages — rename, reorder, add or delete freely. */
  milestones: [
    { title: 'The Call', subtitle: 'Registrations Open', place: 'Troy', x: 1432, y: 437,
      description: 'The voyage is announced and registrations open for CODE ODYSSEY 5.0.', date: null, status: null },
    { title: 'First Passage', subtitle: 'Registration & Team Confirmation', place: 'Ismarus', x: 1361, y: 364,
      description: 'Teams finalise their crew and confirm their registration.', date: null, status: null },
    { title: 'The Gate', subtitle: 'Initial Shortlisting', place: 'Cape Malea', x: 1269, y: 637,
      description: 'Registered teams are reviewed and a shortlist is announced.', date: null, status: null },
    { title: 'The Trials', subtitle: 'Problem Statements & Initial Evaluation', place: 'Lotophagi', x: 585, y: 787,
      description: 'Problem statements are revealed and the first round of evaluation takes place.', date: null, status: null },
    { title: 'The Voyage', subtitle: 'Main Hackathon — Building Phase', place: 'Aeaea', x: 235, y: 463,
      description: 'The main event. Teams design, build and iterate on their solutions.', date: null, status: null },
    { title: 'The Gauntlet', subtitle: 'Mentoring & Technical Evaluation', place: 'Scylla & Charybdis', x: 877, y: 536,
      description: 'Mentors guide teams while their work faces technical evaluation.', date: null, status: null },
    { title: 'The Final Shore', subtitle: 'Final Pitch & Demonstration', place: 'Thrinacia', x: 821, y: 688,
      description: 'Finalists present and demonstrate their solutions to the judges.', date: null, status: null },
    { title: 'The Verdict', subtitle: 'Final Evaluation & Results', place: 'Scheria', x: 533, y: 383,
      description: 'Judges deliberate and the results are announced.', date: null, status: null },
    { title: 'Homeward Bound', subtitle: 'Closing Ceremony', place: 'Ithaca', x: 1137, y: 533,
      description: 'The voyage ends where it matters — the closing ceremony.', date: null, status: null },
  ] as Milestone[],

  /** PLACEHOLDER ranks — set `amount` once verified, or replace the list. */
  prizes: [
    { title: 'First Place', amount: null, note: null },
    { title: 'Second Place', amount: null, note: null },
    { title: 'Third Place', amount: null, note: null },
  ] as Prize[],
  prizePool: '₹50,000' as string | null,

  /** Add tiers like { tier: 'Title Sponsor', sponsors: [{ name, logo, url }] }. */
  sponsors: [] as SponsorTier[],

  faqs: [
    { question: 'Who can participate?', answer: 'Only KJSIT students in Third Year (TY) or Last Year (LY).' },
    { question: 'What is the team size?', answer: 'Exactly 4 members, with at least 1 female participant.' },
    { question: 'Is registration free or paid?', answer: null },
    { question: 'How does shortlisting work?', answer: 'Shortlisted teams are announced on Sunday night on our website and Instagram (@csi_kjsit).' },
    { question: 'What are the evaluation criteria?', answer: null },
    { question: 'What should participants bring?', answer: null },
    { question: 'How can participants contact the organisers?', answer: null },
  ] as Faq[],
};

export const MAP_SIZE = { width: 1600, height: 900 };

export const navLinks = [
  { label: 'The Call', href: '#about' },
  { label: 'Rules', href: '#rules' },
  { label: 'Voyage', href: '#voyage' },
  { label: 'Register', href: '#register' },
];
