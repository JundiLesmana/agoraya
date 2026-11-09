import { redirect } from "next/navigation";

export default function LegacyKycCitizenListPage() {
  redirect("/admin/kyc/citizen");
}