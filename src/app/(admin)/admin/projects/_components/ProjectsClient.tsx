"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type UserRow = { id: string; email: string; name: string };

type ProjectRow = {
  id: string;
  assignedUserId: string;
  assignedUserEmail: string;
  assignedUserName: string;
  externalProjectId: string;
  packageName: string;
  location: string;
  sector: string;
  contractValue: number;
  providerName: string;
  startDate: string;
  endDate: string;
  fiscalYear: number;
  initialPhysicalProgress: number;
  initialFinancialProgress: number;
  status: string;
  reportCount: number;
};

type FormData = {
  assignedUserId: string;
  externalProjectId: string;
  packageName: string;
  location: string;
  sector: string;
  contractValue: string;
  providerName: string;
  startDate: string;
  endDate: string;
  fiscalYear: string;
  initialPhysicalProgress: string;
  initialFinancialProgress: string;
  status: string;
};

const STATUS_OPTIONS = [
  { value: "ongoing", label: "Berjalan (ongoing)" },
  { value: "completed", label: "Selesai (completed)" },
  { value: "delayed", label: "Tertunda (delayed)" },
];

function emptyForm(year: number): FormData {
  return {
    assignedUserId: "",
    externalProjectId: "",
    packageName: "",
    location: "",
    sector: "infrastruktur",
    contractValue: "0",
    providerName: "",
    startDate: "",
    endDate: "",
    fiscalYear: String(year),
    initialPhysicalProgress: "0",
    initialFinancialProgress: "0",
    status: "ongoing",
  };
}

function messageFrom(payload: unknown): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "string"
  )
    return payload.error;
  return "Permintaan tidak dapat diproses.";
}

function toPayload(form: FormData) {
  return {
    assignedUserId: form.assignedUserId,
    externalProjectId: form.externalProjectId.trim(),
    packageName: form.packageName.trim(),
    location: form.location.trim(),
    sector: form.sector.trim(),
    contractValue: Number(form.contractValue),
    providerName: form.providerName.trim(),
    startDate: form.startDate,
    endDate: form.endDate,
    fiscalYear: Number(form.fiscalYear),
    initialPhysicalProgress: Number(form.initialPhysicalProgress),
    initialFinancialProgress: Number(form.initialFinancialProgress),
    status: form.status,
  };
}

