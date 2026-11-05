import { CMS_PAGE_CATALOG } from "@/lib/cms-page-catalog";
import type { ModuleAccessKey } from "@/modules/rbac/module-access";

export interface AsnAccessModule {
  readonly key: ModuleAccessKey;
  readonly label: string;
  readonly group: "CMS & KYC";
  readonly page: string;
}

export const ASN_ACCESS_MODULES: readonly AsnAccessModule[] = [
  ...CMS_PAGE_CATALOG.map((page) => ({
    key: page.moduleKey,
    label: page.title,
    group: "CMS & KYC" as const,
    page: page.href,
  })),
  {
    key: "kyc",
    label: "Verifikasi akun ASN",
    group: "CMS & KYC",
    page: "/admin/kyc/asn/[id]",
  },
] as const;
