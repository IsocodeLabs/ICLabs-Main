import type { Metadata } from 'next'
import { getShortQuiz, getSiteContent } from '@/lib/content'
import { QuizFlow } from '@/components/quiz/QuizFlow'

export const metadata: Metadata = {
  title: 'Work with us',
  description:
    'Before we talk price, we’d like to understand your business. Five questions — or talk to us directly.',
}

export const revalidate = 300

export default async function QuizPage() {
  const [quiz, { quotes, contact }] = await Promise.all([getShortQuiz(), getSiteContent()])
  return <QuizFlow quiz={quiz} quotes={quotes} contactEmail={contact.email} />
}
