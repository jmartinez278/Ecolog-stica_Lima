/** Lighthouse puede incluir atributos value en snippets DOM; no son publicables. */
export function redact(report, secrets = []) {
  let text = String(report).replace(/eyJ[A-Za-z0-9_-]{12,}[.][A-Za-z0-9_-]{12,}[.][A-Za-z0-9_-]{12,}/g, '[REDACTED-JWT]')
  for (const secret of secrets) if (secret) text = text.split(secret).join('[REDACTED-SECRET]')
  return text
}
