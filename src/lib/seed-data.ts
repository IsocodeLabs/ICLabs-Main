/**
 * Canonical site content — transcribed 1:1 from the copy deck (locked/FINAL
 * items only). This is both the CMS seed source and the render fallback when
 * the CMS is empty/unreachable. Never invent copy here.
 */

export const heroContent = {
  beliefLine:
    'We craft software with perfection, because the people who use it every day deserve the best.',
  subline: 'A studio that builds the web experiences people actually remember buying from.',
  scrollBeats: [
    'You live inside software all day.',
    'So does every customer who buys from you.',
    'Most of it is forgettable. That’s the whole problem.',
    'We build the other kind.',
  ],
}

export const problemContent = {
  narrative: [
    'You built the site years ago — back when the job was just to exist online.',
    'It sells. But a first-time visitor forms their impression of your brand in a blink — and that snap judgment is about design, not what you’re actually selling.',
    'So every customer you send there is quietly deciding how much to trust you, through something that looks like everyone else’s. And a bad first impression is hard to undo.',
    'Your product earned better. Your customers should feel the difference the moment they arrive.',
  ],
}

export const statsContent = [
  {
    value: '50 ms',
    label: 'how long it takes a visitor to form a first impression of your brand.',
    source: 'Google',
    sourceNote: 'Google / Lindgaard et al. 2006',
  },
  {
    value: '94%',
    label: 'of first impressions are design-related.',
    source: 'Forbes',
    sourceNote: 'Forbes / Northumbria University',
  },
  {
    value: '75%',
    label: 'of people judge a company’s credibility on its website design.',
    source: 'Stanford',
    sourceNote: 'Stanford Web Credibility Research (Fogg)',
  },
  {
    value: '88%',
    label: 'of consumers won’t return after a bad experience.',
    source: 'Google',
    sourceNote: 'Think with Google',
  },
]

export const whatWeBuildContent = {
  heading: 'What we build',
  body: [
    'We build public-facing websites and apps the way a hardware company builds a product — where every moment of buying from you feels considered, intentional, yours.',
    'Not a template with your logo dropped in. A storefront — or an app — that makes a first-time visitor trust you, and a returning one feel understood.',
    'The kind of experience that makes ordinary software look like what it is.',
  ],
}

export const labsContent = {
  beliefBeat: 'We don’t just build for others. We build and run our own.',
  heading: 'Labs & Innovation',
  body: 'Our own products are the proof — built, launched, and run by the same team that would build yours.',
  products: [
    {
      name: 'CVBuddy',
      slug: 'cvbuddy',
      blurb: 'The CV tool that ends the formatting nightmare of placement season.',
      status: 'live',
      statusLabel: 'Live',
      badge: 'from ISOCODELABS',
      outboundURL: 'https://cvbuddy.isocodelabs.com',
      image: '/labs/cvbuddy.webp',
      order: 1,
    },
    {
      name: 'ClearQuote',
      slug: 'clearquote',
      blurb: 'Smart RFQ handling for manufacturers drowning in messy quote requests.',
      status: 'funded',
      statusLabel: 'Live · funded',
      badge: 'from ISOCODELABS',
      outboundURL: 'https://clearquote.isocodelabs.com',
      image: '/labs/clearquote.webp',
      order: 2,
    },
    {
      name: 'LifeTreeOS',
      slug: 'lifetreeos',
      blurb:
        'A second brain for businesses — an AI that helps run the company and spots what’s breaking before you do.',
      status: 'deeptech',
      statusLabel: 'Deep-tech · live',
      badge: 'from ISOCODELABS',
      outboundURL: 'https://lifetreeos.isocodelabs.com',
      image: '/labs/lifetreeos.webp',
      order: 3,
    },
    {
      name: 'Meddesk',
      slug: 'meddesk',
      blurb: 'A customisable ERP built for how clinics actually run.',
      status: 'paying',
      statusLabel: 'Live · paying clients',
      badge: 'from ISOCODELABS',
      outboundURL: 'https://meddesk.isocodelabs.com',
      image: '/labs/meddesk.webp',
      order: 4,
    },
  ],
  creatorMention: {
    body: 'We also build and run businesses for creators — so they earn from their audience without the operational headache.',
    href: 'https://creator.isocodelabs.com',
  },
}

