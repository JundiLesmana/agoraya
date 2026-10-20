'use client';

import * as React from 'react';
import { Database, FlaskConical, ShieldCheck, Users, BarChart3, type LucideIcon } from 'lucide-react';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Data-source labels used across Agoraya. The distinction between real
 * government data (BPS_API) and simulated/unverified data is required
 * by the platform's provenance rules.
 */
export type DataSourceLabel =
  | 'BPS_API'
  | 'SIMULATED'
  | 'CITIZEN_UNVERIFIED'
  | 'REVIEWER_VERIFIED'
  | 'AGGREGATED';

interface SourceBadgeMeta {
  defaultLabel: string;
  description: string;
  icon: LucideIcon;
  className: string;
}

/** Central registry so badges stay consistent everywhere sources are shown. */
export const SOURCE_BADGE_META: Record<DataSourceLabel, SourceBadgeMeta> = {
  BPS_API: {
    defaultLabel: 'BPS API',
    description: 'Data resmi dari Badan Pusat Statistik (BPS) melalui API publik.',
    icon: Database,
    className:
      'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300',
  },
  SIMULATED: {
    defaultLabel: 'Data Simulasi',
    description: 'Data simulasi/demonstrasi — bukan data operasional.',
    icon: FlaskConical,
    className:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
  },
  CITIZEN_UNVERIFIED: {
    defaultLabel: 'Laporan Warga',
    description: 'Laporan warga yang belum diverifikasi oleh reviewer.',
    icon: Users,
    className:
      'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300',
  },
  REVIEWER_VERIFIED: {
    defaultLabel: 'Terverifikasi',
    description: 'Data yang telah diverifikasi oleh reviewer.',
    icon: ShieldCheck,
    className:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
  },
  AGGREGATED: {
    defaultLabel: 'Agregasi',
    description: 'Agregasi dari berbagai sumber data publik.',
    icon: BarChart3,
    className:
      'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300',
  },
};

export interface SourceBadgeProps extends Omit<BadgeProps, 'variant'> {
  source: DataSourceLabel;
  /** Override the default label text. */
  label?: string;
  /** Render the source icon (default true). */
  withIcon?: boolean;
}

/**
 * Badge for data-source attribution. Colors and labels come from the
 * central registry so real vs simulated data is always visually
 * distinguishable.
 */
export function SourceBadge({
  source,
  label,
  withIcon = true,
  className,
  ...rest
}: SourceBadgeProps) {
  const meta = SOURCE_BADGE_META[source];
  const Icon = meta.icon;

  return (
    <Badge
      variant="outline"
      data-source={source}
      title={meta.description}
      className={cn('gap-1.5 font-medium', meta.className, className)}
      {...rest}
    >
      {withIcon ? <Icon aria-hidden="true" className="size-3.5" /> : null}
      <span>{label ?? meta.defaultLabel}</span>
    </Badge>
  );
}