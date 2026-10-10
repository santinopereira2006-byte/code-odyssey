/**
 * CODE ODYSSEY 5.0 — central event configuration.
 *
 * Edit everything here. Anything set to `null` (or an empty array) is treated
 * as "not yet verified" and is either hidden or shown as "to be announced".
 * Confirmed so far: event name, organiser, the About copy, highlights and
 * participation guidelines. Still to configure: `registrationUrl` and the
 * exact `registrationDeadline.date`.
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
    logo: 'assets/csi-logo.png',
  },

  /**
   * Google Form (or other) registration URL. Every "Register" button opens it in a new tab.
   * TODO: paste the real form link here. While empty, buttons show "registration opening soon".
   */
  registrationUrl: '',

  /** About / description section. */
  about: {
    subtitle: 'A 30-hour offline hackathon by CSI KJSIT.',
    description: [
      'Code Odyssey 5.0 is a hackathon organized by the Computer Society of India (CSI) student chapter at K. J. Somaiya Institute of Technology (KJSIT).',
      'The event brings together teams of students to develop innovative, technology-driven solutions to real-world problem statements through collaboration, creativity, and practical implementation.',
    ],
    highlights: [
      { value: '30', unit: 'Hours', label: 'Offline hackathon' },
      { value: '₹50,000', unit: null, label: 'Prize pool worth' },
      { value: '17–18', unit: 'October 2026', label: 'Hackathon dates' },
      { value: '4', unit: 'Members', label: 'Required team size' },
    ] as { value: string; unit: string | null; label: string }[],
  },

  /**
   * Registration deadline: Saturday, 12:00 AM (midnight).
   * TODO: set `date` (e.g. '10 October 2026') once confirmed; while null it reads "date to be confirmed".
   */
  registrationDeadline: {
    day: 'Saturday',
    time: '12:00 AM (midnight)',
    date: null as string | null,
  },

  instagram: { handle: '@csi_kjsit', url: 'https://www.instagram.com/csi_kjsit/' },

  /** `null` fields are hidden. */
  details: {
    date: '17–18 October 2026' as string | null,
    venue: null as string | null,
    teamSize: 'Exactly 4 members' as string | null,
    eligibility: 'KJSIT third-year and final-year students' as string | null,
    format: '30-hour offline hackathon' as string | null,
    registrationDeadline: null as string | null,
  },

  contact: {
    email: null as string | null,
    phone: null as string | null,
  },

  social: [] as SocialLink[],

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
  prizePool: null as string | null,

  /** Add tiers like { tier: 'Title Sponsor', sponsors: [{ name, logo, url }] }. */
  sponsors: [] as SponsorTier[],

  faqs: [
    { question: 'Who can participate?', answer: null },
    { question: 'What is the team size?', answer: null },
    { question: 'Is registration free or paid?', answer: null },
    { question: 'How does shortlisting work?', answer: null },
    { question: 'What are the evaluation criteria?', answer: null },
    { question: 'What should participants bring?', answer: null },
    { question: 'How can participants contact the organisers?', answer: null },
  ] as Faq[],
};

export const MAP_SIZE = { width: 1600, height: 900 };

export const navLinks = [
  { label: 'About', href: '#about' },
  { label: 'Timeline', href: '#timeline' },
  { label: 'Prizes', href: '#prizes' },
  { label: 'Sponsors', href: '#sponsors' },
];
