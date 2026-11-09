import { getEnv } from "@/lib/env";
import { ExternalServiceError } from "@/lib/errors";
import { logger } from "@/lib/logger";

const BPS_BASE_URL = "https://webapi.bps.go.id/v1/api";
const REQUEST_TIMEOUT_MS = 5_000;
const MIN_REQUEST_INTERVAL_MS = 1_000;
const MAX_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY_MS = 250;
const MAX_RETRY_AFTER_MS = 5_000;

let lastRequestStartedAt: number | null = null;
let requestQueue: Promise<void> = Promise.resolve();

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForRequestSlot(): Promise<void> {
  let release!: () => void;
  const slot = new Promise<void>((resolve) => {
    release = resolve;
  });
  const previous = requestQueue;
  requestQueue = previous.then(() => slot);

  await previous;
  try {
    const elapsed =
      lastRequestStartedAt === null
        ? MIN_REQUEST_INTERVAL_MS
        : Date.now() - lastRequestStartedAt;
    const delay = Math.max(0, MIN_REQUEST_INTERVAL_MS - elapsed);
    if (lastRequestStartedAt === null) {
      lastRequestStartedAt = Date.now() - MIN_REQUEST_INTERVAL_MS;
    }
    if (delay > 0) {
      await wait(delay);
    }
    lastRequestStartedAt = Date.now();
  } finally {
    release();
  }
}

function getRetryAfterMs(value: string | null): number | undefined {
  if (!value) return undefined;

  const seconds = Number(value);
  const delay =
    Number.isFinite(seconds) && seconds >= 0
      ? seconds * 1_000
      : Date.parse(value) - Date.now();

  if (!Number.isFinite(delay) || delay < 0) return undefined;
  return Math.min(delay, MAX_RETRY_AFTER_MS);
}

function retryDelay(attempt: number, retryAfterMs?: number): number {
  return retryAfterMs ?? INITIAL_RETRY_DELAY_MS * 2 ** attempt;
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

export interface BpsAdapter {
  fetchJson(endpoint: string): Promise<unknown>;
}

/**
 * Mengambil data dari BPS API melalui HTTP GET dengan BPS_API_KEY dari .env.
 * BPS mensyaratkan key di path; path tersebut tidak pernah ditulis ke log.
 * Request dibatasi dengan timeout 5 detik untuk mencegah hang terhadap eksternal.
 */
export class BpsHttpAdapter implements BpsAdapter {
  constructor(
    private readonly apiKey: string = getEnv().BPS_API_KEY ?? "",
    private readonly baseUrl: string = BPS_BASE_URL,
  ) {}

  async fetchJson(endpoint: string): Promise<unknown> {
    if (!this.apiKey) {
      throw new ExternalServiceError(
        "BPS_API_KEY tidak dikonfigurasi di .env",
        { statusCode: 502 },
      );
    }

    if (
      !endpoint.startsWith("/") ||
      endpoint.startsWith("//") ||
      endpoint.includes("\\") ||
      endpoint.split("?")[0].split("/").includes("..") ||
      endpoint.includes("#")
    ) {
      throw new ExternalServiceError("Path endpoint BPS tidak valid.");
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);
    const baseUrl = new URL(this.baseUrl);
    if (
      url.origin !== baseUrl.origin ||
      !url.pathname.startsWith(`${baseUrl.pathname}/`) ||
      url.search ||
      url.pathname.split("/").includes("key")
    ) {
      throw new ExternalServiceError("Path endpoint BPS tidak valid.");
    }
    const endpointPath = url.pathname;
    url.pathname = `${url.pathname.replace(/\/$/, "")}/key/${encodeURIComponent(this.apiKey)}`;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      await waitForRequestSlot();
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS,
      );

      try {
        logger.info("bps.adapter.request", {
          endpoint: endpointPath,
          attempt: attempt + 1,
        });
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          if (
            isRetryableStatus(response.status) &&
            attempt < MAX_ATTEMPTS - 1
          ) {
            const delay = retryDelay(
              attempt,
              getRetryAfterMs(response.headers.get("retry-after")),
            );
            logger.warn("bps.adapter.retry", {
              endpoint: endpointPath,
              attempt: attempt + 1,
              status: response.status,
              delay,
            });
            await wait(delay);
            continue;
          }

          throw new ExternalServiceError(
            `BPS API merespons ${response.status}`,
            {
              statusCode: 502,
              details: { status: response.status, endpoint: endpointPath },
            },
          );
        }

        try {
          return await response.json();
        } catch (error) {
          throw new ExternalServiceError("Respons BPS bukan JSON yang valid", {
            cause: error,
            details: { endpoint: endpointPath },
          });
        }
      } catch (error) {
        if (error instanceof ExternalServiceError) {
          throw error;
        }

        const timedOut = error instanceof Error && error.name === "AbortError";
        if (attempt < MAX_ATTEMPTS - 1) {
          const delay = retryDelay(attempt);
          logger.warn("bps.adapter.retry", {
            endpoint: endpointPath,
            attempt: attempt + 1,
            reason: timedOut ? "timeout" : "network",
            delay,
          });
          await wait(delay);
          continue;
        }

        if (timedOut) {
          throw new ExternalServiceError("BPS API timeout melebihi 5 detik", {
            statusCode: 504,
            cause: error,
          });
        }
        throw new ExternalServiceError("Gagal mengambil data dari BPS API", {
          cause: error,
        });
      } finally {
        clearTimeout(timeoutId);
      }
    }

    throw new ExternalServiceError("Gagal mengambil data dari BPS API");
  }
}
