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
      statusLabel: '',
      badge: 'from ISOCODELABS',
      outboundURL: 'https://cvbuddy.isocodelabs.com',
      image: '/assets/labs/labs-cvbuddy.webp',
      order: 1,
    },
    {
      name: 'ClearQuote',
      slug: 'clearquote',
      blurb: 'Smart RFQ handling for manufacturers drowning in messy quote requests.',
      status: 'funded',
      statusLabel: '',
      badge: 'from ISOCODELABS',
      outboundURL: 'https://clearquote.isocodelabs.com',
      image: '/assets/labs/labs-clearquote.webp',
      order: 2,
    },
    {
      name: 'LifeTreeOS',
      slug: 'lifetreeos',
      blurb:
        'A second brain for businesses — an AI that helps run the company and spots what’s breaking before you do.',
      status: 'deeptech',
      statusLabel: '',
      badge: 'from ISOCODELABS',
      outboundURL: 'https://lifetreeos.isocodelabs.com',
      image: '/assets/labs/labs-lifetreeos.webp',
      order: 3,
    },
    {
      name: 'Meddesk',
      slug: 'meddesk',
      blurb: 'A customisable ERP built for how clinics actually run.',
      status: 'paying',
      statusLabel: '',
      badge: 'from ISOCODELABS',
      outboundURL: 'https://meddesk.isocodelabs.com',
      image: '/assets/labs/labs-meddesk.webp',
      order: 4,
    },
  ],
  creatorMention: {
    body: 'We also build and run businesses for creators — so they earn from their audience without the operational headache.',
    href: 'https://creator.isocodelabs.com',
  },
}

export const ctaContent = {
  heading: 'Start a project',
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
  // homepage teaser → links to the full /about page
  moreLink: { label: 'More about the studio', href: '/about' },
}

/**
 * The standalone /about page — a fuller statement than the homepage teaser.
 * Same voice: proof over bragging, craft first. Section framings live here so
 * they're seed-fallback-safe like everything else.
 */
export const aboutPageContent = {
  eyebrow: 'About',
  heading: 'A craftsmanship studio that happens to build software.',
  intro: [
    'Most software is made to function. We make it to be felt — because the difference is the whole business. It’s what makes a first-time visitor trust you, and a returning one stay.',
    'We build public-facing websites and apps the way a hardware company builds a product: every surface considered, every moment of using it intentional. “It works” is the floor we start from, never where we stop.',
    'We’re a small, senior team. One bar holds everything we ship — craft — and it doesn’t move, even when moving it would be cheaper or faster for us.',
    'That bar decides who we work with, too. We take on the work we know we can make right, run our own products to the same standard, and we’re honest when something isn’t for us.',
  ],
  valuesEyebrow: 'What we hold to',
  valuesHeading: 'Five things that don’t bend.',
  foundersEyebrow: 'The people',
  foundersHeading: 'Two people, one bar.',
  foundersIntro:
    'We started Isocode to build the software we kept wishing existed — held to a standard we couldn’t find anywhere else.',
  contactHeading: 'Talk to our team',
  contactBody: 'Not a sales form — a real inbox a real person reads.',
}

/** The two co-founders (photos in public/assets/about; socials added via CMS). */
export const foundersContent = [
  {
    name: 'Aryan Malhotra',
    title: 'Co-founder',
    photo: '/assets/about/founder-1.jpg',
    eduLine: 'B.Tech, IIT Kharagpur',
    socials: [] as Array<{ platform: string; url: string }>,
    order: 1,
  },
  {
    name: 'Devansh Mishra',
    title: 'Co-founder',
    photo: '/assets/about/founder-2.jpg',
    eduLine: 'B.Tech + M.Tech, IIT Kharagpur',
    socials: [] as Array<{ platform: string; url: string }>,
    order: 2,
  },
]

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

const LEGAL_CONTACT = 'hello@isocodelabs.com'
const LEGAL_UPDATED = 'July 10, 2026'

