"use client";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  ClipboardCheck,
  FileCheck2,
  Fingerprint,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { ASN_ACCESS_MODULES } from "@/modules/asn/access-catalog";

const PAGE_SIZE = 7;

const roleSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
});

const requirementSchema = z.object({
  key: z.string().min(1),
  status: z.string().min(1),
  completedAt: z.string().nullable().optional(),
});

const asnRecordSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  emailMasked: z.string(),
  nipMasked: z.string().nullable(),
  opd: z.string().nullable(),
  unit: z.string().nullable(),
  position: z.string().nullable(),
  accountStatus: z.enum(["active", "inactive", "suspended"]),
  applicationRoles: z.array(roleSchema),
  modules: z.array(z.string()),
  executiveStatus: z.enum(["observer", "not_granted"]),
});

const directoryResponseSchema = z.object({
  data: z.array(asnRecordSchema),
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
});

const accessOptionsSchema = z.object({
  data: z.object({
    applicationRoles: z.array(roleSchema),
    modules: z.array(
      z.object({
        key: z.string(),
        label: z.string(),
        group: z.enum(["CMS & KYC", "Layanan"]),
        page: z.string(),
      }),
    ),
  }),
});

const accessSummarySchema = z.object({
  data: z.object({
    total: z.number().int().nonnegative(),
    activeAndVerified: z.number().int().nonnegative(),
    executiveAccess: z.number().int().nonnegative(),
    requirementsIncomplete: z.number().int().nonnegative(),
  }),
});

const requirementsResponseSchema = z.object({
  data: z.object({
    userId: z.string().uuid(),
    accountStatus: z.enum(["active", "inactive", "suspended"]),
    requirements: z.array(requirementSchema),
  }),
});

const detailResponseSchema = z.object({
  data: asnRecordSchema.extend({ requirements: z.array(requirementSchema) }),
});

const accessChangeSchema = z.object({
  accountStatus: z.enum(["active", "inactive", "suspended"]),
  applicationRoles: z.array(roleSchema),
  modules: z.array(z.string()),
  executiveStatus: z.enum(["observer", "not_granted"]),
});

const draftResponseSchema = z.object({
  data: z.object({
    after: accessChangeSchema,
    draftToken: z.string().min(1),
    expiresAt: z.string(),
  }),
});

const previewResponseSchema = z.object({
  data: z.object({
    current: accessChangeSchema,
    draft: accessChangeSchema,
    expiresAt: z.string(),
  }),
});

const confirmResponseSchema = z.object({
  data: z.unknown(),
});

type AsnRecord = z.infer<typeof asnRecordSchema>;
type Requirement = z.infer<typeof requirementSchema>;
type AccessChange = z.infer<typeof accessChangeSchema>;
type DirectoryResponse = z.infer<typeof directoryResponseSchema>;
type AccessFilters = {
  q: string;
  opd: string;
  position: string;
  accountStatus: string;
  applicationRole: string;
  module: string;
  offset?: number;
};
type ModalState =
  | { kind: "manage"; person: AsnRecord }
  | { kind: "requirements"; person: AsnRecord }
  | null;

const REQUIREMENT_LABELS: Record<string, string> = {
  email_verification: "Verifikasi email",
  identity_verification: "Verifikasi identitas",
  admin_approval: "Persetujuan admin",
};

const EMPTY_FILTERS: AccessFilters = {
  q: "",
  opd: "",
  position: "",
  accountStatus: "",
  applicationRole: "",
  module: "",
};

async function requestJson<T>(
  input: RequestInfo | URL,
  init: RequestInit,
  schema: z.ZodType<T>,
): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    let message: string | null = null;
    try {
      const body: unknown = await response.json();
      const parsed = z
        .object({
          message: z.string().optional(),
          error: z.string().optional(),
        })
        .safeParse(body);
      if (parsed.success) message = parsed.data.message ?? parsed.data.error ?? null;
    } catch {
      message = null;
    }

    if (response.status === 401) {
      throw new Error("Sesi Anda berakhir. Silakan masuk kembali.");
    }
    if (response.status === 403) {
      throw new Error(
        "Akses ditolak. Direktori dan endpoint akses ASN hanya dapat digunakan oleh Superadmin.",
      );
    }
    throw new Error(message ?? `Permintaan gagal (${response.status}).`);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("Respons server tidak dapat dibaca.");
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new Error("Respons server tidak sesuai dengan format akses ASN.");
  }
  return parsed.data;
}

function moduleLabel(key: string): string {
  return ASN_ACCESS_MODULES.find((module) => module.key === key)?.label ?? key;
}

function accountStatusLabel(status: AsnRecord["accountStatus"]): string {
  if (status === "active") return "Aktif";
  if (status === "suspended") return "Ditangguhkan";
  return "Belum aktif";
}

function requirementStatusLabel(status: string): string {
  if (status === "fulfilled" || status === "verified") return "Terpenuhi";
  if (status === "rejected") return "Ditolak";
  if (status === "not_submitted") return "Belum diajukan";
  return "Menunggu";
}

function requirementIsComplete(status: string): boolean {
  return status === "fulfilled" || status === "verified";
}

function MetricCard({
  label,
  value,
  detail,
  icon,
  tone,
}: {
  label: string;
  value: number;
  detail: string;
  icon: React.ReactNode;
  tone: "blue" | "green" | "indigo" | "amber";
}) {
  const iconTone =
    tone === "blue"
      ? "bg-blue-50 text-blue-600"
      : tone === "green"
        ? "bg-emerald-50 text-emerald-600"
        : tone === "indigo"
          ? "bg-indigo-50 text-indigo-600"
          : "bg-amber-50 text-amber-600";

  return (
    <article className="min-w-0 rounded-lg border border-slate-200 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium leading-4 text-slate-500">{label}</p>
          <p className="mt-1 text-[25px] font-semibold leading-7 tracking-tight text-slate-800">
            {value}
          </p>
        </div>
        <span className={`grid size-8 shrink-0 place-items-center rounded-md ${iconTone}`}>
          {icon}
        </span>
      </div>
      <p className="mt-2 text-[10px] leading-4 text-slate-500">{detail}</p>
    </article>
  );
}

