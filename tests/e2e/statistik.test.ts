import { test, expect } from "@playwright/test";

test("menampilkan grafik, peta, dan label sumber data di halaman statistik tanpa error konsol", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto("/data/statistik");

  await expect(
    page.getByRole("heading", { name: "Statistik Daerah", exact: true }),
  ).toBeVisible();

  // Grafik tren dari endpoint analitik (Recharts) muncul setelah data dimuat.
  const chart = page.locator(".recharts-wrapper");
  await expect(chart).toBeVisible();

  // Peta MapLibre (container) muncul setelah GeoJSON dan data statistik dimuat.
  await expect(page.locator('[data-testid="map-container"]')).toBeVisible();

  // Badge sumber data ("Sumber: BPS API" atau "Sumber: Data Simulasi (Demo)")
  // terlihat di dekat grafik dan peta.
  await expect(page.locator("[data-source]")).toHaveCount(2);
  const sourceLabels = page.getByText(
    /Sumber: (BPS API|Data Simulasi \(Demo\))/,
  );
  await expect(sourceLabels).toHaveCount(2);
  await expect(sourceLabels.first()).toBeVisible();
  await expect(sourceLabels.nth(1)).toBeVisible();

  // Tidak ada error konsol yang berasal dari halaman/API (kecuali noise
  // eksternal seperti muat ulang style peta atau favicon).
  const pageErrors = consoleErrors.filter(
    (text) =>
      !text.includes("maplibre") &&
      !text.includes("demotiles") &&
      !text.includes("favicon") &&
      !text.includes("chrome-extension"),
  );
  expect(pageErrors).toEqual([]);
});
