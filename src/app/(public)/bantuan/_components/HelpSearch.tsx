import { Search } from "lucide-react";

type HelpSearchProps = {
  compact?: boolean;
};

export function HelpSearch({ compact = false }: HelpSearchProps) {
  return (
    <form
      action="/bantuan/cari"
      role="search"
      className={`flex h-10 items-center rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 ${
        compact ? "w-full max-w-[280px]" : "w-full"
      }`}
    >
      <Search className="ml-3 h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
      <label className="sr-only" htmlFor={compact ? "help-search-compact" : "help-search"}>
        Cari panduan
      </label>
      <input
        id={compact ? "help-search-compact" : "help-search"}
        name="q"
        type="search"
        className="h-full min-w-0 flex-1 border-0 bg-transparent px-2.5 text-sm text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-500 dark:text-slate-400"
        placeholder="Cari panduan, topik, atau kendala..."
      />
      <button
        className="h-full shrink-0 px-3 text-sm font-medium text-blue-800 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700"
        type="submit"
      >
        Cari
      </button>
    </form>
  );
}
