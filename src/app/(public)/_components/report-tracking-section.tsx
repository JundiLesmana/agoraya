import Link from "next/link";
import {
  Check,
  Circle,
  Clock3,
  Info,
  MapPin,
  Wrench,
} from "lucide-react";
import {
  determineActiveTrackingNode,
  formatTrackingDate,
  getTrackingNodeState,
  TRACKING_STEPS,
} from "./report-tracking";

const activeNode = determineActiveTrackingNode("in_progress");

export function ReportTrackingSection() {
  return (
    <section
      id="report-tracking"
      aria-labelledby="report-tracking-title"
      className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
    >
      <div className="mb-7 max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
          Pantau perkembangan
        </p>
        <h2
          id="report-tracking-title"
          className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
        >
          Laporan terkirim, tindak lanjut terlihat
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
          Pantau progres laporan Anda dari awal hingga penyelesaian
        </p>
      </div>

      <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-start gap-3 border-b border-blue-100 bg-blue-50 px-5 py-3 text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            Contoh alur pelacakan. Kode, tanggal, instansi, dan tanggapan berikut
            merupakan ilustrasi, bukan data aktual.
          </p>
        </div>

        <div className="grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(250px,0.8fr)_minmax(0,1.5fr)] lg:gap-10">
          <div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-muted-foreground">
                #LP-2026-007064-01
              </span>
              <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 dark:bg-orange-950/50 dark:text-orange-300">
                Dalam tindak lanjut
              </span>
            </div>
            <h3 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
              Jalan berlubang di Jl. Melati
            </h3>
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4 shrink-0" aria-hidden="true" />
              Kel. Sukamaju, Kota Bandung
            </p>
            <dl className="mt-5 grid gap-4 border-y border-border py-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Tanggal</dt>
                <dd className="mt-1 font-semibold text-foreground">
                  {formatTrackingDate(new Date("2026-10-12T00:00:00.000Z"))}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Instansi</dt>
                <dd className="mt-1 font-semibold text-foreground">
                  Dinas Bina Marga
                </dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3">
              <Link
                href="/reports/LP-2026-007064-01"
                className="inline-flex min-h-10 items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Lihat contoh laporan
              </Link>
              <Link
                href="/tracking"
                className="inline-flex min-h-10 items-center text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Buat laporan baru
              </Link>
            </div>
          </div>

          <ol
            aria-label="Progres laporan dari diterima hingga penyelesaian"
            className="space-y-0"
          >
            {TRACKING_STEPS.map((step, index) => {
              const state = getTrackingNodeState(index, activeNode);
              const NodeIcon =
                index === 0 ? Check : index === 1 ? Check : index === 2 ? Wrench : Circle;
              const milestone =
                index === 0
                  ? new Date("2026-10-12T09:15:00.000Z")
                  : index === 1
                    ? new Date("2026-10-13T10:30:00.000Z")
                    : index === 2
                      ? new Date("2026-10-15T14:00:00.000Z")
                      : null;
              const isUpcoming = state === "upcoming";

              return (
                <li
                  key={step.status}
                  aria-current={state === "active" ? "step" : undefined}
                  className="relative flex min-h-20 gap-4 pb-5 last:min-h-0 last:pb-0"
                >
                  {index < TRACKING_STEPS.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className={`absolute left-[11px] top-7 h-[calc(100%-1.25rem)] w-px ${
                        state === "completed" ? "bg-emerald-500" : "bg-border"
                      }`}
                    />
                  ) : null}
                  <span
                    aria-hidden="true"
                    data-state={state}
                    className={`relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full ${
                      state === "completed"
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950"
                        : state === "active"
                          ? "bg-primary text-primary-foreground"
                          : "border border-border bg-background text-muted-foreground"
                    }`}
                  >
                    <NodeIcon className="size-3.5" strokeWidth={2.5} />
                  </span>
                  <div className={isUpcoming ? "text-muted-foreground" : ""}>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4
                        className={`text-sm font-semibold ${
                          isUpcoming ? "text-muted-foreground" : "text-foreground"
                        }`}
                      >
                        {step.title}
                      </h4>
                      {state === "active" ? (
                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                          Status saat ini
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {milestone
                        ? formatTrackingDate(milestone)
                        : "Menunggu pembaruan"}
                    </p>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </article>

      <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
        <Clock3 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Waktu penanganan bergantung pada jenis masalah dan instansi terkait.
        Jika informasi belum lengkap, petugas dapat meminta perbaikan laporan.
      </p>
      <span className="sr-only">Contoh laporan dikirim 12 Okt 2026.</span>
    </section>
  );
}
