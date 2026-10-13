import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { RoleDetail } from '@/components/careers/RoleDetail'
import { getCareerRole, getCareerRoles, getCareersContent, type CareerRole } from '@/lib/careers/content'
import { canonicalCareersUrl } from '@/lib/careers/urls'
import { CAREERS_OG_IMAGE } from '@/lib/careers/og'

// Status changes revalidate on demand; 60 s is the cross-instance backstop.
export const revalidate = 60
export const dynamicParams = true

export async function generateStaticParams() {
  const roles = await getCareerRoles()
  return roles.filter((r) => r.roleKind !== 'open').map((r) => ({ slug: r.slug }))
}

type Props = { params: Promise<{ slug: string }> }

function describe(role: CareerRole) {
  const facts = [role.duration && `${role.duration}`, role.location].filter(Boolean).join(', ')
  return `${role.blurb} ${role.type === 'intern' ? 'Internship' : 'Role'}${facts ? ` · ${facts}` : ''}.`
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const role = await getCareerRole(slug)
  if (!role) return { title: 'Role not found', robots: { index: false } }
  const url = canonicalCareersUrl(`/roles/${role.slug}`)
  const description = describe(role)
  return {
    title: `${role.title} — Careers`,
    description,
    alternates: { canonical: url },
    robots: role.status === 'closed' ? { index: false } : undefined,
    openGraph: {
      title: `${role.title} — ISOCODELABS Careers`,
      description,
      url,
      type: 'website',
      siteName: 'ISOCODELABS',
      images: [CAREERS_OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${role.title} — ISOCODELABS`,
      description,
      images: [CAREERS_OG_IMAGE.url],
    },
  }
}

const COUNTRY: Record<string, string> = { IN: 'India' }

function jobPostingJsonLd(role: CareerRole) {
  const list = (items: string[]) => (items.length ? `<ul>${items.map((t) => `<li>${t}</li>`).join('')}</ul>` : '')
  const description = [
    role.about && `<p>${role.about}</p>`,
    role.responsibilities.length && `<p><strong>What you’ll do</strong></p>${list(role.responsibilities)}`,
    role.lookingFor.length && `<p><strong>What we look for</strong></p>${list(role.lookingFor)}`,
    role.stack.length && `<p><strong>What you’ll work with</strong></p>${list(role.stack)}`,
    role.compensation && `<p><strong>Compensation</strong></p><p>${role.compensation}</p>`,
  ]
    .filter(Boolean)
    .join('')

  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: role.title,
    description,
    identifier: { '@type': 'PropertyValue', name: 'Isocode Labs', value: role.slug },
    datePosted: role.datePosted?.slice(0, 10),
    employmentType: role.type === 'intern' ? 'INTERN' : role.type === 'contract' ? 'CONTRACTOR' : 'FULL_TIME',
    jobLocationType: 'TELECOMMUTE',
    applicantLocationRequirements: { '@type': 'Country', name: COUNTRY.IN },
    hiringOrganization: {
      '@type': 'Organization',
      name: 'Isocode Labs',
      sameAs: 'https://isocodelabs.com',
      logo: 'https://isocodelabs.com/assets/brand/il-monogram-black.png',
    },
    directApply: true,
    url: canonicalCareersUrl(`/roles/${role.slug}`),
  }
  if (role.validThrough) ld.validThrough = role.validThrough
  if (role.baseSalaryMonthlyINR) {
    ld.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: 'INR',
      value: { '@type': 'QuantitativeValue', value: role.baseSalaryMonthlyINR, unitText: 'MONTH' },
    }
  }
  return ld
}

export default async function RolePage({ params }: Props) {
  const { slug } = await params
  const role = await getCareerRole(slug)
  if (!role) notFound()
  const { page, formIntro } = await getCareersContent()

  return (
    <>
      {role.status !== 'closed' && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jobPostingJsonLd(role)).replace(/</g, '\\u003c'),
          }}
        />
      )}
      <RoleDetail role={role} page={page} formIntro={formIntro} />
    </>
  )
}
