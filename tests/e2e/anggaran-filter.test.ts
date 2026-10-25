import { test, expect } from '@playwright/test';

test('mengubah filter anggaran dan menekan "Terapkan filter" memperbarui state global', async ({ page }) => {
  await page.goto('/anggaran');

  // Judul halaman dan indikator halaman "Anggaran" aktif.
  await expect(page.getByRole('heading', { name: 'Jelajahi anggaran' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Beranda' })).toBeVisible();
  await expect(page.getByText('Anggaran')).toBeVisible();

  // Default filter terlihat di ketiga dropdown.
  await expect(page.locator('#filter-wilayah')).toHaveValue('Provinsi Jawa Barat');
  await expect(page.locator('#filter-tahun')).toHaveValue('2025');
  await expect(page.locator('#filter-periode')).toHaveValue('s.d. Triwulan III');

  // Pilih nilai berbeda pada setiap dropdown.
  await page.locator('#filter-wilayah').selectOption('Provinsi DKI Jakarta');
  await page.locator('#filter-tahun').selectOption('2026');
  await page.locator('#filter-periode').selectOption('Kumulatif');

  // Kunci filter → state global berubah dan data dimuat ulang.
  await page.getByRole('button', { name: 'Terapkan filter' }).click();
  await expect(page.getByRole('button', { name: 'Terkunci' })).toBeVisible();
  await expect(page.getByText(/Diterapkan:.*Provinsi DKI Jakarta.*2026.*Kumulatif/)).toBeVisible();
  await expect(page.getByText(/Data diperbarui pada/)).toBeVisible();
});
