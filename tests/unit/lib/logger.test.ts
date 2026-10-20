import { describe, it, expect, afterEach, vi } from 'vitest';
import { ConsoleTransport } from '@/lib/logger/transport';
import { createLogger } from '@/lib/logger';
import type { LogEntry, LogTransport } from '@/lib/logger/types';

const originalEnv = process.env;

afterEach(() => {
  process.env = originalEnv;
  vi.restoreAllMocks();
});

// Capturing transport that records every written entry in memory.
class CapturingTransport implements LogTransport {
  entries: LogEntry[] = [];
  async write(entry: LogEntry): Promise<void> {
    this.entries.push(entry);
  }
  async flush(): Promise<void> {
    return Promise.resolve();
  }
}

describe('lib/logger', () => {
  describe('ConsoleTransport', () => {
    it('writes JSON entries in production mode', async () => {
      process.env = { ...originalEnv, NODE_ENV: 'production' };
      const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const transport = new ConsoleTransport(false);
      const entry: LogEntry = {
        level: 'info',
        message: 'hello',
        timestamp: '2026-01-01T00:00:00.000Z',
        service: 'test',
        requestId: 'req-1',
      };
      await transport.write(entry);
      expect(writeSpy).toHaveBeenCalled();
      const output = writeSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output.trim());
      expect(parsed.level).toBe('info');
      expect(parsed.message).toBe('hello');
      expect(parsed.requestId).toBe('req-1');
    });

    it('redacts sensitive keys', async () => {
      process.env = { ...originalEnv, NODE_ENV: 'development' };
      // level 'error' writes to stderr
      const writeSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
      const transport = new ConsoleTransport(true);
      const entry: LogEntry = {
        level: 'error',
        message: 'login failed',
        timestamp: '2026-01-01T00:00:00.000Z',
        service: 'test',
        password: 'hunter2',
        apiKey: 'sk-123',
        safe: 'visible',
      };
      await transport.write(entry);
      const output = writeSpy.mock.calls[0][0] as string;
      expect(output).not.toContain('hunter2');
      expect(output).not.toContain('sk-123');
      expect(output).toContain('[REDACTED]');
      expect(output).toContain('visible');
    });

    it('writes errors/fatal to stderr', async () => {
      process.env = { ...originalEnv, NODE_ENV: 'production' };
      const outSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const errSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
      const transport = new ConsoleTransport(false);
      await transport.write({
        level: 'fatal',
        message: 'boom',
        timestamp: '2026-01-01T00:00:00.000Z',
        service: 'test',
      });
      expect(outSpy).not.toHaveBeenCalled();
      expect(errSpy).toHaveBeenCalled();
    });

    it('flush resolves immediately', async () => {
      const transport = new ConsoleTransport(false);
      await expect(transport.flush()).resolves.toBeUndefined();
    });
  });

  describe('Logger', () => {
    it('respects log level threshold', async () => {
      const transport = new CapturingTransport();
      const logger = createLogger({ level: 'warn', service: 't', transport });
      logger.debug('should not appear');
      logger.info('should not appear');
      logger.warn('should appear');
      await logger.flush();
      expect(transport.entries).toHaveLength(1);
      expect(transport.entries[0].level).toBe('warn');
    });

    it('child logger merges context', async () => {
      const transport = new CapturingTransport();
      const logger = createLogger({ service: 't', transport });
      const child = logger.child({ requestId: 'req-1', tenantId: 't1' });
      child.info('child log');
      await child.flush();
      expect(transport.entries).toHaveLength(1);
      const entry = transport.entries[0];
      expect(entry.requestId).toBe('req-1');
      expect(entry.tenantId).toBe('t1');
      expect(entry.service).toBe('t');
    });

    it('emits all levels', async () => {
      const transport = new CapturingTransport();
      const logger = createLogger({ level: 'debug', service: 't', transport });
      logger.debug('d');
      logger.info('i');
      logger.warn('w');
      logger.error('e');
      logger.fatal('f');
      await logger.flush();
      expect(transport.entries).toHaveLength(5);
      expect(transport.entries.map((e) => e.level)).toEqual([
        'debug', 'info', 'warn', 'error', 'fatal',
      ]);
    });
  });
});
