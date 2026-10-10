/**
 * CODE ODYSSEY 5.0 — central event configuration.
 *
 * Edit everything here. Anything set to `null` (or an empty array) is hidden
 * or shown as "to be announced". Problem statements live separately in
 * src/data/problem-statements.json.
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

export interface Rule {
  label: string;
  value: string;
  note?: string;
}

export interface Sponsor {
  name: string;
  /** Path under /public, e.g. 'assets/sponsors/acme.svg'. */
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
  handle: string;
  url: string;
}

export interface ContactPerson {
  name: string;
  role: string;
  phone: string | null;
  email: string | null;
}

export const event = {
  name: 'CODE ODYSSEY',
  edition: '5.0',
  shortName: 'CO5',
  tagline: 'Every great journey begins with the unknown.',
  theme: 'A journey through the unknown',

  organizer: {
    name: 'CSI KJSIT',
    fullName: 'Computer Society of India — KJSIT Student Chapter',
    college: 'K. J. Somaiya Institute of Technology',
    logo: 'assets/csi-logo.png',
  },

  poweredBy: {
    name: 'TATA STRIVE',
    logo: 'assets/tata-strive.jpg',
    url: 'https://www.tatastrive.com',
  },

  registrationUrl:
    'https://docs.google.com/forms/d/e/1FAIpQLScnS-pePmxZkj10Mu1YkIt6eO_gNq5CDMErmhi9pekW2dn2CQ/viewform?pli=1',

  /** Headline facts shown on the landing section. */
  highlights: [
    { label: 'Prize pool', value: '₹50,000' },
    { label: 'Hackathon', value: '17–18 Oct' },
    { label: 'Team size', value: '4 members' },
    { label: 'Open to', value: 'KJSIT TY & LY' },
  ],

  /** Key rules & schedule. */
  rules: [
    { label: 'Eligibility', value: 'KJSIT students only', note: 'Strictly TY (Third Year) and LY (Last Year).' },
    { label: 'Team size', value: 'Exactly 4 members', note: 'No less, no more.' },
    { label: 'Diversity', value: 'At least 1 female participant', note: 'Compulsory for every team.' },
    { label: 'Registration deadline', value: 'Saturday, 12:00 AM', note: 'Registrations close at midnight on Saturday, 10 October.' },
    { label: 'Shortlist announcement', value: 'Sunday night', note: 'Shortlisted teams are displayed on this website and on Instagram (@csi_kjsit).' },
    { label: 'Briefing day', value: 'Monday, formal attire', note: 'Shortlisted teams report to college for the event briefing.' },
    { label: 'Hackathon', value: '17th–18th October', note: 'Held at K. J. Somaiya Institute of Technology.' },
  ] as Rule[],

  /** Reminder shown next to the registration call to action. */
  registrationNote:
    'Ensure all details, KJSIT ID proofs, Somaiya email addresses and resumes you upload are accurate.',

  contact: {
    /** Optional general inbox / phone; `null` hides it. */
    email: null as string | null,
    phone: null as string | null,
    /** Add student coordinators here, e.g. { name, role: 'Event Head', phone, email }. */
    people: [] as ContactPerson[],
  },

  social: [
    { label: 'Instagram', handle: '@csi_kjsit', url: 'https://www.instagram.com/csi_kjsit/' },
  ] as SocialLink[],

  /** Stages on the voyage map — rename, reorder, add or delete freely. */
  milestones: [
    { title: 'The Call', subtitle: 'Registrations Open', place: 'Troy', x: 1432, y: 437,
      description: 'The voyage is announced. Assemble a crew of four and register through the official form.', date: 'Open now', status: 'live' },
    { title: 'First Passage', subtitle: 'Registrations Close', place: 'Ismarus', x: 1361, y: 364,
      description: 'The registration form closes at midnight. Double-check your ID proofs, Somaiya emails and resumes.', date: 'Saturday, 10 Oct · 12:00 AM', status: 'upcoming' },
    { title: 'The Gate', subtitle: 'Shortlist Announced', place: 'Cape Malea', x: 1269, y: 637,
      description: 'Shortlisted teams are displayed on this website and on Instagram (@csi_kjsit).', date: 'Sunday, 11 Oct · night', status: 'upcoming' },
    { title: 'The Council', subtitle: 'Event Briefing', place: 'Lotophagi', x: 585, y: 787,
      description: 'Shortlisted teams report to college in formal attire for the event briefing.', date: 'Monday, 12 Oct', status: 'upcoming' },
    { title: 'The Trials', subtitle: 'Problem Statements Released', place: 'Aeaea', x: 235, y: 463,
      description: 'The problem statements are revealed. Each crew chooses the challenge it will take on.', date: null, status: 'upcoming' },
    { title: 'The Voyage', subtitle: 'Hackathon — Day 1', place: 'Scylla & Charybdis', x: 877, y: 536,
      description: 'The main event begins. Teams design, build and iterate on their solutions with mentors on hand.', date: 'Saturday, 17 Oct', status: 'upcoming' },
    { title: 'The Final Shore', subtitle: 'Hackathon — Day 2 & Final Pitch', place: 'Thrinacia', x: 821, y: 688,
      description: 'Teams finish building, then present and demonstrate their solutions to the judges.', date: 'Sunday, 18 Oct', status: 'upcoming' },
    { title: 'Homeward Bound', subtitle: 'Results & Closing', place: 'Ithaca', x: 1137, y: 533,
      description: 'Winners are announced and take home their share of the ₹50,000 prize pool and a shot at a TATA STRIVE internship.', date: 'Sunday, 18 Oct', status: 'upcoming' },
  ] as Milestone[],

  prizePool: '₹50,000',
  perk: {
    title: 'TATA STRIVE Internship',
    text: 'Winners get an opportunity for an internship with TATA STRIVE.',
    terms: 'T&C applied.',
  },

  sponsors: [
    { tier: 'Powered by', sponsors: [{ name: 'TATA STRIVE', logo: 'assets/tata-strive.jpg', url: 'https://www.tatastrive.com' }] },
  ] as SponsorTier[],

  faqs: [
    { question: 'Who can participate?', answer: 'CODE ODYSSEY 5.0 is strictly open to KJSIT students in TY (Third Year) and LY (Last Year).' },
    { question: 'What is the team size?', answer: 'Every team must have exactly 4 members: no less, no more.' },
    { question: 'Is there a diversity requirement?', answer: 'Yes. Each team must include at least one female participant.' },
    { question: 'What do I need to register?', answer: 'Valid KJSIT ID proofs, Somaiya email addresses and resumes for every team member. Make sure everything you upload is accurate.' },
    { question: 'When does registration close?', answer: 'Saturday night at 12:00 AM (midnight).' },
    { question: 'How will I know if my team is shortlisted?', answer: 'Shortlisted teams will be displayed on Sunday night on this website and on Instagram (@csi_kjsit).' },
    { question: 'What happens after shortlisting?', answer: 'Shortlisted teams must report to college on Monday in formal attire for the event briefing.' },
    { question: 'When are the problem statements released?', answer: 'They have not been released yet. They will appear in the Problem Statements section of this site.' },
    { question: 'What can the winners win?', answer: 'A share of the ₹50,000 prize pool and an opportunity for a TATA STRIVE internship (T&C applied).' },
  ] as Faq[],
};

export const MAP_SIZE = { width: 1600, height: 900 };

export const navLinks = [
  { label: 'About', href: '#about' },
  { label: 'Rules', href: '#rules' },
  { label: 'Timeline', href: '#timeline' },
  { label: 'Problems', href: '#problems' },
  { label: 'Prizes', href: '#prizes' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contact', href: '#contact' },
];
