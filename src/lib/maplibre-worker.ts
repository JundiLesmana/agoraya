import type * as MapLibreGL from "maplibre-gl";

export function configureMapLibreWorker(
  maplibre: Pick<typeof MapLibreGL, "setWorkerUrl">,
): void {
  maplibre.setWorkerUrl("/maplibre-gl-worker.mjs");
}