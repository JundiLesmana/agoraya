import type { LoggerOptions } from './types';
import { Logger } from './logger-class';

export function createLogger(options?: LoggerOptions): Logger {
  return new Logger(options ?? {});
}

export { Logger };
