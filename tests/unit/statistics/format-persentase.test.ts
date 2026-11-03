import { describe, expect, it } from 'vitest';
import { formatPersentase, hitungPersentase } from '@/lib/summary';

describe('formatPersentase', () => {
  it('mengonversi rasio 0.65 menjadi "65%"', () => {
    expect(formatPersentase(0.65)).toBe('65%');
  });

  it('mengonversi rasio 0.30 menjadi "30%"', () => {
    expect(formatPersentase(0.30)).toBe('30%');
  });

  it('mengonversi rasio 0.05 menjadi "5%"', () => {
    expect(formatPersentase(0.05)).toBe('5%');
  });

  it('mengembalikan "0%" untuk rasio 0', () => {
    expect(formatPersentase(0)).toBe('0%');
  });

  it('membulatkan ke bilangan bulat terdekat', () => {
    expect(formatPersentase(0.654)).toBe('65%');
    expect(formatPersentase(0.656)).toBe('66%');
  });
});

describe('hitungPersentase', () => {
  it('menghitung rasio bagian terhadap total', () => {
    expect(hitungPersentase(156, 240)).toBe(0.65);
    expect(hitungPersentase(72, 240)).toBe(0.3);
    expect(hitungPersentase(12, 240)).toBe(0.05);
  });

  it('mengembalikan 0 jika total adalah 0', () => {
    expect(hitungPersentase(5, 0)).toBe(0);
  });
});