import { getEnv } from "@/lib/env";
import { ExternalServiceError } from "@/lib/errors";
import { logger } from "@/lib/logger";

const BPS_BASE_URL = "https://webapi.bps.go.id/v1/api";
const REQUEST_TIMEOUT_MS = 5_000;

export interface BpsAdapter {
  fetchJson(endpoint: string): Promise<unknown>;
}

/**
 * Mengambil data dari BPS API melalui HTTP GET dengan BPS_API_KEY dari .env.
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

    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      logger.info("bps.adapter.request", { endpoint });
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new ExternalServiceError(`BPS API merespons ${response.status}`, {
          statusCode: 502,
          details: { status: response.status, endpoint },
        });
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new ExternalServiceError("BPS API timeout melebihi 5 detik", {
          statusCode: 504,
          cause: error,
        });
      }
      if (error instanceof ExternalServiceError) {
        throw error;
      }
      throw new ExternalServiceError("Gagal mengambil data dari BPS API", {
        cause: error,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