function StatusPill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "green" | "gray" | "blue" | "amber" | "red";
}) {
  const toneClass =
    tone === "green"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : tone === "gray"
        ? "bg-slate-100 text-slate-600 ring-slate-200"
        : tone === "blue"
          ? "bg-blue-50 text-blue-700 ring-blue-100"
          : tone === "amber"
            ? "bg-amber-50 text-amber-700 ring-amber-100"
            : "bg-rose-50 text-rose-700 ring-rose-100";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold leading-none ring-1 ring-inset ${toneClass}`}
    >
      {children}
    </span>
  );
}

function RequirementList({ requirements }: { requirements: Requirement[] }) {
  return (
    <ul className="divide-y divide-slate-100">
      {requirements.map((requirement) => {
        const complete = requirementIsComplete(requirement.status);
        const rejected = requirement.status === "rejected";
        const Icon = rejected ? AlertCircle : complete ? CheckCircle2 : CircleHelp;
        const iconTone = rejected
          ? "text-rose-600"
          : complete
            ? "text-emerald-600"
            : "text-amber-600";
        return (
          <li
            key={requirement.key}
            className="flex items-center justify-between gap-3 py-3"
          >
            <span className="flex min-w-0 items-center gap-2.5 text-sm text-slate-700">
              <Icon aria-hidden="true" className={`size-4 shrink-0 ${iconTone}`} />
              {Object.entries(REQUIREMENT_LABELS).find(
                ([key]) => key === requirement.key,
              )?.[1] ?? requirement.key}
            </span>
            <StatusPill tone={rejected ? "red" : complete ? "green" : "amber"}>
              {requirementStatusLabel(requirement.status)}
            </StatusPill>
          </li>
        );
      })}
    </ul>
  );
}

function AccessStateSummary({
  title,
  state,
}: {
  title: string;
  state: AccessChange;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-3.5">
      <h3 className="text-xs font-semibold text-slate-700">{title}</h3>
      <p className="mt-2 text-[11px] text-slate-500">Peran aplikasi</p>
      <p className="mt-1 text-xs leading-5 text-slate-700">
        {state.applicationRoles.map((role) => role.name).join(", ") || "Tidak ada peran"}
      </p>
      <p className="mt-2 text-[11px] text-slate-500">Modul</p>
      <p className="mt-1 text-xs leading-5 text-slate-700">
        {state.modules.map(moduleLabel).join(", ") || "Tidak ada modul"}
      </p>
      <p className="mt-2 text-[11px] text-slate-500">Akses Executive</p>
      <p className="mt-1 text-xs text-slate-700">
        {state.executiveStatus === "observer" ? "Pengamat" : "Tidak diberikan"}
      </p>
    </section>
  );
}

export function AsnAccessDirectory() {
  const [filters, setFilters] = useState<AccessFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<AccessFilters>(EMPTY_FILTERS);
  const [directory, setDirectory] = useState<DirectoryResponse | null>(null);
  const [summary, setSummary] = useState<
    z.infer<typeof accessSummarySchema>["data"] | null
  >(null);
  const [applicationRoles, setApplicationRoles] = useState<
    z.infer<typeof roleSchema>[]
  >([]);
  const [modules, setModules] = useState<
    z.infer<typeof accessOptionsSchema>["data"]["modules"]
  >([...ASN_ACCESS_MODULES]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [modal, setModal] = useState<ModalState>(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [requirements, setRequirements] = useState<Requirement[] | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [selectedExecutiveStatus, setSelectedExecutiveStatus] =
    useState<"observer" | "not_granted">("not_granted");
  const [preview, setPreview] = useState<{
    token: string;
    current: AccessChange;
    draft: AccessChange;
    expiresAt: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const directoryRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<{
    name: string;
    email: string;
    roles: string[];
  } | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const res = await fetch("/api/v1/user/me", { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setProfile(null);
          return;
        }
        throw new Error(`Gagal memuat profil (${res.status}).`);
      }
    const payload = await res.json();
    const data = payload?.data as
      | { name: string; email: string; roles: string[] }
      | undefined;
    if (
      data &&
      typeof data.name === "string" &&
      typeof data.email === "string" &&
      Array.isArray(data.roles)
    ) {
      setProfile(data);
    }
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : "Gagal memuat profil pengguna.",
      );
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const loadDirectory = useCallback(async () => {
    setLoading(true);
    setError(null);
    const query = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(appliedFilters.offset ?? 0),
    });
    for (const [key, value] of Object.entries(appliedFilters)) {
      if (key !== "offset" && typeof value === "string" && value.trim()) {
        query.set(key, value.trim());
      }
    }
    try {
      const [result, options, accessSummary] = await Promise.all([
        requestJson(
          `/api/v1/asn/access?${query.toString()}`,
          { cache: "no-store" },
          directoryResponseSchema,
        ),
        requestJson(
          "/api/v1/asn/access/options",
          { cache: "no-store" },
          accessOptionsSchema,
        ),
        requestJson(
          "/api/v1/asn/access/summary",
          { cache: "no-store" },
          accessSummarySchema,
        ),
      ]);
      setDirectory(result);
      setApplicationRoles(options.data.applicationRoles);
      setModules(options.data.modules);
      setSummary(accessSummary.data);
    } catch (loadError) {
      setDirectory(null);
      setSummary(null);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Direktori ASN tidak dapat dimuat.",
      );
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    void loadDirectory();
  }, [loadDirectory, refreshVersion]);

  const records = useMemo(() => directory?.data ?? [], [directory]);
  const roleOptions = useMemo(
    () => applicationRoles.map((role) => [role.key, role.name] as const),
    [applicationRoles],
  );
  const manageRoleOptions = useMemo(() => {
    if (modal?.kind !== "manage") return [];
    return [
      ...new Map(
        [
          ...roleOptions,
          ...modal.person.applicationRoles.map(
            (role) => [role.key, role.name] as const,
          ),
        ].map(([key, name]) => [key, name] as const),
      ).entries(),
    ];
  }, [modal, roleOptions]);

  const currentPage = directory
    ? Math.floor(directory.offset / PAGE_SIZE) + 1
    : 1;
  const pageCount = directory ? Math.max(1, Math.ceil(directory.total / PAGE_SIZE)) : 1;
  const firstItem = directory && directory.total > 0 ? directory.offset + 1 : 0;
  const lastItem = directory
    ? Math.min(directory.offset + records.length, directory.total)
    : 0;

  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setAppliedFilters({ ...filters, offset: 0 });
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters({ ...EMPTY_FILTERS, offset: 0 });
  }

  function updateFilter<K extends keyof AccessFilters>(
    key: K,
    value: AccessFilters[K],
  ) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function updateApplicationFilter(value: string) {
    if (value.startsWith("module:")) {
      setFilters((current) => ({
        ...current,
        applicationRole: "",
        module: value.slice("module:".length),
      }));
      return;
    }
    setFilters((current) => ({
      ...current,
      applicationRole: value.startsWith("role:")
        ? value.slice("role:".length)
        : "",
      module: "",
    }));
  }

  function showNextExecutiveCandidate() {
    setNotice(
      "Pilih ASN dari direktori untuk meninjau atau memberikan akses Executive.",
    );
    directoryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    searchRef.current?.focus({ preventScroll: true });
  }

  async function openPersonModal(person: AsnRecord, kind: "manage" | "requirements") {
    setModal({ kind, person });
    setDialogLoading(true);
    setDialogError(null);
    setRequirements(null);
    setPreview(null);
    setNotice(null);
    try {
      if (kind === "manage") {
        const result = await requestJson(
          `/api/v1/asn/${person.id}/access-detail`,
          { cache: "no-store" },
          detailResponseSchema,
        );
        setSelectedRoles(result.data.applicationRoles.map((role) => role.key));
        setSelectedModules([...result.data.modules]);
        setSelectedExecutiveStatus(result.data.executiveStatus);
        setRequirements(result.data.requirements);
      } else {
        const result = await requestJson(
          `/api/v1/asn/${person.id}/requirements`,
          { cache: "no-store" },
          requirementsResponseSchema,
        );
        setRequirements(result.data.requirements);
      }
    } catch (requestError) {
      setDialogError(
        requestError instanceof Error
          ? requestError.message
          : "Informasi akses ASN tidak dapat dimuat.",
      );
    } finally {
      setDialogLoading(false);
    }
  }

  function closeModal() {
    if (saving) return;
    setModal(null);
    setPreview(null);
    setDialogError(null);
  }

  async function createPreview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!modal || modal.kind !== "manage") return;
    setSaving(true);
    setDialogError(null);
    setPreview(null);
    try {
      const draftResult = await requestJson(
        `/api/v1/asn/${modal.person.id}/executive-access/draft`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            applicationRoles: selectedRoles,
            modules: selectedModules,
            executiveStatus: selectedExecutiveStatus,
          }),
        },
        draftResponseSchema,
      );
      const token = draftResult.data.draftToken;
      const previewResult = await requestJson(
        `/api/v1/asn/${modal.person.id}/access-preview?${new URLSearchParams({
          draftToken: token,
        }).toString()}`,
        { cache: "no-store" },
        previewResponseSchema,
      );
      setPreview({
        token,
        current: previewResult.data.current,
        draft: previewResult.data.draft,
        expiresAt: previewResult.data.expiresAt,
      });
    } catch (requestError) {
      setDialogError(
        requestError instanceof Error
          ? requestError.message
          : "Pratinjau perubahan akses tidak dapat dibuat.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function confirmAccess() {
    if (!modal || modal.kind !== "manage" || !preview) return;
    setSaving(true);
    setDialogError(null);
    try {
      await requestJson(
        `/api/v1/asn/${modal.person.id}/executive-access/confirm`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ draftToken: preview.token }),
        },
        confirmResponseSchema,
      );
      setNotice(`Perubahan akses untuk ${modal.person.name} berhasil disimpan.`);
      setModal(null);
      setPreview(null);
      setRefreshVersion((version) => version + 1);
    } catch (requestError) {
      setDialogError(
        requestError instanceof Error
          ? requestError.message
          : "Perubahan akses tidak dapat disimpan.",
      );
    } finally {
      setSaving(false);
    }
  }

  function setRoleChecked(role: string, checked: boolean) {
    setSelectedRoles((current) =>
      checked
        ? [...new Set([...current, role])]
        : current.filter((value) => value !== role),
    );
  }

  function setModuleChecked(module: string, checked: boolean) {
    setSelectedModules((current) =>
      checked
        ? [...new Set([...current, module])]
        : current.filter((value) => value !== module),
    );
  }

  return (
    <div className="min-h-screen bg-[#f7faff] text-slate-800">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[224px] flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-[68px] items-center gap-2.5 border-b border-slate-100 px-5">
          <img
            src="/logo/brand.svg"
            alt="Agoraya"
            className="size-[34px] object-contain"
            loading="eager"
          />
          <span className="leading-tight">
            <span className="block text-[15px] font-bold tracking-tight text-slate-800">
              Agoraya
            </span>
            <span className="block text-[9px] font-medium tracking-wide text-slate-400">
              Data Publik, Untuk Semua
            </span>
          </span>
        </div>

        <div className="mx-3 mt-4 rounded-md bg-blue-50 px-3 py-2.5">
          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Ruang Executive
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-700">
            Pemerintah Kota Contoh
          </p>
          <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-semibold text-blue-700">
            <LockKeyhole aria-hidden="true" className="size-2.5" />
            Superadmin
          </div>
        </div>

        <nav aria-label="Navigasi ruang kerja" className="mt-5 px-3">
          <p className="mb-2 px-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Tata kelola
          </p>
          <a
            href="#direktori-asn"
            className="flex items-center gap-2.5 rounded-md bg-blue-600 px-2.5 py-2 text-[11px] font-semibold text-white shadow-sm shadow-blue-100"
          >
            <Shield aria-hidden="true" className="size-3.5" />
            Kontrol akses ASN
          </a>
          <a
            href="/executive/audit"
            className="mt-1 flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[11px] font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800"
          >
            <ClipboardCheck aria-hidden="true" className="size-3.5" />
            Audit log terpadu
          </a>
          <a
            href="/executive/asn-performance"
            className="mt-1 flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[11px] font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800"
          >
            <LayoutDashboard aria-hidden="true" className="size-3.5" />
            Kinerja ASN
          </a>
        </nav>

        <div className="mx-3 mt-auto mb-4 rounded-md border border-slate-100 bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-700">
            <LockKeyhole aria-hidden="true" className="size-3.5 text-blue-600" />
            Akses berprinsip minimum
          </div>
          <p className="mt-1.5 text-[9px] leading-4 text-slate-500">
            Berikan hanya akses yang diperlukan dan tinjau perubahan sebelum disimpan.
          </p>
        </div>
        {/* Profile Card Footer */}
        <div className="border-t border-slate-100 p-3 flex items-center gap-3">
          {profileLoading ? (
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 animate-pulse">
              …
            </div>
          ) : profileError || !profile ? (
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
              ?
            </div>
          ) : (
            <>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-800">
                  {profile.name}
                </p>
                <p className="truncate text-[10px] text-slate-400">
                  {profile.roles.join(" · ")} · Pemerintah Kota Contoh
                </p>
              </div>
            </>
          )}
        </div>
      </aside>

      <div className="lg:pl-[224px]">
        <header className="sticky top-0 z-20 flex h-[58px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-sm sm:px-6 lg:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label={mobileMenuOpen ? "Tutup navigasi" : "Buka navigasi"}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="grid size-8 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600 lg:hidden"
            >
              <Menu aria-hidden="true" className="size-4" />
            </button>
            <p className="truncate text-[10px] font-medium text-slate-400">
              Tata kelola instansi
              <span className="mx-2 text-slate-300">/</span>
              <span className="font-semibold text-slate-600">Ruang Executive</span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-semibold text-blue-700 sm:inline-flex">
              Area terbatas
            </span>
            <span className="hidden text-[10px] text-slate-400 md:inline">
              Waktu sistem: WIB
            </span>
            <button
              type="button"
              aria-label="Notifikasi"
              className="grid size-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              <Bell aria-hidden="true" className="size-4" />
            </button>
          </div>
          {mobileMenuOpen && (
            <nav
              aria-label="Navigasi mobile"
              className="absolute inset-x-0 top-full border-b border-slate-200 bg-white p-3 shadow-lg lg:hidden"
            >
              <a
                href="#direktori-asn"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-md bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700"
              >
                <Shield aria-hidden="true" className="size-4" />
                Kontrol akses ASN
              </a>
              <a
                href="/executive/audit"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-1 flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <ClipboardCheck aria-hidden="true" className="size-4" />
                Audit log terpadu
              </a>
              <a
                href="/executive/asn-performance"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-1 flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <LayoutDashboard aria-hidden="true" className="size-4" />
                Kinerja ASN
              </a>
            </nav>
          )}
        </header>

        <main className="mx-auto max-w-[1480px] px-4 pb-8 pt-6 sm:px-6 lg:px-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-blue-600">
                Ruang Executive <span className="px-1 text-slate-300">/</span> Kontrol akses ASN
              </p>
              <h1 className="mt-1 text-[23px] font-bold tracking-tight text-slate-800 sm:text-[25px]">
                Kontrol akses ASN
              </h1>
              <p className="mt-1 max-w-2xl text-[11px] leading-5 text-slate-500">
                Kelola kewenangan seluruh ASN terdaftar, dari laman CMS hingga ruang Executive.
              </p>
            </div>
            <button
              type="button"
              onClick={showNextExecutiveCandidate}
              className="inline-flex h-9 w-fit items-center gap-2 rounded-md bg-blue-600 px-3.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <Plus aria-hidden="true" className="size-3.5" />
              Tambahkan akses Executive
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-end gap-x-2 text-[9px] uppercase tracking-[0.08em] text-slate-400">
            <span>Direktori akses ASN</span>
            <span aria-hidden="true">·</span>
            <span>Identitas disamarkan</span>
          </div>

          {error ? (
            <section
              aria-live="polite"
              className="mt-3 flex flex-col gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-4 sm:flex-row sm:items-start"
            >
              <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-rose-600" />
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-rose-800">
                  Direktori akses ASN tidak dapat dimuat
                </h2>
                <p className="mt-1 text-xs leading-5 text-rose-700">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => setRefreshVersion((version) => version + 1)}
                className="inline-flex h-8 items-center justify-center rounded-md border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-700 hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-rose-600"
              >
                Coba lagi
              </button>
            </section>
          ) : (
            <>
              <section
                aria-label="Ringkasan akses ASN"
                className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4"
              >
                <MetricCard
                  label="ASN terdaftar"
                  value={summary?.total ?? 0}
                  detail="Seluruh direktori instansi"
                  icon={<Users aria-hidden="true" className="size-4" />}
                  tone="blue"
                />
                <MetricCard
                  label="Akun aktif terverifikasi"
                  value={summary?.activeAndVerified ?? 0}
                  detail="Status aktif, email dan KYC terverifikasi"
                  icon={<CheckCircle2 aria-hidden="true" className="size-4" />}
                  tone="green"
                />
                <MetricCard
                  label="Akses Executive aktif"
                  value={
                    summary?.executiveAccess ?? 0
                  }
                  detail="Pengamat pada seluruh direktori"
                  icon={<ShieldCheck aria-hidden="true" className="size-4" />}
                  tone="indigo"
                />
                <MetricCard
                  label="Belum dapat diaktifkan"
                  value={
                    summary?.requirementsIncomplete ?? 0
                  }
                  detail="Email, persetujuan, atau identitas belum lengkap"
                  icon={<CircleHelp aria-hidden="true" className="size-4" />}
                  tone="amber"
                />
              </section>

              <div className="mt-3 flex items-start gap-2.5 rounded-md border border-blue-100 bg-blue-50 px-3.5 py-3 text-[10px] leading-4 text-blue-800">
                <CircleHelp aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-blue-600" />
                <p>
                  <span className="font-semibold">Aktivasi akun tidak otomatis memberikan kewenangan.</span>{" "}
                  Akses instansi efektif setelah email terverifikasi dan persyaratan dipenuhi.
                  Hak CMS, KYC, dan Executive tetap diberikan secara terpisah.
                </p>
              </div>

              {notice && (
                <div
                  role="status"
                  className="mt-3 flex items-start justify-between gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800"
                >
                  <span>{notice}</span>
                  <button
                    type="button"
                    aria-label="Tutup pemberitahuan"
                    onClick={() => setNotice(null)}
                    className="text-emerald-700 hover:text-emerald-900"
                  >
                    <X aria-hidden="true" className="size-4" />
                  </button>
                </div>
              )}

              <section
                id="direktori-asn"
                ref={directoryRef}
                aria-labelledby="directory-title"
                className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
              >
                <div className="flex items-center justify-between gap-4 px-4 pb-3 pt-3.5 sm:px-4">
                  <div>
                    <h2 id="directory-title" className="text-sm font-semibold text-slate-800">
                      Direktori ASN
                    </h2>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      Pilih ASN terdaftar untuk meninjau cakupan dan mengubah hak akses.
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-500">
                    {loading ? "Memuat…" : `${records.length} akun`}
                  </span>
                </div>

                <form
                  onSubmit={applyFilters}
                  className="grid gap-x-3 gap-y-2.5 border-b border-slate-100 px-4 pb-3.5 sm:grid-cols-2 lg:grid-cols-6"
                >
                  <label className="min-w-0 sm:col-span-2 lg:col-span-2">
                    <span className="mb-1 block text-[9px] font-medium text-slate-500">
                      Cari ASN
                    </span>
                    <span className="flex h-[33px] items-center gap-2 rounded-md border border-slate-200 px-2.5 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
                      <Search aria-hidden="true" className="size-3.5 shrink-0 text-slate-400" />
                      <input
                        ref={searchRef}
                        aria-label="Cari nama atau NIP"
                        value={filters.q}
                        onChange={(event) => updateFilter("q", event.target.value)}
                        maxLength={255}
                        placeholder="Nama atau NIP"
                        className="min-w-0 flex-1 bg-transparent text-[10px] text-slate-700 outline-none placeholder:text-slate-400"
                      />
                    </span>
                  </label>

                  <label className="min-w-0">
                    <span className="mb-1 block text-[9px] font-medium text-slate-500">
                      Instansi / OPD
                    </span>
                    <input
                      aria-label="Instansi atau OPD"
                      value={filters.opd}
                      onChange={(event) => updateFilter("opd", event.target.value)}
                      maxLength={255}
                      placeholder="Semua OPD"
                      className="h-[33px] w-full rounded-md border border-slate-200 bg-white px-2.5 text-[10px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                  <label className="min-w-0">
                    <span className="mb-1 block text-[9px] font-medium text-slate-500">
                      Jabatan kepegawaian
                    </span>
                    <input
                      aria-label="Jabatan kepegawaian"
                      value={filters.position}
                      onChange={(event) => updateFilter("position", event.target.value)}
                      maxLength={255}
                      placeholder="Semua jabatan"
                      className="h-[33px] w-full rounded-md border border-slate-200 bg-white px-2.5 text-[10px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>

                  <label className="min-w-0">
                    <span className="mb-1 block text-[9px] font-medium text-slate-500">
                      Status akun
                    </span>
                    <span className="relative block">
                      <select
                        aria-label="Status akun"
                        value={filters.accountStatus}
                        onChange={(event) => updateFilter("accountStatus", event.target.value)}
                        className="h-[33px] w-full appearance-none rounded-md border border-slate-200 bg-white px-2.5 pr-7 text-[10px] text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="">Semua status</option>
                        <option value="active">Aktif</option>
                        <option value="inactive">Belum aktif</option>
                        <option value="suspended">Ditangguhkan</option>
                      </select>
                      <ChevronDown
                        aria-hidden="true"
                        className="pointer-events-none absolute right-2 top-2.5 size-3 text-slate-400"
                      />
                    </span>
                  </label>

                  <label className="min-w-0">
                    <span className="mb-1 block text-[9px] font-medium text-slate-500">
                      Peran aplikasi
                    </span>
                    <span className="relative block">
                      <select
                        aria-label="Peran aplikasi"
                        value={
                          filters.applicationRole
                            ? `role:${filters.applicationRole}`
                            : filters.module
                              ? `module:${filters.module}`
                              : ""
                        }
                        onChange={(event) =>
                          updateApplicationFilter(event.target.value)
                        }
                        className="h-[33px] w-full appearance-none rounded-md border border-slate-200 bg-white px-2.5 pr-7 text-[10px] text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="">Semua peran dan laman</option>
                        <optgroup label="Peran aplikasi">
                          {roleOptions.map(([key, name]) => (
                            <option key={`role:${key}`} value={`role:${key}`}>
                              {name}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Laman CMS & KYC · seluruh laman Agoraya">
                          {modules.map((module) => (
                            <option
                              key={`module:${module.key}`}
                              value={`module:${module.key}`}
                            >
                              {module.key === "kyc"
                                ? `KYC · ${module.label}`
                                : `CMS · ${module.label.replace(/^CMS\s*/i, "")}`}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                      <ChevronDown
                        aria-hidden="true"
                        className="pointer-events-none absolute right-2 top-2.5 size-3 text-slate-400"
                      />
                    </span>
                  </label>

                  <label className="min-w-0">
                    <span className="mb-1 block text-[9px] font-medium text-slate-500">
                      Modul yang diberikan
                    </span>
                    <span className="relative block">
                      <select
                        aria-label="Modul yang diberikan"
                        value={filters.module}
                        onChange={(event) => updateFilter("module", event.target.value)}
                        className="h-[33px] w-full appearance-none rounded-md border border-slate-200 bg-white px-2.5 pr-7 text-[10px] text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="">Semua modul</option>
                        {modules.map((module) => (
                          <option key={module.key} value={module.key}>
                            {module.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        aria-hidden="true"
                        className="pointer-events-none absolute right-2 top-2.5 size-3 text-slate-400"
                      />
                    </span>
                  </label>

                  <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex h-[31px] items-center gap-1.5 rounded-md bg-blue-600 px-3 text-[10px] font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                      <Search aria-hidden="true" className="size-3" />
                      Terapkan filter
                    </button>
                    <button
                      type="button"
                      onClick={resetFilters}
                      disabled={loading}
                      className="h-[31px] rounded-md border border-slate-200 bg-white px-3 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                      Atur ulang
                    </button>
                  </div>
                </form>

                {loading ? (
                  <div aria-live="polite" className="space-y-0 divide-y divide-slate-100">
                    <p className="sr-only">Memuat direktori ASN</p>
                    {Array.from({ length: 4 }, (_, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-2 gap-3 px-4 py-4 sm:grid-cols-5"
                      >
                        <span className="h-3 animate-pulse rounded bg-slate-100" />
                        <span className="h-3 animate-pulse rounded bg-slate-100" />
                        <span className="h-3 animate-pulse rounded bg-slate-100" />
                        <span className="h-3 animate-pulse rounded bg-slate-100" />
                        <span className="h-3 animate-pulse rounded bg-slate-100" />
                      </div>
                    ))}
                  </div>
                ) : records.length === 0 ? (
                  <div className="px-4 py-12 text-center">
                    <Users aria-hidden="true" className="mx-auto size-6 text-slate-300" />
                    <h3 className="mt-2 text-sm font-semibold text-slate-700">
                      Tidak ada ASN yang sesuai
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Ubah filter atau atur ulang pencarian untuk melihat direktori.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[1020px] border-collapse text-left">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50/80 text-[9px] font-semibold text-slate-500">
                            <th scope="col" className="px-4 py-2.5">ASN / identitas tersamar</th>
                            <th scope="col" className="px-3 py-2.5">Jabatan / instansi</th>
                            <th scope="col" className="px-3 py-2.5">Peran aplikasi</th>
                            <th scope="col" className="px-3 py-2.5">Modul diberikan</th>
                            <th scope="col" className="px-3 py-2.5">Status akun</th>
                            <th scope="col" className="px-3 py-2.5">Executive</th>
                            <th scope="col" className="px-3 py-2.5 text-right">Tindakan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {records.map((person) => (
                            <tr
                              key={person.id}
                              className="transition-colors hover:bg-blue-50/50"
                            >
                              <td className="px-4 py-3 align-middle">
                                <p className="text-[10px] font-semibold text-slate-800">
                                  {person.name}
                                </p>
                                <p className="mt-0.5 text-[9px] text-slate-400">
                                  {person.emailMasked}
                                </p>
                                <p className="mt-0.5 text-[9px] text-slate-400">
                                  NIP {person.nipMasked ?? "—"}
                                </p>
                              </td>
                              <td className="px-3 py-3 align-middle">
                                <p className="max-w-[180px] text-[10px] font-medium text-slate-700">
                                  {person.position ?? "Jabatan belum tercatat"}
                                </p>
                                <p className="mt-0.5 max-w-[180px] text-[9px] text-slate-400">
                                  {[person.opd, person.unit].filter(Boolean).join(" · ") || "Instansi belum tercatat"}
                                </p>
                              </td>
                              <td className="px-3 py-3 align-middle text-[10px] text-slate-600">
                                {person.applicationRoles.length
                                  ? person.applicationRoles.map((role) => role.name).join(", ")
                                  : "Belum ditetapkan"}
                              </td>
                              <td className="px-3 py-3 align-middle">
                                {person.modules.length ? (
                                  <div className="flex max-w-[170px] flex-wrap gap-1">
                                    {person.modules.map((module) => (
                                      <span
                                        key={module}
                                        className="rounded-sm bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-700"
                                      >
                                        {moduleLabel(module)}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-[9px] text-slate-400">Tidak ada akses efektif</span>
                                )}
                              </td>
                              <td className="px-3 py-3 align-middle">
                                <div className="flex flex-col items-start gap-1">
                                  <StatusPill
                                    tone={
                                      person.accountStatus === "active"
                                        ? "green"
                                        : person.accountStatus === "suspended"
                                          ? "red"
                                          : "amber"
                                    }
                                  >
                                    {accountStatusLabel(person.accountStatus)}
                                  </StatusPill>
                                  {person.accountStatus !== "active" && (
                                    <span className="text-[8px] text-slate-400">
                                      Perlu ditinjau
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-3 align-middle">
                                {person.executiveStatus === "observer" ? (
                                  <StatusPill tone="blue">Pengamat</StatusPill>
                                ) : (
                                  <StatusPill tone="gray">Tidak diberikan</StatusPill>
                                )}
                              </td>
                              <td className="px-3 py-3 align-middle">
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    type="button"
                                    aria-label={`Kelola akses ${person.name}`}
                                    onClick={() => void openPersonModal(person, "manage")}
                                    className="inline-flex h-7 items-center gap-1 rounded-md border border-blue-200 bg-white px-2 text-[9px] font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600"
                                  >
                                    Kelola akses
                                    <ArrowRight aria-hidden="true" className="size-3" />
                                  </button>
                                  <button
                                    type="button"
                                    aria-label={`Lihat syarat ${person.name}`}
                                    onClick={() => void openPersonModal(person, "requirements")}
                                    className="grid size-7 place-items-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-600"
                                    title="Lihat persyaratan aktivasi"
                                  >
                                    <FileCheck2 aria-hidden="true" className="size-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex flex-col justify-between gap-2 border-t border-slate-100 px-4 py-2.5 sm:flex-row sm:items-center">
                      <p className="text-[9px] text-slate-500">
                        Menampilkan {firstItem}–{lastItem} dari {directory?.total ?? 0} ASN · data identitas disamarkan
                      </p>
                      <nav aria-label="Paginasi direktori ASN" className="flex items-center gap-1.5">
                        <button
                          type="button"
                          aria-label="Halaman sebelumnya"
                          disabled={currentPage <= 1 || loading}
                          onClick={() =>
                            setAppliedFilters((current) => ({
                              ...current,
                              offset: Math.max(0, (current.offset ?? 0) - PAGE_SIZE),
                            }))
                          }
                          className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[9px] font-medium text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ArrowLeft aria-hidden="true" className="size-3" />
                          Sebelumnya
                        </button>
                        <span aria-current="page" className="grid size-6 place-items-center rounded-md bg-blue-50 text-[9px] font-semibold text-blue-700">
                          {currentPage}
                        </span>
                        <button
                          type="button"
                          aria-label="Halaman berikutnya"
                          disabled={currentPage >= pageCount || loading}
                          onClick={() =>
                            setAppliedFilters((current) => ({
                              ...current,
                              offset: (current.offset ?? 0) + PAGE_SIZE,
                            }))
                          }
                          className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[9px] font-medium text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Berikutnya
                          <ArrowRight aria-hidden="true" className="size-3" />
                        </button>
                      </nav>
                    </div>
                  </>
                )}
              </section>

              <section aria-label="Informasi pengelolaan akses" className="mt-3 grid gap-2.5 md:grid-cols-2">
                <article className="flex gap-2.5 rounded-md border border-amber-100 bg-amber-50 px-3.5 py-3">
                  <Fingerprint aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-amber-700" />
                  <div>
                    <h2 className="text-[10px] font-semibold text-amber-900">
                      Persyaratan aktivasi ASN
                    </h2>
                    <p className="mt-1 text-[9px] leading-4 text-amber-800">
                      Email terverifikasi, identitas tervalidasi, dan persetujuan admin
                      diperlukan sebelum akses dapat digunakan.
                    </p>
                  </div>
                </article>
                <article className="flex gap-2.5 rounded-md border border-blue-100 bg-blue-50 px-3.5 py-3">
                  <KeyRound aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-blue-700" />
                  <div>
                    <h2 className="text-[10px] font-semibold text-blue-900">
                      Peran dan modul aplikasi
                    </h2>
                    <p className="mt-1 text-[9px] leading-4 text-blue-800">
                      Peran aplikasi dan akses modul menentukan kewenangan sistem yang
                      berbeda; perubahan perlu ditinjau sebelum dikonfirmasi.
                    </p>
                  </div>
                </article>
              </section>
            </>
          )}
        </main>
      </div>

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/35 p-0 sm:items-center sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="access-dialog-title"
            className="max-h-[92vh] w-full max-w-[520px] overflow-y-auto rounded-t-xl bg-white shadow-2xl sm:rounded-xl"
          >
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-blue-600">
                  {modal.kind === "manage" ? "Pengelolaan hak akses" : "Persyaratan aktivasi"}
                </p>
                <h2 id="access-dialog-title" className="mt-1 text-base font-semibold text-slate-800">
                  {modal.kind === "manage" ? "Kelola akses ASN" : "Syarat aktivasi ASN"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">{modal.person.name}</p>
              </div>
              <button
                type="button"
                aria-label="Tutup dialog"
                onClick={closeModal}
                disabled={saving}
                className="grid size-8 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </div>

            {dialogLoading ? (
              <div aria-live="polite" className="space-y-3 px-5 py-6">
                <p className="sr-only">Memuat informasi akses ASN</p>
                <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
                <div className="h-20 animate-pulse rounded-md bg-slate-50" />
                <div className="h-20 animate-pulse rounded-md bg-slate-50" />
              </div>
            ) : dialogError ? (
              <div role="alert" className="m-5 flex gap-2.5 rounded-md border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
                <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <p>{dialogError}</p>
              </div>
            ) : modal.kind === "requirements" ? (
              <div className="px-5 py-4">
                <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2.5">
                  <span className="text-xs font-medium text-slate-600">Status akun</span>
                  <StatusPill
                    tone={modal.person.accountStatus === "active" ? "green" : "amber"}
                  >
                    {accountStatusLabel(modal.person.accountStatus)}
                  </StatusPill>
                </div>
                <h3 className="mt-4 text-xs font-semibold text-slate-700">
                  Syarat yang tercatat
                </h3>
                {requirements ? (
                  <RequirementList requirements={requirements} />
                ) : (
                  <p className="py-4 text-xs text-slate-500">
                    Persyaratan belum tersedia.
                  </p>
                )}
                <p className="mt-3 rounded-md border border-blue-100 bg-blue-50 px-3 py-2.5 text-[10px] leading-4 text-blue-800">
                  Status akun ditampilkan sebagai informasi dan tidak dapat diubah pada alur ini.
                </p>
              </div>
            ) : preview ? (
              <div className="px-5 py-4">
                <div className="flex items-start gap-2.5 rounded-md border border-blue-100 bg-blue-50 px-3 py-2.5 text-[10px] leading-4 text-blue-800">
                  <ClipboardCheck aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                  <p>
                    Tinjau perubahan berikut sebelum menyimpan. Pratinjau ini kedaluwarsa pada{" "}
                    <time dateTime={preview.expiresAt}>
                      {new Date(preview.expiresAt).toLocaleString("id-ID")}
                    </time>
                    .
                  </p>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <AccessStateSummary title="Akses saat ini" state={preview.current} />
                  <AccessStateSummary title="Perubahan yang diajukan" state={preview.draft} />
                </div>
                <p className="mt-3 text-[10px] text-slate-500">
                  Status akun ASN: <span className="font-semibold text-slate-700">{accountStatusLabel(modal.person.accountStatus)}</span>.
                  Status ini tidak diubah oleh konfirmasi akses.
                </p>
                {dialogError && (
                  <p role="alert" className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">
                    {dialogError}
                  </p>
                )}
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setPreview(null)}
                    className="h-8 rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void confirmAccess()}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
                  >
                    <Check aria-hidden="true" className="size-3.5" />
                    {saving ? "Menyimpan…" : "Konfirmasi perubahan"}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={createPreview} className="px-5 py-4">
                {requirements && (
                  <div className="mb-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-semibold text-slate-600">
                        Status akun saat ini
                      </span>
                      <StatusPill
                        tone={modal.person.accountStatus === "active" ? "green" : "amber"}
                      >
                        {accountStatusLabel(modal.person.accountStatus)}
                      </StatusPill>
                    </div>
                    <p className="mt-1 text-[9px] text-slate-500">
                      Status akun hanya informasi; alur perubahan akses tidak mengubahnya.
                    </p>
                  </div>
                )}

                <fieldset className="border-0 p-0">
                  <legend className="text-xs font-semibold text-slate-700">
                    Peran aplikasi
                  </legend>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Peran tersedia dari data direktori yang dimuat.
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {manageRoleOptions.length ? (
                      manageRoleOptions.map(([key, name]) => (
                        <label
                          key={key}
                          className="flex items-center gap-2 rounded-md border border-slate-200 px-2.5 py-2 text-[10px] text-slate-700 hover:border-blue-200"
                        >
                          <input
                            type="checkbox"
                            checked={selectedRoles.includes(key)}
                            onChange={(event) => setRoleChecked(key, event.target.checked)}
                            className="size-3.5 accent-blue-600"
                          />
                          {name}
                        </label>
                      ))
                    ) : (
                      <p className="rounded-md bg-slate-50 px-3 py-2 text-[10px] text-slate-500 sm:col-span-2">
                        Tidak ada peran aplikasi pada data direktori yang dimuat.
                      </p>
                    )}
                  </div>
                </fieldset>

                <fieldset className="mt-4 border-0 p-0">
                  <legend className="text-xs font-semibold text-slate-700">
                    Akses modul
                  </legend>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {modules.map((module) => (
                      <label
                        key={module.key}
                        className="flex items-center gap-2 rounded-md border border-slate-200 px-2.5 py-2 text-[10px] text-slate-700 hover:border-blue-200"
                      >
                        <input
                          type="checkbox"
                          checked={selectedModules.includes(module.key)}
                          onChange={(event) =>
                            setModuleChecked(module.key, event.target.checked)
                          }
                          className="size-3.5 accent-blue-600"
                        />
                        {module.label}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="mt-4 border-0 p-0">
                  <legend className="text-xs font-semibold text-slate-700">
                    Akses Executive
                  </legend>
                  <label className="mt-2 flex items-center gap-2 rounded-md border border-slate-200 px-2.5 py-2 text-[10px] text-slate-700">
                    <input
                      type="checkbox"
                      checked={selectedExecutiveStatus === "observer"}
                      onChange={(event) =>
                        setSelectedExecutiveStatus(
                          event.target.checked ? "observer" : "not_granted",
                        )
                      }
                      className="size-3.5 accent-blue-600"
                    />
                    Pengamat · akses baca ruang Executive
                  </label>
                </fieldset>

                {dialogError && (
                  <p role="alert" className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">
                    {dialogError}
                  </p>
                )}
                <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="h-8 rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving || dialogLoading}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
                  >
                    <ClipboardCheck aria-hidden="true" className="size-3.5" />
                    {saving ? "Menyiapkan…" : "Tinjau perubahan"}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
