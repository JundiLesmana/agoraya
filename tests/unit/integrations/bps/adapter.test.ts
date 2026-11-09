import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { BpsHttpAdapter } from "@/modules/integrations/bps";
import { ExternalServiceError } from "@/lib/errors";
import { logger } from "@/lib/logger";

const originalFetch = globalThis.fetch;
let fakeTimeOffset = 0;

beforeEach(() => {
  vi.useFakeTimers();
  fakeTimeOffset += 60_000;
  vi.setSystemTime(Date.now() + fakeTimeOffset);
  globalThis.fetch = vi.fn();
});

afterEach(() => {
  vi.useRealTimers();
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("bps adapter", () => {
  it("menyertakan BPS_API_KEY pada path resmi tanpa mengirim Authorization header", async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), { status: 200 }),
    );

    const adapter = new BpsHttpAdapter("test-api-key");
    await adapter.fetchJson("/statistik/data");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(
      "https://webapi.bps.go.id/v1/api/statistik/data/key/test-api-key",
    );
    expect(init.method).toBe("GET");
    expect(init.headers.Authorization).toBeUndefined();
    expect(init.headers.Accept).toBe("application/json");
    expect((init.signal as AbortSignal).aborted).toBe(false);
  });

  it("tidak mencatat key ke log dan menolak query string pada endpoint", async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), { status: 200 }),
    );
    const infoSpy = vi.spyOn(logger, "info");

    const adapter = new BpsHttpAdapter("secret-key");
    await expect(adapter.fetchJson("/list/model/data?model=1")).rejects.toThrow(
      ExternalServiceError,
    );
    await adapter.fetchJson("/list/model/data");
    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/key/secret-key");
    expect(JSON.stringify(infoSpy.mock.calls)).not.toContain("secret-key");
    expect(JSON.stringify(infoSpy.mock.calls)).not.toContain("domain=3100");
  });

  it("menolak path endpoint yang mencoba keluar dari origin BPS", async () => {
    const adapter = new BpsHttpAdapter("test-api-key");

    await expect(adapter.fetchJson("//example.com/data")).rejects.toThrow(
      ExternalServiceError,
    );
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("melempar ExternalServiceError saat respons bukan 2xx", async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue(
      new Response("Not Found", { status: 404, statusText: "Not Found" }),
    );

    const adapter = new BpsHttpAdapter("test-api-key");
    const request = adapter.fetchJson("/statistik/data");
    const rejection = expect(request).rejects.toMatchObject(
      expect.objectContaining({ statusCode: 502 }),
    );
    await vi.runAllTimersAsync();
    await rejection;
  });

  it("mengulang request setelah HTTP 429 dan menghormati rate limit antar-request", async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce(
        new Response("Rate limited", {
          status: 429,
          headers: { "Retry-After": "0" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [] }), { status: 200 }),
      );

    const adapter = new BpsHttpAdapter("test-api-key");
    const response = adapter.fetchJson("/statistik/data");
    await vi.runAllTimersAsync();
    await expect(response).resolves.toEqual({ data: [] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("memberi jarak minimal satu detik untuk request BPS berurutan", async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    const requestStartedAt: number[] = [];
    fetchMock.mockImplementation(async () => {
      requestStartedAt.push(Date.now());
      return new Response(JSON.stringify({ status: "OK" }), { status: 200 });
    });

    const adapter = new BpsHttpAdapter("test-api-key");
    await adapter.fetchJson("/list/model/data");
    const secondRequest = adapter.fetchJson("/list/model/data");
    await vi.runAllTimersAsync();
    await secondRequest;

    expect(requestStartedAt).toHaveLength(2);
    expect(requestStartedAt[1] - requestStartedAt[0]).toBeGreaterThanOrEqual(
      1_000,
    );
  });

  it("melempar ExternalServiceError dengan status 504 saat melebihi timeout 5 detik", async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockImplementation((_url, { signal }) => {
      return new Promise((_, reject) => {
        const onAbort = () => {
          const err = new Error("The operation was aborted");
          err.name = "AbortError";
          reject(err);
        };
        signal?.addEventListener("abort", onAbort);
      });
    });

    const adapter = new BpsHttpAdapter("test-api-key");
    const promise = adapter.fetchJson("/statistik/data");
    const rejection = expect(promise).rejects.toMatchObject(
      expect.objectContaining({
        statusCode: 504,
        message: expect.stringContaining("timeout"),
      }),
    );

    await vi.runAllTimersAsync();

    await rejection;
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("melempar ExternalServiceError saat BPS_API_KEY tidak dikonfigurasi", async () => {
    const adapter = new BpsHttpAdapter("");
    await expect(adapter.fetchJson("/statistik/data")).rejects.toThrow(
      ExternalServiceError,
    );
  });
});