export const ctaContent = {
  heading: 'Work with us',
  body: 'Before we talk price, we’d like to understand your business. We reach out only if we genuinely believe we can build something worth your investment.',
  quizLabel: 'Start the quiz',
  hatchLabel: 'In a hurry? Talk to us directly',
}

export const aboutContent = {
  heading: 'About',
  body: [
    'Isocode Labs is a craftsmanship studio that happens to build software.',
    'We believe software you live inside all day deserves to be built like something you’d hold in your hand. “It works” is where we start, not where we stop.',
    'We’re a small senior team, held to a single bar — craft — and to a top ~0.5% standard in who we let build. We take on the work we know we can make right, and we’re honest when something isn’t for us.',
  ],
  teamLine: 'A small senior team, held to a top-0.5% craft bar.',
  contactHeading: 'Talk to our team',
}

export const valuesContent = [
  {
    title: 'Craftsmanship',
    description: 'Software is art and precision engineering; neither alone is enough.',
    order: 1,
  },
  {
    title: '“It works” is the floor, not the goal',
    description: 'Considered beats functional.',
    order: 2,
  },
  {
    title: 'Care for the human',
    description: 'We build for the person on the other side of the screen, not a “user.”',
    order: 3,
  },
  {
    title: 'We won’t ship generic',
    description: 'Quality is never the variable that moves, even at a cost to us.',
    order: 4,
  },
  {
    title: 'Selectivity',
    description: 'We take the work we can make right, and say so.',
    order: 5,
  },
]

export const valueQuotes = [
  'Software, made properly.',
  '“It works” is where we start, not where we stop.',
  'Built for the person on the other side of the screen.',
  'Care is a design decision.',
  'Considered beats functional.',
  'The details are the product.',
  'We’d rather make it right than make it fast.',
  'Good software feels like it was made for you — because it was.',
  'Craft isn’t a luxury here. It’s the point.',
  'You live inside software all day. It should deserve you.',
]

export const footerContent = {
  beliefLine: 'Software, made properly.',
  navLinks: [
    { label: 'Home', href: '#top' },
    { label: 'What We Build', href: '#what-we-build' },
    { label: 'Labs', href: 'https://labs.isocodelabs.com' },
    { label: 'Creators', href: 'https://creator.isocodelabs.com' },
    { label: 'Contact', href: '#contact' },
  ],
  legalLinks: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
  ],
  copyright: '© Isocode Labs',
}

export const contactChannels = {
  email: 'hello@isocodelabs.com',
  phone: '',
}

export const siteSEO = {
  metaTitle: 'ISOCODELABS — Software, made properly.',
  metaDescription:
    'A craftsmanship studio that happens to build software. We build public-facing websites and apps the way a hardware company builds a product.',
}

