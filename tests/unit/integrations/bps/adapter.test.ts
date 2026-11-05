import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { BpsHttpAdapter } from "@/modules/integrations/bps";
import { ExternalServiceError } from "@/lib/errors";

const originalFetch = globalThis.fetch;

beforeEach(() => {
  vi.useFakeTimers();
  globalThis.fetch = vi.fn();
});

afterEach(() => {
  vi.useRealTimers();
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("bps adapter", () => {
  it("mengirim GET dengan BPS_API_KEY di header Authorization", async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), { status: 200 }),
    );

    const adapter = new BpsHttpAdapter("test-api-key");
    await adapter.fetchJson("/statistik/data");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://webapi.bps.go.id/v1/api/statistik/data");
    expect(init.method).toBe("GET");
    expect(init.headers.Authorization).toBe("Bearer test-api-key");
    expect(init.headers.Accept).toBe("application/json");
    expect((init.signal as AbortSignal).aborted).toBe(false);
  });

  it("melempar ExternalServiceError saat respons bukan 2xx", async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue(
      new Response("Not Found", { status: 404, statusText: "Not Found" }),
    );

    const adapter = new BpsHttpAdapter("test-api-key");
    await expect(adapter.fetchJson("/statistik/data")).rejects.toMatchObject(
      expect.objectContaining({ statusCode: 502 }),
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

    vi.advanceTimersByTime(5000);

    await expect(promise).rejects.toMatchObject(
      expect.objectContaining({
        statusCode: 504,
        message: expect.stringContaining("timeout"),
      }),
    );
  });

  it("melempar ExternalServiceError saat BPS_API_KEY tidak dikonfigurasi", async () => {
    const adapter = new BpsHttpAdapter("");
    await expect(adapter.fetchJson("/statistik/data")).rejects.toThrow(
      ExternalServiceError,
    );
  });
});
