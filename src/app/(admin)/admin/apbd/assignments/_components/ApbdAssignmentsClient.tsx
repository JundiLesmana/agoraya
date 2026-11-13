"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Trash2, User } from "lucide-react";
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

type UserRow = {
  id: string;
  email: string;
  name: string;
};

type AssignmentRow = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  agencyId: string;
  regionId: string;
  regionName: string;
  sectorId: string;
};

type FormData = {
  userId: string;
  agencyId: string;
  regionId: string;
  regionName: string;
  sectorId: string;
};

function messageFrom(payload: unknown): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }
  return "Permintaan tidak dapat diproses.";
}

export function ApbdAssignmentsClient({
  initialUsers,
  initialAssignments,
}: {
  initialUsers: UserRow[];
  initialAssignments: AssignmentRow[];
}) {
  const [users] = useState<UserRow[]>(initialUsers);
  const [assignments, setAssignments] = useState<AssignmentRow[]>(
    initialAssignments,
  );
  const [form, setForm] = useState<FormData>({
    userId: "",
    agencyId: "",
    regionId: "",
    regionName: "",
    sectorId: "",
  });
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadAssignments = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch("/api/admin/apbd/assignments", {
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(messageFrom(payload));
      setAssignments(payload.assignments ?? []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Daftar penugasan gagal dimuat.",
      );
    }
  }, []);

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  const handleChange = (
    key: keyof FormData,
    value: string,
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const createAssignment = async () => {
    if (
      !form.userId ||
      !form.agencyId ||
      !form.regionId ||
      !form.regionName ||
      !form.sectorId
    ) {
      setError("Semua field wajib diisi.");
      return;
    }
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/apbd/assignments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(messageFrom(payload));
      setNotice("Penugasan APBD berhasil ditambahkan.");
      setForm({
        userId: "",
        agencyId: "",
        regionId: "",
        regionName: "",
        sectorId: "",
      });
      await loadAssignments();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Penugasan gagal ditambahkan.",
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteAssignment = async (row: AssignmentRow) => {
    if (
      !window.confirm(
        `Hapus penugasan APBD untuk ${row.userEmail} (${row.agencyId} / ${row.regionName} / ${row.sectorId})?`,
      )
    ) {
      return;
    }
    setBusyId(row.id);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/apbd/assignments", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId: row.userId,
          agencyId: row.agencyId,
          regionId: row.regionId,
          sectorId: row.sectorId,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(messageFrom(payload));
      setNotice("Penugasan APBD berhasil dihapus.");
      await loadAssignments();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Penugasan gagal dihapus.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const userOptions = useMemo(
    () =>
      users.map((user) => ({
        value: user.id,
        label: `${user.email} (${user.name})`,
      })),
    [users],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-primary text-sm font-medium">
            Pengelolaan APBD
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Penugasan Operator APBD
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Atur instansi, wilayah, dan urusan yang boleh dielola oleh setiap
            operator APBD dalam tenant Anda.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => void loadAssignments()}
          disabled={loading}
        >
          Muat ulang
        </Button>
      </header>

      {error ? (
        <p
          role="alert"
          className="border-destructive/40 text-destructive rounded-md border p-3 text-sm"
        >
          {error}
        </p>
      ) : null}
      {notice ? (
        <p
          role="status"
          className="border-primary/30 bg-primary/5 rounded-md border p-3 text-sm"
        >
          {notice}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Tambah Penugasan Operator</CardTitle>
          <CardDescription>
            Pilih pengguna dan tentukan cakupan akses APBD mereka.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Label className="space-y-1.5 text-sm font-medium">
            Pengguna
            <Select
              value={form.userId}
              onChange={(event) => handleChange("userId", event.target.value)}
              disabled={loading}
              className="w-full"
              options={userOptions}
              placeholder="Pilih pengguna"
            />
          </Label>
          <Label className="space-y-1.5 text-sm font-medium">
            Instansi
            <Input
              value={form.agencyId}
              onChange={(event) =>
                handleChange("agencyId", event.target.value)
              }
              placeholder="Contoh: dinas-pendidikan-kota-contoh"
              disabled={loading}
            />
          </Label>
          <Label className="space-y-1.5 text-sm font-medium">
            Wilayah
            <Input
              value={form.regionId}
              onChange={(event) =>
                handleChange("regionId", event.target.value)
              }
              placeholder="Contoh: kota-contoh"
              disabled={loading}
            />
          </Label>
          <Label className="space-y-1.5 text-sm font-medium">
            Nama Wilayah
            <Input
              value={form.regionName}
              onChange={(event) =>
                handleChange("regionName", event.target.value)
              }
              placeholder="Contoh: Kota Contoh"
              disabled={loading}
            />
          </Label>
          <Label className="space-y-1.5 text-sm font-medium">
            Sektor / Urusan
            <Input
              value={form.sectorId}
              onChange={(event) =>
                handleChange("sectorId", event.target.value)
              }
              placeholder="Contoh: education"
              disabled={loading}
            />
          </Label>
          <div className="lg:col-span-4 flex items-end">
            <Button
              onClick={() => void createAssignment()}
              disabled={loading}
            >
              {loading ? "Menambahkan…" : "Tambah"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Penugasan</CardTitle>
          <CardDescription>
            {assignments.length} penugasan aktif dalam tenant ini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              Belum ada penugasan APBD. Tambahkan penugasan di atas agar
              operator ASN dapat menginput data APBD.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b">
                    <th className="p-3">Pengguna</th>
                    <th className="p-3">Instansi</th>
                    <th className="p-3">Wilayah</th>
                    <th className="p-3">Sektor / Urusan</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b align-middle"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <User className="size-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{row.userEmail}</p>
                            <p className="text-xs text-muted-foreground">
                              {row.userName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">{row.agencyId}</td>
                      <td className="p-3">{row.regionName}</td>
                      <td className="p-3">{row.sectorId}</td>
                      <td className="p-3 text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => void deleteAssignment(row)}
                          disabled={busyId === row.id || loading}
                        >
                          {busyId === row.id ? "Menghapus…" : (
                            <Trash2 className="size-4" aria-hidden="true" />
                          )}
                        </Button>
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