/** SHORT QUIZ — FINAL (5 questions). Q3/Q4 are image questions (tiles pending generation). */
export const shortQuiz = {
  name: 'Short quiz',
  type: 'short' as const,
  entryHeading: 'Before we talk price, we’d like to understand your business.',
  entryCopy:
    'We reach out only if we genuinely believe we can build something worth your investment.',
  closeHeading: 'Thanks — we’ve got a feel for you.',
  closeCopy: 'If we believe we can build something worth it, you’ll hear from us.',
  questions: [
    {
      order: 1,
      type: 'tap' as const,
      prompt: 'How big is your business today?',
      helperText: 'Rough is fine — this just helps us understand where you are.',
      signalKey: 'companySize',
      options: [
        { label: 'Just starting', value: 'starting' },
        { label: 'Growing', value: 'growing' },
        { label: 'Established', value: 'established' },
        { label: 'Large', value: 'large' },
      ],
    },
    {
      order: 2,
      type: 'tap' as const,
      prompt: 'What do you sell through your site?',
      helperText: 'The thing your customers come for.',
      signalKey: 'context',
      options: [
        { label: 'Products', value: 'products' },
        { label: 'Services', value: 'services' },
        { label: 'Both', value: 'both' },
        { label: 'Something else', value: 'other' },
      ],
    },
    {
      order: 3,
      type: 'image' as const,
      prompt: 'How should your brand feel?',
      helperText: 'Pick the one that feels most like you.',
      signalKey: 'taste',
      options: [
        { label: 'Bold & striking', value: 'bold', image: '/quiz/style-bold.webp' },
        { label: 'Warm & human', value: 'warm', image: '/quiz/style-warm.webp' },
        { label: 'Minimal & precise', value: 'minimal', image: '/quiz/style-minimal.webp' },
        { label: 'Editorial & rich', value: 'editorial', image: '/quiz/style-editorial.webp' },
      ],
    },
    {
      order: 4,
      type: 'image' as const,
      prompt: 'What should a first-time visitor feel?',
      helperText: 'The first three seconds, in one word.',
      signalKey: 'feeling',
      options: [
        { label: 'Trust', value: 'trust', image: '/quiz/feel-trust.webp' },
        { label: 'Desire', value: 'desire', image: '/quiz/feel-desire.webp' },
        { label: 'Calm confidence', value: 'calm', image: '/quiz/feel-calm.webp' },
        { label: 'Delight', value: 'delight', image: '/quiz/feel-delight.webp' },
      ],
    },
    {
      order: 5,
      type: 'tap' as const,
      prompt: 'Where do you want this brand in 3 years?',
      helperText: 'Aspiration, not projection.',
      signalKey: 'aspiration',
      options: [
        { label: 'The obvious choice in our space', value: 'obvious-choice' },
        { label: 'A category we redefine', value: 'redefine' },
        { label: 'Premium & respected', value: 'premium' },
        { label: 'Loved by our customers', value: 'loved' },
      ],
    },
  ],
}

export const legalStubs = [
  {
    title: 'Privacy Policy',
    slug: 'privacy',
    sections: [
      {
        heading: 'What we collect',
        body: 'Placeholder — describe the data collected: quiz answers, contact details (name, email, company), and basic analytics/cookies if enabled.',
      },
      {
        heading: 'How it’s used',
        body: 'Placeholder — qualification of enquiries and human follow-up. Quiz answers inform whether and how we reach out.',
      },
      {
        heading: 'Storage & retention',
        body: 'Placeholder — where submissions are stored, for how long, and how deletion can be requested.',
      },
      {
        heading: 'Third parties',
        body: 'Placeholder — hosting and analytics providers, if any.',
      },
      {
        heading: 'Your rights & contact',
        body: 'Placeholder — access/correction/deletion requests via hello@isocodelabs.com.',
      },
    ],
    note: 'Boilerplate scaffolding only — have a professional review before publishing.',
  },
  {
    title: 'Terms of Service',
    slug: 'terms',
    sections: [
      { heading: 'Use of this site', body: 'Placeholder — acceptable use of isocodelabs.com.' },
      { heading: 'Intellectual property', body: 'Placeholder — ownership of site content and marks.' },
      { heading: 'Quiz & enquiry terms', body: 'Placeholder — submissions are enquiries, not contracts; no obligation to respond.' },
      { heading: 'Limitation of liability', body: 'Placeholder — standard limitation language.' },
      { heading: 'Governing law', body: 'Placeholder — jurisdiction to be confirmed.' },
      { heading: 'Contact', body: 'Placeholder — hello@isocodelabs.com.' },
    ],
    note: 'Boilerplate scaffolding only — have a professional review before publishing.',
  },
]
