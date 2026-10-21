import type { IdentityProvider, CitizenData, IdentityVerificationResult } from '../identity-provider/provider';
import { logger } from '@/lib/logger';

const MOCK_CITIZENS: Record<string, CitizenData> = {
  '3201010101010001': {
    id: 'mock-1',
    nik: '3201010101010001',
    name: 'Budi Santoso',
    email: 'budi.santoso@example.com',
    phone: '081234567890',
    dateOfBirth: '1990-01-01',
    gender: 'male',
    address: 'Jl. Merdeka No. 1',
    province: 'Jawa Barat',
    city: 'Bandung',
    district: 'Coblong',
    village: 'Dago',
  },
  '3201010202020002': {
    id: 'mock-2',
    nik: '3201010202020002',
    name: 'Siti Aminah',
    email: 'siti.aminah@example.com',
    phone: '081234567891',
    dateOfBirth: '1992-02-02',
    gender: 'female',
    address: 'Jl. Sudirman No. 2',
    province: 'Jawa Barat',
    city: 'Bandung',
    district: 'Bandung Wetan',
    village: 'Cihapit',
  },
};

export class MockDukcapilProvider implements IdentityProvider {
  async verify(nik: string, additionalData?: Record<string, unknown>): Promise<IdentityVerificationResult> {
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
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(nik).digest('hex').substring(0, 8);
  }
}

export const mockDukcapilProvider = new MockDukcapilProvider();