/**
 * Real legal pages (privacy, terms), plain-white register, indexable.
 *
 * Grounded in the facts we hold today: Isocode Labs operates isocodelabs.com and
 * is not yet incorporated, so there is no registered company name/number or
 * address to cite; contact is a single inbox; data lives on Google Cloud; the
 * site sets no cookies and runs no analytics; and these policies also cover the
 * job-application data collected on the Careers page. Written to be publishable
 * and human-readable — still worth a lawyer's pass before you rely on them, but
 * no longer a placeholder.
 *
 * Each section body is an array of paragraphs; `bullets` renders as a list.
 * The CMS `pages` collection can override any page by slug (see the route).
 */
export type LegalSection = {
  heading: string
  body?: string[]
  bullets?: string[]
}

export type LegalPage = {
  title: string
  slug: 'privacy' | 'terms'
  description: string
  updated: string
  intro: string[]
  sections: LegalSection[]
}

export const legalPages: LegalPage[] = [
  {
    title: 'Privacy Policy',
    slug: 'privacy',
    description:
      'How Isocode Labs handles the information you share through isocodelabs.com — what we collect, why, where it is stored, and your rights.',
    updated: LEGAL_UPDATED,
    intro: [
      'Isocode Labs (“Isocode”, “we”, “us”) operates isocodelabs.com. This policy explains what personal information we collect through this website, why we collect it, how we look after it, and the choices you have. We keep it deliberately short because we deliberately collect very little.',
      'Isocode Labs is an early-stage studio and is not yet incorporated as a registered company. Until it is, the point of contact for anything in this policy is a real person reachable at the address below.',
    ],
    sections: [
      {
        heading: 'The short version',
        body: [
          'We only collect information you choose to give us — when you send an enquiry, complete the fit questionnaire, or apply for a role. We use it to reply to you and, for applications, to evaluate your candidacy. We do not sell it, we do not use it for advertising, and we do not track you around the web.',
        ],
      },
      {
        heading: 'Information you give us',
        body: ['Depending on how you use the site, this can include:'],
        bullets: [
          'Enquiries & the fit questionnaire: your answers, and the contact details you submit — typically your name, email address, company, and any note you write.',
          'Job applications (Careers page): your name, email address, your answers to the application questions, and the résumé or CV file you upload (PDF).',
          'Correspondence: anything you include when you email us directly.',
        ],
      },
      {
        heading: 'Information we do not collect',
        body: [
          'This website sets no cookies, runs no analytics, and embeds no advertising or third-party tracking pixels. We do not build a profile of your browsing, and we do not fingerprint your device. Our hosting provider may process standard technical information (such as your IP address in server logs) purely to deliver and secure the site; we do not use that information to identify or track you.',
        ],
      },
      {
        heading: 'How we use your information',
        body: ['We use what you send us only to:'],
        bullets: [
          'Understand and respond to your enquiry, and decide whether we are a good fit to work together.',
          'Review and respond to job applications, and contact you about the role you applied for.',
          'Keep a record of our correspondence with you.',
        ],
      },
      {
        heading: 'Legal basis',
        body: [
          'We process this information on the basis of your consent, given when you choose to submit a form, and our legitimate interest in responding to enquiries and running a recruitment process. You can withdraw your consent at any time by contacting us.',
        ],
      },
      {
        heading: 'Where it is stored and who can see it',
        body: [
          'Submissions are stored on Google Cloud Platform infrastructure, which may process and store data on servers located outside your country. Access is limited to the members of Isocode who need it to respond to you or assess your application.',
          'We do not sell, rent, or trade your personal information. We share it with service providers (such as Google Cloud) only to the extent needed to operate the site and store submissions, and we require them to protect it.',
        ],
      },
      {
        heading: 'How long we keep it',
        body: [
          'We keep enquiry and questionnaire submissions for as long as needed to follow up and for a reasonable period afterwards for our records. We keep job applications for the duration of the relevant hiring process and a limited period after, in case a future role fits. You can ask us to delete your information sooner at any time.',
        ],
      },
      {
        heading: 'Your rights',
        body: ['You can ask us to:'],
        bullets: [
          'Tell you what personal information of yours we hold.',
          'Correct information that is wrong or out of date.',
          'Delete your information, or stop using it.',
        ],
      },
      {
        heading: 'Children',
        body: [
          'This website and our services are intended for adults and are not directed at children under 18. We do not knowingly collect information from children.',
        ],
      },
      {
        heading: 'Changes to this policy',
        body: [
          'We may update this policy as Isocode grows — for example, once the business is incorporated, or if we introduce new tools. When we do, we will change the “Last updated” date above. Material changes will be reflected here before they take effect.',
        ],
      },
      {
        heading: 'Contact',
        body: [
          `For any privacy question or request — access, correction, or deletion — email ${LEGAL_CONTACT}. A person, not a bot, reads that inbox.`,
        ],
      },
    ],
  },
  {
    title: 'Terms & Conditions',
    slug: 'terms',
    description:
      'The terms that govern your use of isocodelabs.com — acceptable use, intellectual property, enquiries and applications, and governing law.',
    updated: LEGAL_UPDATED,
    intro: [
      'These terms govern your use of isocodelabs.com. By using this website you agree to them. If you do not agree, please do not use the site.',
      'The site is operated by Isocode Labs (“Isocode”, “we”, “us”), an early-stage studio that is not yet incorporated as a registered company.',
    ],
    sections: [
      {
        heading: 'Using this site',
        body: [
          'You may browse the site and use its forms for their intended purpose — to learn about Isocode, to enquire about working with us, and to apply for roles. You agree not to misuse the site: no attempting to break, overload, probe, or gain unauthorised access to it or its systems; no scraping or automated harvesting; and no submitting content that is unlawful, misleading, or infringes someone else’s rights.',
        ],
      },
      {
        heading: 'Intellectual property',
        body: [
          'The content of this website — its text, design, layout, graphics, and the Isocode name, logo, and product names (including CVBuddy, ClearQuote, LifeTreeOS, and Meddesk) — belongs to Isocode or is used with permission, and is protected by intellectual-property laws. You may not copy, reproduce, or reuse it without our written permission, except for your own personal, non-commercial reference.',
        ],
      },
      {
        heading: 'Enquiries and the fit questionnaire',
        body: [
          'Submitting an enquiry or completing the questionnaire is a request to start a conversation — it is not an offer, a contract, or a guarantee of any kind. We are under no obligation to respond, to take on any project, or to provide any service, and any engagement we do enter into will be governed by a separate written agreement.',
        ],
      },
      {
        heading: 'Job applications',
        body: [
          'Applying for a role does not create an offer of employment or any obligation on our part to interview, respond, or hire. You confirm that the information and documents you submit are accurate and yours to share. How we handle your application data is described in our Privacy Policy.',
        ],
      },
      {
        heading: 'Our own products and external links',
        body: [
          'This site links to products we build and run, and may link to third-party websites. Links to external sites are provided for convenience; we are not responsible for their content, practices, or availability. Use of any Isocode product is governed by that product’s own terms.',
        ],
      },
      {
        heading: 'No warranties',
        body: [
          'This website is provided “as is” and “as available”, without warranties of any kind, whether express or implied. We do not warrant that the site will be uninterrupted, error-free, or free of harmful components, or that any information on it is complete or current.',
        ],
      },
      {
        heading: 'Limitation of liability',
        body: [
          'To the fullest extent permitted by law, Isocode and the people behind it will not be liable for any indirect, incidental, or consequential loss, or any loss of data, profit, or goodwill, arising from your use of — or inability to use — this website. Nothing in these terms excludes any liability that cannot lawfully be excluded.',
        ],
      },
      {
        heading: 'Governing law',
        body: [
          'These terms are governed by the laws of India. Any dispute arising out of or relating to this website or these terms is subject to the exclusive jurisdiction of the courts of Delhi, India.',
        ],
      },
      {
        heading: 'Changes to these terms',
        body: [
          'We may update these terms from time to time — for example, once the business is incorporated. The current version always lives at this address, with the “Last updated” date shown above. Continuing to use the site after a change means you accept the updated terms.',
        ],
      },
      {
        heading: 'Contact',
        body: [`Questions about these terms? Email ${LEGAL_CONTACT}.`],
      },
    ],
  },
]

