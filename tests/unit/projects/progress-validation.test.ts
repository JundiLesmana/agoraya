import { describe, expect, it } from 'vitest';
import {
  computeProgressDeviation,
  validatePhysicalProgressNonDecreasing,
} from '@/lib/progress';

describe('validatePhysicalProgressNonDecreasing', () => {
  it('mengizinkan progres yang sama dengan pelaporan sebelumnya', () => {
    const result = validatePhysicalProgressNonDecreasing({
      currentPhysicalProgress: 70,
      lastPhysicalProgress: 70,
    });
    expect(result.valid).toBe(true);
  });

  it('mengizinkan progres yang lebih besar dari bulan lalu', () => {
    const result = validatePhysicalProgressNonDecreasing({
      currentPhysicalProgress: 75,
      lastPhysicalProgress: 70,
    });
    expect(result.valid).toBe(true);
  });

  it('menolak progres fisik yang menurun dibanding bulan lalu', () => {
    const result = validatePhysicalProgressNonDecreasing({
      currentPhysicalProgress: 65,
      lastPhysicalProgress: 70,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('65%');
    expect(result.error).toContain('70%');
    expect(result.error).toContain('tidak boleh lebih kecil');
  });

  it('mengizinkan nilai pertama kali saat tidak ada pelaporan sebelumnya', () => {
    const result = validatePhysicalProgressNonDecreasing({
      currentPhysicalProgress: 30,
      lastPhysicalProgress: -1,
    });
    expect(result.valid).toBe(true);
  });
});

describe('computeProgressDeviation', () => {
  it('menandai warning ketika selisih lebih dari 15 persen', () => {
    const deviation = computeProgressDeviation(75, 56.5);
    expect(deviation.warning).toBe(true);
    expect(deviation.difference).toBeCloseTo(18.5);
  });

  it('tidak menandai warning ketika selisih 15 persen atau kurang', () => {
    expect(computeProgressDeviation(70, 56).warning).toBe(false); // selisih 14
    expect(computeProgressDeviation(60, 75).warning).toBe(false); // selisih -15 tepat ambang
  });

  it('menandai warning baik fisik lebih tinggi maupun lebih rendah', () => {
    expect(computeProgressDeviation(90, 70).warning).toBe(true);
    expect(computeProgressDeviation(40, 60).warning).toBe(true);
  });

  it('menghitung selisih fisik minus keuangan', () => {
    expect(computeProgressDeviation(75, 56.5).difference).toBeCloseTo(18.5);
    expect(computeProgressDeviation(50, 65).difference).toBeCloseTo(-15);
  });
});
