'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { FieldCapture } from '@/components/capture/FieldCapture'
import { QuoteRotator } from '@/components/sections/QuoteRotator'
import { submitLead, type QuizAnswer } from '@/app/actions'
import type { QuizContent } from '@/lib/content'
import styles from './QuizFlow.module.css'

type QuizFlowProps = {
  quiz: QuizContent
  quotes: string[]
  contactEmail: string
}

type Phase = 'entry' | 'questions' | 'capture'

/**
 * The short quiz — one question at a time, image options where taste is the
 * signal, quick taps for facts. Progress + helper + rotating values-quote.
 * The direct-contact hatch stays prominent on entry (non-negotiable).
 */
export function QuizFlow({ quiz, quotes, contactEmail }: QuizFlowProps) {
  const [phase, setPhase] = useState<Phase>('entry')
  const [qIndex, setQIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [submitted, setSubmitted] = useState(false)

  const questions = quiz.questions
  const total = questions.length
  const progress =
    phase === 'entry' ? 0 : phase === 'capture' ? 1 : qIndex / total

  const answer = (optionLabel: string, optionValue: string) => {
    const q = questions[qIndex]
    const next: QuizAnswer = {
      prompt: q.prompt,
      optionLabel,
      optionValue,
      signalKey: q.signalKey,
    }
    const updated = [...answers.slice(0, qIndex), next]
    setAnswers(updated)
    if (qIndex + 1 < total) setQIndex(qIndex + 1)
    else setPhase('capture')
  }

  const goBack = () => {
    if (phase === 'capture') {
      setPhase('questions')
      setQIndex(total - 1)
    } else if (qIndex > 0) {
      setQIndex(qIndex - 1)
    } else {
      setPhase('entry')
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <a href="/" className={styles.wordmark}>
          ISOCODE<span>LABS</span>
        </a>
        <div className={styles.progressTrack} role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
          <div className={styles.progressFill} style={{ width: `${progress * 100}%` }} />
        </div>
        <span className={`mono-label ${styles.stepCount}`}>
          {phase === 'questions' ? `${qIndex + 1} / ${total}` : phase === 'capture' ? 'done' : ''}
        </span>
      </div>

      {phase === 'entry' && (
        <div className={styles.stage}>
          <h1 className={styles.entryHeading}>{quiz.entryHeading}</h1>
          <p className={styles.entryCopy}>{quiz.entryCopy}</p>
          <div className={styles.entryActions}>
            <Button size="lg" onClick={() => setPhase('questions')}>
              Start the quiz
            </Button>
            <a href={`mailto:${contactEmail}`} className={styles.hatch}>
              In a hurry? Talk to us directly — {contactEmail}
            </a>
          </div>
        </div>
      )}

      {phase === 'questions' && (
        <div className={styles.stage} key={qIndex}>
          <h1 className={styles.prompt}>{questions[qIndex].prompt}</h1>
          {questions[qIndex].helperText && (
            <p className={styles.helper}>{questions[qIndex].helperText}</p>
          )}

          {questions[qIndex].type === 'image' ? (
            <div className={styles.tiles}>
              {questions[qIndex].options.map((o) => (
                <button key={o.value} className={styles.tile} onClick={() => answer(o.label, o.value)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={(o as { image?: string }).image} alt="" className={styles.tileImage} />
                  <span className={styles.tileLabel}>{o.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className={styles.taps}>
              {questions[qIndex].options.map((o) => (
                <button key={o.value} className={styles.tap} onClick={() => answer(o.label, o.value)}>
                  {o.label}
                </button>
              ))}
            </div>
          )}

          <div className={styles.backRow}>
            <button className={styles.backLink} onClick={goBack}>
              ← back
            </button>
          </div>
        </div>
      )}

      {phase === 'capture' && (
        <div className={styles.stage}>
          <h1 className={styles.entryHeading}>{quiz.closeHeading}</h1>
          <p className={styles.entryCopy}>{quiz.closeCopy}</p>
          <div className={styles.captureWrap}>
            <FieldCapture
              fields={[
                { name: 'name', label: 'Your name', placeholder: 'So we know who to write to' },
                { name: 'email', label: 'Your email', placeholder: 'you@company.com', type: 'email' },
                { name: 'company', label: 'Your company', placeholder: 'Where you build' },
                { name: 'note', label: 'Anything else?', placeholder: 'Entirely optional', optional: true },
              ]}
              submitLabel="Send it"
              doneHeading="That’s everything — thank you."
              onSubmit={async (values) => {
                const result = await submitLead({
                  kind: 'shortQuiz',
                  answers,
                  contact: {
                    name: values.name,
                    email: values.email,
                    company: values.company,
                    note: values.note,
                  },
                  website: values.website,
                })
                if (result.ok) setSubmitted(true)
                return result
              }}
            />
          </div>
          {!submitted && (
            <div className={styles.backRow}>
              <button className={styles.backLink} onClick={goBack}>
                ← back to the last question
              </button>
            </div>
          )}
        </div>
      )}

      <QuoteRotator quotes={quotes} className={styles.quote} />
    </div>
  )
}
