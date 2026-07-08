'use client'

import { FieldCapture } from '@/components/capture/FieldCapture'
import { submitLead } from '@/app/actions'

/** General enquiries — not the sales funnel (that's the quiz). */
export function AboutContact() {
  return (
    <FieldCapture
      fields={[
        { name: 'name', label: 'What should we call you?', placeholder: 'Your name' },
        { name: 'email', label: 'Where can we reach you?', placeholder: 'you@company.com', type: 'email' },
        { name: 'note', label: 'What’s on your mind?', placeholder: 'A sentence is plenty', optional: true },
      ]}
      submitLabel="Send"
      doneHeading="Thanks — we read every one of these."
      doneNote="A real person will get back to you."
      onSubmit={async (values) =>
        submitLead({
          kind: 'contact',
          contact: { name: values.name, email: values.email, note: values.note },
          website: values.website,
        })
      }
    />
  )
}
