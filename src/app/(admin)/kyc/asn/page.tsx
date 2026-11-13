import { redirect } from "next/navigation";

export default function LegacyKycAsnListPage() {
  redirect("/admin/kyc/asn");
}