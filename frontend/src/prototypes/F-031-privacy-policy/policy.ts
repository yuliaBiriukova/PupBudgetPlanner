// The text of the privacy policy for the F-031 prototypes, from docs/changes/features/F-031-privacy-policy/
// privacy-policy.md. The two places the owner fills in are shown as an example address and a bracket.

export const CONTACT = 'pup.budget@example.com';
export const UPDATED = '14 November 2026';

/** A line of a list: an optional bold lead, then the text. */
export interface Item {
  lead?: string;
  text: string;
}

export type Block =
  { kind: 'p'; text: string } | { kind: 'h3'; text: string } | { kind: 'list'; items: Item[] };

export interface PolicySection {
  id: string;
  title: string;
  /** The section as a question someone would ask (variant 3). */
  question: string;
  /** Its answer in one line (variant 3). */
  answer: string;
  blocks: Block[];
}

export const INTRO =
  'Pup Budget is a small budgeting app for a family and the people they invite. It is run by one person, not a company. This page says what the app keeps about you, why, who can see it and how to have it deleted.';

export const IN_SHORT =
  'Pup Budget keeps only what you put into it and what it needs to sign you in. It has no ads, no analytics and no trackers, and it never sells or shares your data.';

export const PROMISES = ['No ads', 'No trackers', 'Never sold or shared'];

export const SECTIONS: PolicySection[] = [
  {
    id: 'what',
    title: 'What Pup Budget keeps',
    question: 'What does Pup Budget keep?',
    answer: 'Your account, the money you enter and one sign-in cookie.',
    blocks: [
      { kind: 'h3', text: 'Your account' },
      {
        kind: 'list',
        items: [
          { text: 'your email address and the name you give;' },
          {
            text: 'your password, stored only as a secure hash: nobody, including the person running the app, can read it;',
          },
          {
            text: 'if you sign in with Google: your Google account’s ID, email address and name. Pup Budget asks Google for nothing else: not your contacts, files, mail or calendar;',
          },
          { text: 'when you joined, and the note of the invite link you joined with;' },
          { text: 'your settings: report currency and what your family may see of your money.' },
        ],
      },
      { kind: 'h3', text: 'Your money data' },
      {
        kind: 'list',
        items: [
          { text: 'your accounts (name, currency, bank, opening balance, card colour);' },
          { text: 'your transactions (amount, date, account, category and the note you write);' },
          { text: 'your categories and groups;' },
          { text: 'your family, if you are in one, and the invite links you create.' },
        ],
      },
      { kind: 'h3', text: 'In your browser' },
      {
        kind: 'list',
        items: [
          {
            text: 'one sign-in cookie that keeps you signed in. It is needed for the app to work, is not used for anything else and expires 30 days after you last used the app;',
          },
          {
            text: 'a few display choices (such as the colour scheme, which groups are open, whether the sidebar is folded) kept in your browser’s storage. They never leave your device;',
          },
          {
            text: 'if you install the app, your device keeps the app’s own files so it opens quickly. Your money data is not stored there.',
          },
        ],
      },
    ],
  },
  {
    id: 'why',
    title: 'Why',
    question: 'What is it used for?',
    answer: 'Only to run the app for you and your family.',
    blocks: [
      {
        kind: 'p',
        text: 'Only to run the app for you: to sign you in, keep your accounts and transactions, show your totals and reports, and share with your family what you have chosen to share. Exchange rates come from the National Bank of Ukraine; Pup Budget sends it nothing about you.',
      },
    ],
  },
  {
    id: 'who',
    title: 'Who can see your data',
    question: 'Who can see my money?',
    answer: 'You, and your family as far as you allow.',
    blocks: [
      {
        kind: 'list',
        items: [
          { lead: 'You.', text: '' },
          {
            lead: 'Your family members,',
            text: 'if you join a family: only what your family privacy settings allow. You can change them at any time in Family.',
          },
          {
            lead: 'The person who runs Pup Budget',
            text: 'sees, on the admin page, the names and email addresses of the people using the app, when they joined and whether their access is on, so they can manage invitations and access. As the person who looks after the app and its database, they could technically reach other data too; they do not look at your money data unless you ask for help with it.',
          },
          {
            lead: 'Nobody else.',
            text: 'Your data is not sold, rented or shared with anyone, and not used for advertising.',
          },
        ],
      },
    ],
  },
  {
    id: 'where',
    title: 'Where it is kept',
    question: 'Where is it kept?',
    answer: 'The app with Render in Frankfurt, the database with Neon; always over HTTPS.',
    blocks: [
      { kind: 'p', text: 'Pup Budget uses these services to run:' },
      {
        kind: 'list',
        items: [
          {
            lead: 'Render',
            text: 'hosts the app, in Frankfurt, Germany. Its server logs may record IP addresses and the times of requests for a short time, to keep the service running and safe.',
          },
          { lead: 'Neon', text: 'keeps the database.' },
          { lead: 'Google,', text: 'only if you choose to sign in with Google.' },
        ],
      },
      { kind: 'p', text: 'All connections to Pup Budget are encrypted (HTTPS).' },
    ],
  },
  {
    id: 'protected',
    title: 'How it is protected',
    question: 'How is it protected?',
    answer: 'Invitations only, hashed passwords, locked after 5 wrong tries.',
    blocks: [
      {
        kind: 'list',
        items: [
          { text: 'Sign-up is by invitation only.' },
          { text: 'Passwords are stored only as secure hashes.' },
          {
            text: 'After 5 wrong passwords in a row the account is locked for 15 minutes, and repeated sign-in attempts from one place are slowed down. Your IP address is used for this only while it happens and is not stored.',
          },
          { text: 'Pages of the app cannot be shown inside other websites.' },
        ],
      },
    ],
  },
  {
    id: 'how-long',
    title: 'How long it is kept',
    question: 'How long is it kept?',
    answer: 'While your account exists; deleting it deletes everything.',
    blocks: [
      {
        kind: 'p',
        text: 'Your data is kept while your account exists. When your account is deleted, everything in it (accounts, transactions, categories, settings and sign-in details) is deleted with it, and it leaves the database’s short-term restore history within [restore window]. Invite links that can no longer be used are deleted after 30 days.',
      },
    ],
  },
  {
    id: 'choices',
    title: 'Your choices',
    question: 'Can I have it deleted?',
    answer: `Yes: write to ${CONTACT}, done within 30 days.`,
    blocks: [
      {
        kind: 'list',
        items: [
          {
            lead: 'See and change',
            text: 'your name, settings, accounts and transactions in the app at any time.',
          },
          { lead: 'Choose what your family sees', text: 'in Family.' },
          {
            lead: 'Delete your account and all its data:',
            text: `write to ${CONTACT} from your account’s email address, and it is done within 30 days. Deleting your account yourself in Settings is coming.`,
          },
          {
            lead: 'Ask what is kept about you,',
            text: `or anything else about your data: ${CONTACT}.`,
          },
        ],
      },
    ],
  },
  {
    id: 'changes',
    title: 'Changes to this page',
    question: 'What if this page changes?',
    answer: 'The date changes, and the app tells you first if it matters.',
    blocks: [
      {
        kind: 'p',
        text: 'When this page changes, the date at the top changes. If a change affects what Pup Budget keeps or who can see it, the app tells you before it applies.',
      },
    ],
  },
];
