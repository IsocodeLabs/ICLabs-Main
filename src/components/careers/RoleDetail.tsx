import type { ReactNode } from 'react'
import { CareersWorld } from '@/components/motion/CareersWorld'
import { Eyebrow } from '@/components/ui/Eyebrow'
import glass from '@/components/ui/Glass.module.css'
import type { CareerRole, CareersContent } from '@/lib/careers/content'
import { careersHref } from '@/lib/careers/urls'
import { ApplyForm } from './ApplyForm'
import { CareersNav } from './CareersNav'
import { HiringStepper } from './HiringStepper'
import { StickyApply } from './StickyApply'
import styles from './RoleDetail.module.css'

/**
 * A role's job page (PRD v3 FR2), in this order: header (eyebrow, title, key
 * facts, "Apply for this role ↓") → About ISOCODELABS → The role → What you'll
 * do → What you bring → Nice to have → Role details → How we hire → Our
 * standard → Apply (role locked) → "← All open roles". On phones a sticky Apply
 * button follows until the form is in view.
 *
 * Paused roles keep the full description but show the paused message in place
 * of the form; closed roles show only the header and a pointer to open roles.
 */
export function RoleDetail({ role, page }: { role: CareerRole; page: CareersContent['page'] }) {
  const { job, jobForm } = page
  const closed = role.status === 'closed'
  const open = role.status === 'open'
  const stipend = role.stipendShort || role.payLine
  const facts = [role.location, role.duration, stipend].filter(Boolean)
  const details: [string, string][] = (
    [
      ['Location', role.location],
      ['Duration', role.duration],
      ['Stipend', role.payLine],
      ['Start', role.startNote],
    ] as [string, string][]
  ).filter(([, v]) => Boolean(v))

  return (
    <div className={`theme-ink ${styles.page}`}>
      <CareersWorld />
      <CareersNav />

      <main id="top">
        {/* 1 · header */}
        <header className={styles.header}>
          <div className={styles.inner}>
            {role.eyebrow && <Eyebrow>{role.eyebrow}</Eyebrow>}
            <h1 className={styles.title}>{role.title}</h1>
            {facts.length > 0 && (
              <p className={styles.factStrip}>
                {facts.map((f, i) => (
                  <span key={f}>
                    {i > 0 && (
                      <span className={styles.factSep} aria-hidden>
                        ·
                      </span>
                    )}
                    <span className={styles.fact}>{f}</span>
                  </span>
                ))}
              </p>
            )}
            {!closed && <p className={styles.availability}>{page.availabilityNote}</p>}
            {open && (
              <a href="#apply" className={styles.headerCta}>
                {job.applyCta}
              </a>
            )}
            {role.status === 'paused' && <p className={`mono-label ${styles.statusBadge}`}>{page.pausedBadge}</p>}
          </div>
        </header>

        {closed ? (
          <section className={styles.section}>
            <div className={styles.inner}>
              <div className={`${glass.glass} ${glass.dark} ${styles.notice}`}>
                <p className={styles.noticeHeading}>{job.closed}</p>
                <a href={careersHref('/#roles')} className={styles.noticeLink}>
                  {job.closedLink}
                </a>
              </div>
            </div>
          </section>
        ) : (
          <>
            <section className={styles.section}>
              <div className={styles.inner}>
                <div className={`${glass.glass} ${glass.dark} ${styles.body}`}>
                  {/* 2 · about ISOCODELABS */}
                  <Block title={job.aboutHeading}>
                    <p className={styles.para}>{job.about}</p>
                  </Block>
                  {/* 3 · the role */}
                  {role.about && (
                    <Block title={job.roleHeading}>
                      <p className={styles.para}>{role.about}</p>
                    </Block>
                  )}
                  {/* 4 · what you'll do */}
                  {role.responsibilities.length > 0 && (
                    <Block title={job.doHeading}>
                      <List items={role.responsibilities} />
                    </Block>
                  )}
                  {/* 5 · what you bring */}
                  {role.lookingFor.length > 0 && (
                    <Block title={job.bringHeading}>
                      <List items={role.lookingFor} />
                    </Block>
                  )}
                  {/* 6 · nice to have */}
                  {role.niceToHave.length > 0 && (
                    <Block title={job.niceHeading}>
                      <List items={role.niceToHave} />
                    </Block>
                  )}
                  {/* 7 · role details */}
                  {details.length > 0 && (
                    <Block title={job.detailsHeading}>
                      <table className={styles.details}>
                        <tbody>
                          {details.map(([k, v]) => (
                            <tr key={k}>
                              <th scope="row">{k}</th>
                              <td>{v}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Block>
                  )}
                  {/* 8 · how we hire */}
                  {role.hiringProcess.length > 0 && (
                    <Block title={job.hireHeading}>
                      <HiringStepper steps={role.hiringProcess} />
                    </Block>
                  )}
                  {/* 9 · our standard */}
                  <Block title={job.standardHeading}>
                    <p className={styles.standard}>{job.standard}</p>
                  </Block>
                </div>
              </div>
            </section>

            {/* 10 · apply */}
            {open ? (
              <ApplyForm
                role={role}
                copy={{
                  heading: jobForm.heading,
                  sub: jobForm.sub,
                  privacy: jobForm.privacy,
                  submit: jobForm.submit,
                  success: jobForm.success,
                  duplicate: jobForm.duplicate,
                }}
              />
            ) : (
              <section id="apply" className={styles.section}>
                <div className={styles.inner}>
                  <div className={`${glass.glass} ${glass.dark} ${styles.notice}`}>
                    <p className={styles.noticeHeading}>{jobForm.paused}</p>
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {/* 11 · back */}
        <div className={styles.inner}>
          <a href={careersHref('/#roles')} className={styles.back}>
            {job.backLink}
          </a>
        </div>
      </main>

      {open && <StickyApply label={job.stickyApply} />}
    </div>
  )
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.block}>
      <h2 className={styles.blockTitle}>{title}</h2>
      <div className={styles.blockContent}>{children}</div>
    </section>
  )
}

function List({ items }: { items: string[] }) {
  return (
    <ul className={styles.list}>
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  )
}
