import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BudgetVisualizations, transformSectorAllocationData, transformTrendData } from '@/components/charts/budget-visualizations';

describe('budget visualization helpers', () => {
  it('memformat data tren dan sektor sesuai struktur chart', () => {
    expect(transformTrendData([{ month: 'Jan', target: 4, realisasi: 3 }])).toEqual([
      { month: 'Jan', target: 4, realisasi: 3 },
    ]);
    expect(transformSectorAllocationData([{ sector: 'Pendidikan', pagu: 32, realisasi: 24 }])).toEqual([
      { sector: 'Pendidikan', pagu: 32, realisasi: 24 },
    ]);
  });
});

describe('BudgetVisualizations', () => {
  it('merender dua grafik dengan label aksesibel', () => {
    render(<BudgetVisualizations />);
    expect(screen.getByLabelText(/grafik tren realisasi anggaran/i)).toBeTruthy();
    expect(screen.getByLabelText(/grafik alokasi per sektor/i)).toBeTruthy();
  });
});
