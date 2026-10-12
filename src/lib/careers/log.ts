/**
 * Structured logs for Cloud Logging (JSON on stdout/stderr is parsed into
 * fields; `severity` drives log level). ERROR entries carrying a stack trace
 * are picked up by Cloud Error Reporting automatically.
 *
 * Never pass PII here — no names, emails, phones, IPs, URLs with query strings
 * or form values. Use ids (submissionId, applicationId) and error codes.
 */
type Fields = Record<string, string | number | boolean | null | undefined>

export function logInfo(event: string, fields: Fields = {}) {
  console.log(JSON.stringify({ severity: 'INFO', message: event, component: 'careers', ...fields }))
}

export function logWarn(event: string, fields: Fields = {}) {
  console.warn(JSON.stringify({ severity: 'WARNING', message: event, component: 'careers', ...fields }))
}

export function logError(event: string, err: unknown, fields: Fields = {}) {
  const e = err instanceof Error ? err : new Error(String(err))
  // Error Reporting wants the stack in `message` (or `stack_trace`).
  console.error(
    JSON.stringify({
      severity: 'ERROR',
      '@type': 'type.googleapis.com/google.devtools.clouderrorreporting.v1beta1.ReportedErrorEvent',
      message: `${event}: ${e.stack || e.message}`,
      component: 'careers',
      event,
      ...fields,
    }),
  )
}
