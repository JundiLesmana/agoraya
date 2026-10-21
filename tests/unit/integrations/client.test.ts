import { describe, expect, it, vi } from "vitest";

import { CircuitBreaker, IntegrationClient } from "@/modules/integrations";

describe("integration client", () => {
  it("returns response body when external service succeeds", async () => {
    const httpClient = { request: vi.fn().mockResolvedValue({ status: 200, headers: new Headers(), body: { ok: true } }) };
    const client = new IntegrationClient(httpClient, new CircuitBreaker({ failureThreshold: 2, cooldownMs: 1000 }));

    await expect(client.execute({ url: "https://example.test", method: "GET", fallback: vi.fn().mockResolvedValue({ ok: false }) })).resolves.toEqual({ ok: true });
  });

  it("applies retry logic for transient failures", async () => {
    const httpClient = { request: vi.fn().mockRejectedValueOnce(new Error("temporary")).mockResolvedValue({ status: 200, headers: new Headers(), body: { ok: true } }) };
    const client = new IntegrationClient(httpClient, new CircuitBreaker({ failureThreshold: 2, cooldownMs: 1000 }), 0);

    await expect(client.execute({ url: "https://example.test", method: "GET", fallback: vi.fn().mockResolvedValue({ ok: false }) })).resolves.toEqual({ ok: true });
    expect(httpClient.request).toHaveBeenCalledTimes(2);
  });

  it("uses fallback when circuit breaker is open", async () => {
    const httpClient = { request: vi.fn().mockRejectedValue(new Error("down")) };
    const breaker = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 1000 });
    const client = new IntegrationClient(httpClient, breaker, 0);
    const fallback = vi.fn().mockResolvedValue({ ok: false });

    await expect(client.execute({ url: "https://example.test", method: "GET", fallback })).resolves.toEqual({ ok: false });
    expect(fallback).toHaveBeenCalled();
  });
});

