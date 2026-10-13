import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { RoleDetail } from '@/components/careers/RoleDetail'
import {
  getCareerRole,
  getCareerRoles,
  getCareersContent,
  type CareerRole,
  type CareersContent,
} from '@/lib/careers/content'
import { canonicalCareersUrl } from '@/lib/careers/urls'

// Status changes revalidate on demand; 60 s is the cross-instance backstop.
export const revalidate = 60
export const dynamicParams = true

export async function generateStaticParams() {
  const roles = await getCareerRoles()
  return roles.filter((r) => r.roleKind !== 'open').map((r) => ({ slug: r.slug }))
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const role = await getCareerRole(slug)
  if (!role) return { title: 'Role not found', robots: { index: false } }
  const url = canonicalCareersUrl(`/roles/${role.slug}`)
  const title = role.seoTitle || `${role.title} | ISOCODELABS Careers`
  const description = role.seoDescription || role.blurb
  const ogTitle = role.ogTitle || title
  const ogDescription = role.ogDescription || description
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    robots: role.status === 'closed' ? { index: false } : undefined,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url,
      type: 'website',
      siteName: 'ISOCODELABS',
      images: ['/og.png'],
    },
    twitter: { card: 'summary_large_image', title: ogTitle, description: ogDescription },
  }
}

const COUNTRY: Record<string, string> = { IN: 'India' }

/** JobPosting description: The role + What you'll do + What you bring, as plain text. */
function plainDescription(role: CareerRole, page: CareersContent['page']) {
  const bullets = (items: string[]) => items.map((t) => `• ${t}`).join('\n')
  return [
    role.about,
    role.responsibilities.length && `${page.job.doHeading}:\n${bullets(role.responsibilities)}`,
    role.lookingFor.length && `${page.job.bringHeading}:\n${bullets(role.lookingFor)}`,
  ]
    .filter(Boolean)
    .join('\n\n')
}

function jobPostingJsonLd(role: CareerRole, page: CareersContent['page']) {
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: role.title,
    description: plainDescription(role, page),
    identifier: { '@type': 'PropertyValue', name: 'ISOCODELABS', value: role.slug },
    datePosted: role.datePosted?.slice(0, 10),
    employmentType: role.type === 'intern' ? 'INTERN' : role.type === 'contract' ? 'CONTRACTOR' : 'FULL_TIME',
    jobLocationType: 'TELECOMMUTE',
    applicantLocationRequirements: { '@type': 'Country', name: COUNTRY.IN },
    hiringOrganization: {
      '@type': 'Organization',
      name: 'ISOCODELABS',
      sameAs: 'https://isocodelabs.com',
      logo: 'https://isocodelabs.com/assets/brand/il-monogram-black.png',
    },
    directApply: true,
    url: canonicalCareersUrl(`/roles/${role.slug}`),
  }
  if (role.validThrough) ld.validThrough = role.validThrough
  // fixed stipends only (SWE, PM) — Business Growth's pay is variable, so none
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
  const { page } = await getCareersContent()

  return (
    <>
      {role.status !== 'closed' && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jobPostingJsonLd(role, page)).replace(/</g, '\\u003c'),
          }}
        />
      )}
      <RoleDetail role={role} page={page} />
    </>
  )
}
