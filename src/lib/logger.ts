export { logger, createLogger, serverLogger } from './logger/index';
export type { LogEntry, LogLevel, LogTransport, LoggerOptions } from './logger/types';
import { createLogger } from './logger/index';
export const logger = createLogger({ service: 'agoraya' });