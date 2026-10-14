import { CareersWorld } from '@/components/motion/CareersWorld'
import { Eyebrow } from '@/components/ui/Eyebrow'
import glass from '@/components/ui/Glass.module.css'
import type { CareerRole, CareersContent } from '@/lib/careers/content'
import { careersHref } from '@/lib/careers/urls'
import { ApplyForm } from './ApplyForm'
import { careersConfig } from '@/lib/careers/config'
import { CareersNav } from './CareersNav'
import { HiringStepper } from './HiringStepper'
import styles from './RoleDetail.module.css'

const TYPE_LABEL: Record<string, string> = {
  intern: 'Internship',
  fullTime: 'Full-time',
  contract: 'Contract',
}

/**
 * A role's own page: header with key facts → About → What you'll do → What we
 * look for (+ stack) → Compensation → Hiring process → Apply (role locked) →
 * back link. Paused roles keep their content but the form is replaced by a
 * notice; closed roles show only the header and a pointer to open roles.
 */
export function RoleDetail({
  role,
  page,
  formIntro,
}: {
  role: CareerRole
  page: CareersContent['page']
  formIntro: string
}) {
  const closed = role.status === 'closed'
  const paused = role.status === 'paused'
  const facts = [
    ['Type', TYPE_LABEL[role.type] ?? role.type],
    ['Location', role.location],
    ['Duration', role.duration],
    ['Pay', role.payLine],
  ].filter(([, v]) => Boolean(v))

  return (
    <div className={`theme-ink ${styles.page}`}>
      <CareersWorld />
      <CareersNav />

      <main id="top">
        <header className={styles.header}>
          <div className={styles.inner}>
            <a href={careersHref('/#roles')} className={styles.crumb}>
              ← All roles
            </a>
            <Eyebrow>{role.dept ? `${role.dept} · Careers` : 'Careers'}</Eyebrow>
            <h1 className={styles.title}>{role.title}</h1>
            {role.blurb && <p className={styles.tagline}>{role.blurb}</p>}
            <dl className={styles.facts}>
              {facts.map(([k, v]) => (
                <div key={k} className={styles.fact}>
                  <dt className="mono-label">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            {!closed && !paused && (
              <a href="#apply" className={styles.headerCta}>
                Apply for this role →
              </a>
            )}
            {paused && <p className={`mono-label ${styles.statusBadge}`}>Applications paused</p>}
          </div>
        </header>

        {closed ? (
          <section className={styles.section}>
            <div className={styles.inner}>
              <div className={`${glass.glass} ${glass.dark} ${styles.notice}`}>
                <p className={styles.noticeHeading}>This role is closed.</p>
                <a href={careersHref('/#roles')} className={styles.noticeLink}>
                  See open roles →
                </a>
              </div>
            </div>
          </section>
        ) : (
          <>
            <section className={styles.section}>
              <div className={styles.inner}>
                <div className={`${glass.glass} ${glass.dark} ${styles.body}`}>
                  {role.about && (
                    <Block title="About the role">
                      <p className={styles.para}>{role.about}</p>
                    </Block>
                  )}
                  {role.responsibilities.length > 0 && (
                    <Block title="What you’ll do">
                      <ul className={styles.list}>
                        {role.responsibilities.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    </Block>
                  )}
                  {role.lookingFor.length > 0 && (
                    <Block title="What we look for">
                      <ul className={styles.list}>
                        {role.lookingFor.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                      {role.stack.length > 0 && (
                        <div className={styles.stack}>
                          <span className="mono-label">What you’ll work with</span>
                          <ul className={styles.chips}>
                            {role.stack.map((t) => (
                              <li key={t}>{t}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </Block>
                  )}
                  {role.compensation && (
                    <Block title="Compensation">
                      {role.compensation.split(/\n\s*\n/).map((p, i) => (
                        <p key={i} className={styles.para}>
                          {p}
                        </p>
                      ))}
                      {role.footnote && <p className={styles.footnote}>{role.footnote}</p>}
                    </Block>
                  )}
                  {role.hiringProcess.length > 0 && (
                    <Block title="Hiring process">
                      <HiringStepper steps={role.hiringProcess} />
                    </Block>
                  )}
                </div>
              </div>
            </section>

            {paused ? (
              <section id="apply" className={styles.section}>
                <div className={styles.inner}>
                  <div className={`${glass.glass} ${glass.dark} ${styles.notice}`}>
                    <p className={styles.noticeHeading}>Applications are paused. Check back soon.</p>
                    <a href={careersHref('/#open-application')} className={styles.noticeLink}>
                      Or send an open application →
                    </a>
                  </div>
                </div>
              </section>
            ) : (
              <ApplyForm page={page} roles={[role]} lockedRole={role} intro={formIntro} humanCheck={careersConfig.humanCheck} />
            )}
          </>
        )}

        <div className={styles.inner}>
          <a href={careersHref('/#roles')} className={styles.back}>
            ← Back to all roles
          </a>
        </div>
      </main>
    </div>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={styles.block}>
      <h2 className={styles.blockTitle}>{title}</h2>
      <div className={styles.blockContent}>{children}</div>
    </section>
  )
}
