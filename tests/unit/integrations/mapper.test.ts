import { describe, expect, it } from "vitest";

import { mapIntegrationData } from "@/modules/integrations";

describe("integration mapper", () => {
  it("transforms payloads into the expected format", () => {
    const mapped = mapIntegrationData({ id: "1", name: "example" }, (input) => ({ externalId: input.id, label: input.name.toUpperCase() }));
    expect(mapped).toEqual({ externalId: "1", label: "EXAMPLE" });
  });
});

