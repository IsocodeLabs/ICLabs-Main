import type { Metadata } from 'next'
import { CareersNav } from '@/components/careers/CareersNav'
import { CareersWorld } from '@/components/motion/CareersWorld'
import { Eyebrow } from '@/components/ui/Eyebrow'
import glass from '@/components/ui/Glass.module.css'
import { canonicalCareersUrl, careersHref } from '@/lib/careers/urls'
import styles from '@/components/careers/RoleDetail.module.css'

export const metadata: Metadata = {
  title: 'Applicant privacy notice — Careers',
  description: 'How Isocode handles the details and CV you send when you apply for a role.',
  alternates: { canonical: canonicalCareersUrl('/applicant-privacy') },
}

const CONTACT = 'hello@isocodelabs.com'
const MAIN_SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://isocodelabs.com'

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: 'What we collect',
    body: [
      'What you enter in the application form: your name, email, WhatsApp number, college, graduation year, earliest start date, the links you share (LinkedIn, GitHub, portfolio or project), your written answers, and the CV you upload (PDF).',
    ],
  },
  {
    title: 'Why',
    body: [
      'Only to assess your application for the role you chose and to contact you about it. We don’t use it for marketing, we don’t sell it, and we don’t share it with other employers.',
    ],
  },
  {
    title: 'Who sees it',
    body: [
      'The founders of Isocode, and no one else. Your CV is kept in a private storage bucket in Mumbai, India, and is only opened through short-lived links from our admin. Google Cloud (hosting) and Cloudflare (the human check on the form) process data on our behalf to run the site.',
    ],
  },
  {
    title: 'How long we keep it',
    body: [
      'For 12 months after the hiring cycle you applied in closes, in case a later role fits. After that the founders review and delete it.',
    ],
  },
  {
    title: 'Deleting your data',
    body: [
      `Email ${CONTACT} from the address you applied with and ask us to delete your application. We remove your details and your CV and confirm by email. You can also ask to see or correct what we hold.`,
    ],
  },
]

export default function ApplicantPrivacyPage() {
  return (
    <div className={`theme-ink ${styles.page}`}>
      <CareersWorld />
      <CareersNav />
      <main id="top">
        <header className={styles.header}>
          <div className={styles.inner}>
            <Eyebrow>Careers · Privacy</Eyebrow>
            <h1 className={styles.title}>Applicant privacy notice</h1>
            <p className={styles.factStrip} style={{ fontWeight: 400 }}>
              The short version of how we handle your application. The full{' '}
              <a href={`${MAIN_SITE_URL}/privacy`} style={{ textDecoration: 'underline' }}>
                privacy policy
              </a>{' '}
              covers the rest of isocodelabs.com.
            </p>
          </div>
        </header>
        <section className={styles.section}>
          <div className={styles.inner}>
            <div className={`${glass.glass} ${glass.dark} ${styles.body}`}>
              {SECTIONS.map((s) => (
                <section key={s.title} className={styles.block}>
                  <h2 className={styles.blockTitle}>{s.title}</h2>
                  <div className={styles.blockContent}>
                    {s.body.map((p) => (
                      <p key={p} className={styles.para}>
                        {p}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </section>
        <div className={styles.inner}>
          <a href={careersHref('/')} className={styles.back}>
            ← Careers
          </a>
        </div>
      </main>
    </div>
  )
}
