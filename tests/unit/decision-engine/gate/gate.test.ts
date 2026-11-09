import { describe, expect, it } from "vitest";
import { checkGate } from "@/modules/decision-engine/gate";
import type { DecisionGate } from "@/modules/decision-engine/types";

function gate(overrides: Partial<DecisionGate> = {}): DecisionGate {
  return {
    key: "g1",
    name: "Gate",
    requiredRoles: ["checker"],
    requiredPermissions: [],
    decision: "approve",
    ...overrides,
  };
}

describe("decision-engine/gate", () => {
  it("approves when subject has required role", () => {
    const result = checkGate({
      gate: gate(),
      subject: { roles: ["checker"], permissions: [] },
    });
    expect(result).toBe(true);
  });

  it("rejects when subject lacks required role", () => {
    const result = checkGate({
      gate: gate(),
      subject: { roles: ["viewer"], permissions: [] },
    });
    expect(result).toBe(false);
  });

  it("approves when no required roles", () => {
    const result = checkGate({
      gate: gate({ requiredRoles: [] }),
      subject: { roles: [], permissions: [] },
    });
    expect(result).toBe(true);
  });

  it("requires permission when listed", () => {
    const result = checkGate({
      gate: gate({ requiredPermissions: ["tickets.read"] }),
      subject: { roles: ["checker"], permissions: ["tickets.read"] },
    });
    expect(result).toBe(true);

    const denied = checkGate({
      gate: gate({ requiredPermissions: ["tickets.read"] }),
      subject: { roles: ["checker"], permissions: [] },
    });
    expect(denied).toBe(false);
  });

  it("reject decision inverts the check", () => {
    const result = checkGate({
      gate: gate({ decision: "reject" }),
      subject: { roles: ["checker"], permissions: [] },
    });
    expect(result).toBe(false);

    const allowed = checkGate({
      gate: gate({ decision: "reject" }),
      subject: { roles: ["viewer"], permissions: [] },
    });
    expect(allowed).toBe(true);
  });
});
