import { describe, expect, it } from "vitest";
import {
  SERVICE_APPLICATION_CATALOG,
  SERVICE_APPLICATION_CATEGORIES,
} from "@/modules/service-applications/catalog";

describe("service application catalog", () => {
  it("defines a route, responsible agency, and subcategories for each category", () => {
    expect(SERVICE_APPLICATION_CATEGORIES).toEqual([
      "permit",
      "education",
      "social",
      "health",
    ]);

    for (const category of SERVICE_APPLICATION_CATEGORIES) {
      const entry = SERVICE_APPLICATION_CATALOG[category];
      expect(entry.href).toBe(`/citizen/apply/${category}`);
      expect(entry.agency.length).toBeGreaterThan(0);
      expect(Object.keys(entry.services)).toHaveLength(3);

      for (const [serviceId, serviceName] of Object.entries(entry.services)) {
        expect(serviceId.length).toBeGreaterThan(0);
        expect(serviceName.length).toBeGreaterThan(0);
      }
    }
  });
});
