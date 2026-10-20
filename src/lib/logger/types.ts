// Agoraya — lib/logger types

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LoggerOptions {
  readonly level?: LogLevel;
  readonly service?: string;
  readonly context?: LogContext;
  readonly transport?: LogTransport;
}

export interface LogEntry {
  readonly level: LogLevel;
  readonly message: string;
  readonly timestamp: string;
  readonly service: string;
  readonly requestId?: string;
  readonly tenantId?: string;
  readonly userId?: string;
  readonly [key: string]: unknown;
}

export interface LogContext {
  readonly requestId?: string;
  readonly tenantId?: string;
  readonly userId?: string;
  readonly [key: string]: unknown;
}

export interface LogTransport {
  write(entry: LogEntry): Promise<void>;
  flush(): Promise<void>;
}

export interface LoggerOptions {
  readonly level?: LogLevel;
  readonly service?: string;
  readonly context?: LogContext;
  readonly transport?: LogTransport;
}