/* ────────────────────────────────────────────────────────────────────────────
   Careers (v3.4) — the dark "craftsmanship at work" world. Evergreen hiring
   surface for all of Isocode. Copy is seed-fallback-safe; CMS wins once set.
   ──────────────────────────────────────────────────────────────────────────── */

export const careersContent = {
  eyebrow: 'Careers',
  heading: 'For the few who’d rather build things properly.',
  pitch:
    'Isocode is a small, senior studio held to a single bar — craft. If “good enough” has never once sat right with you, this is where that instinct is the job, not a liability.',
  barEyebrow: 'The bar',
  barHeading: 'What we hire for.',
  barBody: [
    'We are not hiring seat-fillers. We hire people who are in the top fraction of their craft — engineers, designers, and operators who care how a thing is made, not only that it ships.',
    'The team stays small on purpose. That means real ownership from week one, work reviewed like it matters, and no hiding behind process. It also means the bar to get in is high, and we keep it there.',
  ],
  barPoints: [
    { title: 'Craft over credentials', body: 'Show us something you made. A repo, a design, a deal you closed — proof beats a résumé line.' },
    { title: 'Ownership, not tickets', body: 'You’ll own outcomes end to end, with the seniority around you to learn fast.' },
    { title: 'Remote, senior, quiet', body: 'Work from anywhere, on your own clock. We optimise for deep work, not presence theatre.' },
  ],
  rolesEyebrow: 'Open roles',
  rolesHeading: 'Where we’re hiring.',
  rolesNote: 'Remote. We hire the person first, then shape the role around them.',
  formEyebrow: 'Apply',
  formHeading: 'Tell us who you are.',
  formIntro: 'One form. Pick the role, tell us a little, and show us something you’ve made.',
  closeLine: 'Don’t see your role? The open application is always read by a person.',
  backLabel: '← isocodelabs.com',
}

