import { createHash } from 'node:crypto';
import type { IdentityProvider, CitizenData, IdentityVerificationResult } from '../identity-provider/provider';
import { logger } from '@/lib/logger';

const MOCK_CITIZENS: Record<string, CitizenData> = { ... };

export class MockDukcapilProvider implements IdentityProvider {
  async verify(nik: string, _additionalData?: Record<string, unknown>): Promise<IdentityVerificationResult> {
    if (process.env.NODE_ENV === 'production') {
      logger.error('mock_dukcapil_used_in_production', { nikHash: this.hashNik(nik) });
      throw new Error('Mock Dukcapil provider is not available in production');
    }

    logger.info('mock_dukcapil.verify', { nikHash: this.hashNik(nik) });

    if (!/^\d{16}$/.test(nik)) {
      return { valid: false, message: 'Invalid NIK format' };
    }

    const citizen = MOCK_CITIZENS[nik];
    if (!citizen) {
      return { valid: false, message: 'NIK not found' };
    }

    return { valid: true, data: citizen };
  }

  async getByNik(nik: string): Promise<CitizenData | null> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Mock Dukcapil provider is not available in production');
    }

    if (!/^\d{16}$/.test(nik)) {
      return null;
    }

    return MOCK_CITIZENS[nik] || null;
  }

  private hashNik(nik: string): string {
    return createHash('sha256').update(nik).digest('hex').slice(0, 8);
  }
}