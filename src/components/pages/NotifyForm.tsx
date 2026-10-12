'use client'

import { FieldCapture } from '@/components/capture/FieldCapture'
import { submitLead } from '@/app/actions'
import { comingSoonCopy } from '@/lib/seed-data'

/**
 * "Tell me when it opens" — two quiet questions through the site's one-at-a-
 * time capture. Lands in the same lead inbox as the contact form, tagged with
 * the product in the note so it's easy to filter.
 */
export function NotifyForm({ productName }: { productName: string }) {
  return (
    <FieldCapture
      fields={[
        { name: 'name', label: 'What should we call you?', placeholder: 'Your name' },
        { name: 'email', label: 'Where should we write?', placeholder: 'you@company.com', type: 'email' },
      ]}
      submitLabel="Notify me"
      doneHeading={comingSoonCopy.doneHeading}
      doneNote={comingSoonCopy.doneNote}
      onSubmit={async (values) =>
        submitLead({
          kind: 'contact',
          contact: {
            name: values.name,
            email: values.email,
            note: `Notify me when ${productName} launches.`,
          },
          website: values.website,
        })
      }
    />
  )
}
