export interface GuardrailResult {
  readonly allowed: boolean;
  readonly modifiedContent?: string;
  readonly violations: readonly { code: string; message: string }[];
}

const PII_PATTERN = /\b(?:\d{16}|[\w.-]+@[\w.-]+\.[A-Za-z]{2,}|\+?\d{10,15})\b/;
const HARMFUL_PATTERN = /\b(hate|kill|violence|weapon|bomb|self-harm|suicide)\b/i;

export function checkGuardrails(content: string): GuardrailResult {
  const violations: Array<{ code: string; message: string }> = [];
  let modifiedContent = content;

  if (PII_PATTERN.test(content)) {
    violations.push({ code: 'pii_detected', message: 'Potential PII detected' });
    modifiedContent = modifiedContent.replace(PII_PATTERN, '[REDACTED]');
  }

  if (HARMFUL_PATTERN.test(content)) {
    violations.push({ code: 'harmful_content', message: 'Potential harmful content detected' });
  }

  return { allowed: violations.length === 0, modifiedContent: modifiedContent === content ? undefined : modifiedContent, violations };
}