export function ProjectsClient({ initialUsers }: { initialUsers: UserRow[] }) {
  const [users] = useState<UserRow[]>(initialUsers);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [form, setForm] = useState<FormData>(() =>
    emptyForm(new Date().getFullYear()),
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch("/api/admin/projects", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(messageFrom(payload));
      setProjects(payload.projects ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Daftar proyek gagal dimuat.");
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const handleChange = (key: keyof FormData, value: string) =>
    setForm((c) => ({ ...c, [key]: value }));

  const startEdit = (p: ProjectRow) => {
    setEditingId(p.id);
    setForm({
      assignedUserId: p.assignedUserId,
      externalProjectId: p.externalProjectId,
      packageName: p.packageName,
      location: p.location,
      sector: p.sector,
      contractValue: String(p.contractValue),
      providerName: p.providerName,
      startDate: p.startDate,
      endDate: p.endDate,
      fiscalYear: String(p.fiscalYear),
      initialPhysicalProgress: String(p.initialPhysicalProgress),
      initialFinancialProgress: String(p.initialFinancialProgress),
      status: p.status,
    });
    setNotice(null);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm(new Date().getFullYear()));
  };

  const submit = async () => {
    if (
      !form.assignedUserId ||
      !form.externalProjectId ||
      !form.packageName ||
      !form.location ||
      !form.sector ||
      !form.providerName ||
      !form.startDate ||
      !form.endDate
    ) {
      setError("Semua field wajib diisi.");
      return;
    }
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const payload = toPayload(form);
      const url = editingId
        ? `/api/admin/projects/${editingId}`
        : "/api/admin/projects";
      const method = editingId ? "PATCH" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(messageFrom(data));
      setNotice(editingId ? "Proyek berhasil diperbarui." : "Proyek berhasil dibuat.");
      cancelEdit();
      await loadProjects();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Proyek gagal disimpan.");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (p: ProjectRow) => {
    if (
      !window.confirm(
        `Hapus proyek "${p.packageName}" (${p.externalProjectId})? Proyek dengan laporan progres tidak dapat dihapus.`,
      )
    )
      return;
    setBusyId(p.id);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/admin/projects/${p.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(messageFrom(data));
      setNotice("Proyek berhasil dihapus.");
      if (editingId === p.id) cancelEdit();
      await loadProjects();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Proyek gagal dihapus.");
    } finally {
      setBusyId(null);
    }
  };

  const userOptions = useMemo(
    () => users.map((u) => ({ value: u.id, label: `${u.email} (${u.name})` })),
    [users],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-primary text-sm font-medium">Pengelolaan Proyek</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Proyek Infrastruktur
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Buat dan kelola data proyek serta tetapkan penanggung jawab (ASN/staf).
            Proyek yang ditugaskan akan muncul di ruang input progres ASN
            (<code>/asn/project</code>) bagi pengguna yang berwenang.
          </p>
        </div>
        <Button variant="outline" onClick={() => void loadProjects()} disabled={loading}>
          Muat ulang
        </Button>
      </header>

      {error ? (
        <p role="alert" className="border-destructive/40 text-destructive rounded-md border p-3 text-sm">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="border-primary/30 bg-primary/5 rounded-md border p-3 text-sm">
          {notice}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {editingId ? <Pencil className="size-4" /> : <Plus className="size-4" />}
            {editingId ? "Ubah Proyek" : "Tambah Proyek"}
          </CardTitle>
          <CardDescription>
            {editingId
              ? "Perbarui data proyek dan penanggung jawab."
              : "Isi data proyek dan pilih penanggung jawab yang akan menginput progres."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Label className="space-y-1.5 text-sm font-medium lg:col-span-2">
            Penanggung jawab (operator)
            <Select
              value={form.assignedUserId}
              onChange={(e) => handleChange("assignedUserId", e.target.value)}
              disabled={loading}
              className="w-full"
              options={userOptions}
              placeholder="Pilih pengguna penanggung jawab"
            />
          </Label>
          <Label className="space-y-1.5 text-sm font-medium">
            ID Proyek Eksternal
            <Input value={form.externalProjectId} onChange={(e) => handleChange("externalProjectId", e.target.value)} placeholder="PROJ-2026-001" disabled={loading} />
          </Label>
          <Label className="space-y-1.5 text-sm font-medium sm:col-span-2 lg:col-span-3">
            Nama Paket
            <Input value={form.packageName} onChange={(e) => handleChange("packageName", e.target.value)} placeholder="Nama paket pekerjaan" disabled={loading} />
          </Label>
          <Label className="space-y-1.5 text-sm font-medium">
            Lokasi
            <Input value={form.location} onChange={(e) => handleChange("location", e.target.value)} placeholder="Kota/Kabupaten" disabled={loading} />
          </Label>
          <Label className="space-y-1.5 text-sm font-medium">
            Sektor
            <Input value={form.sector} onChange={(e) => handleChange("sector", e.target.value)} placeholder="infrastruktur / pendidikan / ..." disabled={loading} />
          </Label>
          <Label className="space-y-1.5 text-sm font-medium">
            Penyedia
            <Input value={form.providerName} onChange={(e) => handleChange("providerName", e.target.value)} placeholder="Nama penyedia" disabled={loading} />
          </Label>
          <Label className="space-y-1.5 text-sm font-medium">
            Nilai Kontrak (Rp)
            <Input type="number" min={0} value={form.contractValue} onChange={(e) => handleChange("contractValue", e.target.value)} disabled={loading} />
          </Label>
          <Label className="space-y-1.5 text-sm font-medium">
            Tahun Anggaran
            <Input type="number" min={2000} max={2100} value={form.fiscalYear} onChange={(e) => handleChange("fiscalYear", e.target.value)} disabled={loading} />
          </Label>
          <Label className="space-y-1.5 text-sm font-medium">
            Status
            <Select value={form.status} onChange={(e) => handleChange("status", e.target.value)} disabled={loading} className="w-full" options={STATUS_OPTIONS} />
          </Label>
          <Label className="space-y-1.5 text-sm font-medium">
            Tanggal Mulai
            <Input type="date" value={form.startDate} onChange={(e) => handleChange("startDate", e.target.value)} disabled={loading} />
          </Label>
          <Label className="space-y-1.5 text-sm font-medium">
            Tanggal Selesai
            <Input type="date" value={form.endDate} onChange={(e) => handleChange("endDate", e.target.value)} disabled={loading} />
          </Label>
          <Label className="space-y-1.5 text-sm font-medium">
            Progres Fisik Awal (%)
            <Input type="number" min={0} max={100} step="0.01" value={form.initialPhysicalProgress} onChange={(e) => handleChange("initialPhysicalProgress", e.target.value)} disabled={loading} />
          </Label>
          <Label className="space-y-1.5 text-sm font-medium">
            Progres Keuangan Awal (%)
            <Input type="number" min={0} max={100} step="0.01" value={form.initialFinancialProgress} onChange={(e) => handleChange("initialFinancialProgress", e.target.value)} disabled={loading} />
          </Label>
          <div className="flex items-end gap-2 lg:col-span-3">
            <Button onClick={() => void submit()} disabled={loading}>
              {loading ? "Menyimpan…" : editingId ? "Simpan Perubahan" : "Tambah Proyek"}
            </Button>
            {editingId ? (
              <Button variant="outline" onClick={cancelEdit} disabled={loading}>
                <X className="mr-1 size-4" /> Batal
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Proyek</CardTitle>
          <CardDescription>{projects.length} proyek dalam tenant ini.</CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              Belum ada proyek. Tambahkan proyek dan tetapkan penanggung jawab agar
              operator ASN dapat menginput progres.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b">
                    <th className="p-3">Proyek</th>
                    <th className="p-3">Penanggung Jawab</th>
                    <th className="p-3">Tahun</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Laporan</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => (
                    <tr key={p.id} className="border-b align-top">
                      <td className="p-3">
                        <p className="font-medium">{p.packageName}</p>
                        <p className="text-muted-foreground text-xs">
                          {p.externalProjectId} · {p.location} · {p.sector}
                        </p>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <User className="text-muted-foreground size-4" />
                          <div>
                            <p className="font-medium">{p.assignedUserEmail}</p>
                            <p className="text-muted-foreground text-xs">{p.assignedUserName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">{p.fiscalYear}</td>
                      <td className="p-3">{p.status}</td>
                      <td className="p-3">{p.reportCount}</td>
                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => startEdit(p)} disabled={loading || busyId === p.id}>
                            <Pencil className="size-4" aria-hidden="true" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => void remove(p)} disabled={busyId === p.id || loading}>
                            {busyId === p.id ? "…" : <Trash2 className="size-4" aria-hidden="true" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
