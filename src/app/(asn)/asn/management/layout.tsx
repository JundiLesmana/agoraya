import { ManagementNavigation } from "./management-navigation";

export default function AsnManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50/50 dark:bg-slate-950/20 lg:flex">
      <aside className="border-b bg-background lg:w-60 lg:shrink-0 lg:border-r lg:border-b-0">
        <div className="p-4 lg:sticky lg:top-0">
          <p className="text-muted-foreground px-3 pb-3 text-xs font-semibold tracking-wide uppercase">
            Layanan Publik
          </p>
          <ManagementNavigation />
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}