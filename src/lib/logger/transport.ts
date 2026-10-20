// Agoraya — lib/logger transport
// Console output for structured logs. JSON in production/test, human-readable in development.
// Sensitive fields are redacted before output.

import type { LogEntry, LogTransport } from './types';

const SENSITIVE_KEY = /^(password|secret|token|otp|nik|api.?key|authorization|cookie|session|access.?token|refresh.?token|private.?key)$/i;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Error);
}

function redactValue(key: string, value: unknown, isDev: boolean): unknown {
  if (SENSITIVE_KEY.test(key)) return '[REDACTED]';
  if (value instanceof Error) {
    return { type: value.constructor.name, message: value.message, ...(isDev ? { stack: value.stack } : {}) };
  }
  if (Array.isArray(value)) return value.map((item) => redactValue(key, item, isDev));
  if (isPlainObject(value)) {
    const output: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(value)) {
      output[k] = redactValue(k, val, isDev);
    }
    return output;
  }
  return value;
}

function serializeEntry(entry: LogEntry, isDev: boolean): Record<string, unknown> {
  const output: Record<string, unknown> = {
    level: entry.level,
    message: entry.message,
    timestamp: entry.timestamp,
    service: entry.service,
  };
  for (const [key, val] of Object.entries(entry)) {
    if (key === 'level' || key === 'message' || key === 'timestamp' || key === 'service') continue;
    output[key] = redactValue(key, val, isDev);
  }
  return output;
}

export class ConsoleTransport implements LogTransport {
  readonly #isDev: boolean;

  constructor(isDev: boolean) {
    this.#isDev = isDev;
  }

  async write(entry: LogEntry): Promise<void> {
    const payload = serializeEntry(entry, this.#isDev);
    const contextKeys = Object.keys(payload).filter(
      (key) => key !== 'level' && key !== 'message' && key !== 'timestamp' && key !== 'service',
    );
    const line = this.#isDev
      ? `${entry.timestamp} [${entry.level}] ${entry.service}: ${entry.message}${
          contextKeys.length > 0 ? ` ${JSON.stringify(payload)}` : ''
        }`
      : JSON.stringify(payload);
    const stream = entry.level === 'error' || entry.level === 'fatal' ? process.stderr : process.stdout;
    stream.write(`${line}\n`);
  }

  async flush(): Promise<void> {
    // Console output is synchronous; nothing to drain.
    return Promise.resolve();
  }
}
