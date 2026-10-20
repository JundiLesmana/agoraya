import type { LogEntry, LogLevel, LogTransport, LoggerOptions } from './types';
import { ConsoleTransport } from './transport';

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3, fatal: 4 };
const DEFAULT_SERVICE = 'agoraya';
const FLUSH_INTERVAL_MS = 1000;

export class Logger {
  #level: LogLevel;
  #service: string;
  #context: Record<string, unknown>;
  #transport: LogTransport;
  #queue: Array<{ level: LogLevel; message: string; context?: Record<string, unknown> }> = [];
  #flushTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: LoggerOptions = {}) {
    this.#level = options.level ?? 'info';
    this.#service = options.service ?? DEFAULT_SERVICE;
    this.#context = { ...(options.context ?? {}) };
    this.#transport = options.transport ?? new ConsoleTransport(process.env.NODE_ENV !== 'production');
  }

  child(context: Record<string, unknown>): Logger {
    return new Logger({
      level: this.#level,
      service: this.#service,
      context: { ...this.#context, ...context },
      transport: this.#transport,
    });
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.#emit('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.#emit('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.#emit('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.#emit('error', message, context);
  }

  fatal(message: string, context?: Record<string, unknown>): void {
    this.#emit('fatal', message, context);
  }

  async flush(): Promise<void> {
    await this.#flush();
  }

  #emit(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[this.#level]) return;
    this.#queue.push({ level, message, context: context ?? {} });
    this.#scheduleFlush();
  }

  #scheduleFlush(): void {
    if (this.#flushTimer) return;
    this.#flushTimer = setTimeout(() => {
      this.#flushTimer = null;
      void this.#flush();
    }, FLUSH_INTERVAL_MS);
    if (this.#flushTimer.unref) this.#flushTimer.unref();
  }

  async #flush(): Promise<void> {
    const batch = this.#queue.splice(0, this.#queue.length);
    for (const entry of batch) {
      const logEntry: LogEntry = {
        level: entry.level,
        message: entry.message,
        timestamp: new Date().toISOString(),
        service: this.#service,
        ...this.#context,
        ...entry.context,
      };
      await this.#transport.write(logEntry);
    }
  }
}
