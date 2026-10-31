"use client";

import { motion } from "motion/react";

export default function Loading() {
  return (
    <main
      aria-live="polite"
      aria-busy="true"
      className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12 dark:bg-slate-950"
    >
      <div className="w-full max-w-xl space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <motion.div
            className="h-4 w-4 rounded-full bg-blue-600"
            animate={{ scale: [1, 1.4, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="h-2.5 w-32 rounded-full bg-slate-200 dark:bg-slate-700"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 128, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        <motion.div
          className="space-y-3"
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
        >
          <div className="h-7 w-2/3 rounded-lg bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-full rounded-md bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-5/6 rounded-md bg-slate-200 dark:bg-slate-700" />
        </motion.div>

        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <motion.div
              key={index}
              className="h-20 rounded-xl bg-slate-200 dark:bg-slate-700"
              animate={{ opacity: [0.45, 1, 0.45] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: index * 0.12 }}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
