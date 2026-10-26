import type { LoggerOptions } from './types';
import { Logger } from './logger-class';
import { ConsoleTransport } from './transport';

const DEFAULT_SERVICE = 'agoraya';

export { Logger };
export function createLogger(options?: LoggerOptions): Logger {
  return new Logger(options ?? {});
}

export { logger } from './logger';

export const serverLogger = createLogger({ service: DEFAULT_SERVICE });
export type { LogEntry, LogLevel, LogTransport, LoggerOptions } from './types';