export type JobOpeningSeed = {
  title: string
  roleKey: string
  type: 'intern' | 'fullTime' | 'contract'
  dept: string
  location: string
  stipend: string
  blurb: string
  active: boolean
  openApplication: boolean
  order: number
}

export const jobOpenings: JobOpeningSeed[] = [
  {
    title: 'Software Engineering Intern',
    roleKey: 'swe-intern',
    type: 'intern',
    dept: 'Engineering',
    location: 'Remote',
    stipend: '₹50k / month stipend',
    blurb:
      'Build production software to a craft bar most places only talk about — and have it reviewed like it matters.',
    active: true,
    openApplication: false,
    order: 1,
  },
  {
    title: 'Design Intern',
    roleKey: 'design-intern',
    type: 'intern',
    dept: 'Design',
    location: 'Remote',
    stipend: '₹50k / month stipend',
    blurb:
      'Design interfaces people feel, not just use. Every surface considered, every interaction intentional.',
    active: true,
    openApplication: false,
    order: 2,
  },
  {
    title: 'Sales Executive',
    roleKey: 'sales-exec',
    type: 'fullTime',
    dept: 'Sales',
    location: 'Remote',
    stipend: '₹20–50k / month',
    blurb:
      'Bring the right clients to a studio that only takes work it can make right. Consultative, never pushy.',
    active: true,
    openApplication: false,
    order: 3,
  },
  {
    title: 'Exceptional / open application',
    roleKey: 'open',
    type: 'fullTime',
    dept: 'Any',
    location: 'Remote',
    stipend: 'By fit',
    blurb:
      'Don’t see your role? If you’re exceptional at what you do, tell us. We hire the person, then find the shape.',
    active: true,
    openApplication: true,
    order: 99,
  },
]

export type ApplicationFieldSeed = {
  key: string
  label: string
  type: 'text' | 'email' | 'url' | 'textarea' | 'select' | 'file'
  placeholder?: string
  required: boolean
  options?: { label: string; value: string }[]
}

export const applicationForm = {
  intro: 'Everything here stays private — read only by the team, never sold or shared.',
  // name / email / role are always rendered first; these follow, in order.
  fields: [
    { key: 'college', label: 'College / University', type: 'text', placeholder: 'Where you study or studied', required: false },
    { key: 'year', label: 'Year / graduation', type: 'text', placeholder: 'e.g. 3rd year, or 2027', required: false },
    { key: 'portfolioUrl', label: 'GitHub or portfolio URL', type: 'url', placeholder: 'https://', required: false },
    { key: 'resume', label: 'Résumé (PDF)', type: 'file', required: true },
    { key: 'why', label: 'Why Isocode?', type: 'textarea', placeholder: 'A few honest lines — what draws you here, and what you’ve made.', required: false },
  ] as ApplicationFieldSeed[],
}
