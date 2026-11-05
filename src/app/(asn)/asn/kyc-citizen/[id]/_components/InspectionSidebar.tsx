'use client';

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChevronRight } from "lucide-react";
import { INSPECTION_STATUS_OPTIONS } from "@/lib/kyc-presentation";

const COUNTABLE_CATEGORY_IDS = ["identitas", "alamat", "fotoKtp", "selfie"];

interface InspectionSidebarProps {
  categories: readonly { id: string; label: string; status: string }[];
}

export function InspectionSidebar({ categories }: InspectionSidebarProps) {
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [internalNotes, setInternalNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);

  const handleStatusChange = useCallback(
    (id: string, value: string) => {
      setStatuses((prev) => ({ ...prev, [id]: value }));
    },
    [],
  );

  const handleSaveNotes = useCallback(() => {
    // TODO(#430): simpan catatan internal ke catatan pemeriksa (tidak dikirim ke pemohon)
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  }, []);

  const inspectedCount = COUNTABLE_CATEGORY_IDS.filter(
    (id) => statuses[id] === "sesuai",
  ).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="px-6 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Pemeriksaan bagian</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pilihan: Belum diperiksa, Perlu perbaikan, atau Sesuai. Status
                bagian bukan keputusan akhir.
              </p>
            </div>
            <span className="text-xs font-semibold">
              {inspectedCount} / 4
            </span>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-3 space-y-3">
          {categories.map((category) => (
            <div key={category.id} className="space-y-1">
              <Label className="text-xs font-medium leading-none">
                {category.label}
              </Label>
              <Select
                value={statuses[category.id] ?? "belum"}
                onChange={(e) => handleStatusChange(category.id, e.target.value)}
                placeholder="Pilih status"
                options={INSPECTION_STATUS_OPTIONS}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="px-6 pb-2">
          <CardTitle className="text-base">Catatan pemeriksaan</CardTitle>
          <span className="ml-auto px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
            Internal
          </span>
        </CardHeader>
        <CardContent className="px-6 py-3">
          <Label htmlFor="catatan-internal">Catatan internal</Label>
          <Textarea
            id="catatan-internal"
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            placeholder="Tuliskan temuan dan bagian yang perlu ditindaklanjuti..."
            className="mt-1"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Hanya untuk petugas berwenang. Tidak dikirim kepada pemohon.
          </p>
          <Button
            onClick={handleSaveNotes}
            disabled={notesSaved}
            className="mt-3"
          >
            {notesSaved ? "Tersimpan" : "Simpan catatan"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="px-6 pb-2">
          <CardTitle className="text-base">Jaga kerahasiaan data</CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Identitas, NIK, alamat, foto KTP, dan selfie warga hanya digunakan
            untuk verifikasi oleh petugas yang berwenang, tidak dipublikasikan.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex h-1.5 w-1.5 items-center">
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
            <a className="underline underline-offset-4 hover:text-primary">
              Periksa sebelum memutuskan
            </a>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex h-1.5 w-1.5 items-center">
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
            <a className="underline underline-offset-4 hover:text-primary">
              Panduan pemeriksaan
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
