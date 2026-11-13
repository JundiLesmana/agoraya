"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { datasetSubmissionSummarySchema } from "@/modules/asn-datasets/contract";

const reviewResponseSchema = z.object({
  submissions: z.array(
    datasetSubmissionSummarySchema.extend({
      sourceUrl: z.string().nullable(),
      licenseName: z.string(),
      dataDictionary: z.array(
        z.object({
          name: z.string(),
          type: z.string(),
          description: z.string(),
        }),
      ),
      csvPreview: z.string().max(4000),
    }),
  ),
});

type PendingSubmission = z.infer<
  typeof reviewResponseSchema
>["submissions"][number];

function errorMessage(payload: unknown): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }
  return "Tinjauan dataset gagal diproses.";
}

export function DatasetSubmissionReview() {
  const [submissions, setSubmissions] = useState<PendingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadSubmissions = useCallback(async () => {
    try {
      const response = await fetch("/api/asn/datasets/submissions/review", {
        cache: "no-store",
      });
      if (response.status === 401 || response.status === 403) {
        setSubmissions([]);
        return;
      }
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(errorMessage(payload));
      const parsed = reviewResponseSchema.safeParse(payload);
      if (!parsed.success) throw new Error("Respons tinjauan dataset tidak valid.");
      setSubmissions(parsed.data.submissions);
      setError("");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Tinjauan dataset tidak dapat dimuat.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSubmissions();
  }, [loadSubmissions]);

  async function publishSubmission(submissionId: string) {
    setPublishingId(submissionId);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/asn/datasets/submissions/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "publish", submissionId }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(errorMessage(payload));
      setNotice("Dataset berhasil dipublikasikan ke katalog publik.");
      await loadSubmissions();
    } catch (publishError) {
      setError(
        publishError instanceof Error
          ? publishError.message
          : "Dataset gagal dipublikasikan.",
      );
    } finally {
      setPublishingId(null);
    }
  }

  if (loading || (!submissions.length && !error && !notice)) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tinjauan dataset ASN</CardTitle>
        <p className="text-muted-foreground text-sm">
          Dataset baru tampil di katalog publik setelah ditinjau oleh pengguna
          lain yang memiliki penugasan yang sama.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {submissions.map((submission) => (
          <article
            key={submission.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
          >
            <div className="min-w-0 space-y-1">
              <h2 className="truncate text-sm font-medium">
                {submission.title}
              </h2>
              <p className="text-muted-foreground text-xs">
                {submission.summary}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{submission.category}</Badge>
                <span className="text-muted-foreground text-xs">
                  {submission.createdByName} ·{" "}
                  {submission.recordCount.toLocaleString("id-ID")} baris ·{" "}
                  {submission.regionName ?? submission.projectLabel ?? "Dataset"}
                </span>
              </div>
              <details className="pt-2">
                <summary className="text-primary cursor-pointer text-xs">
                  Periksa sumber, kamus data, dan pratinjau CSV
                </summary>
                <div className="mt-2 space-y-2 rounded-md bg-muted/40 p-3 text-xs">
                  <p>
                    Sumber: {submission.sourceOrganization}
                    {submission.sourceUrl ? ` · ${submission.sourceUrl}` : ""}
                  </p>
                  <p>Lisensi: {submission.licenseName}</p>
                  <ul className="list-inside list-disc">
                    {submission.dataDictionary.map((column) => (
                      <li key={column.name}>
                        {column.name} ({column.type}) — {column.description}
                      </li>
                    ))}
                  </ul>
                  <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all rounded border bg-background p-2 font-mono text-[10px]">
                    {submission.csvPreview}
                  </pre>
                </div>
              </details>
            </div>
            <Button
              size="sm"
              disabled={publishingId !== null}
              onClick={() => void publishSubmission(submission.id)}
            >
              {publishingId === submission.id
                ? "Memublikasikan..."
                : "Tinjau dan publikasikan"}
            </Button>
          </article>
        ))}
        {notice ? (
          <p role="status" className="flex items-center gap-2 text-sm">
            <CheckCircle2 aria-hidden="true" className="size-4" />
            {notice}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="text-destructive flex items-center gap-2 text-sm">
            <AlertCircle aria-hidden="true" className="size-4" />
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}