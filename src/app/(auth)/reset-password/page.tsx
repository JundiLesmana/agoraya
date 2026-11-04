import { ResetPasswordForm } from "./_components/reset-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const tokenValue = params.token;
  const token = Array.isArray(tokenValue) ? (tokenValue[0] ?? "") : (tokenValue ?? "");
  return <ResetPasswordForm token={token} />;
}
