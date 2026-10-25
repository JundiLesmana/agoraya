import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SummaryCardProps {
  label: string;
  value: number | string;
  subLabel: string;
  Icon: LucideIcon;
  iconClass: string;
  ariaLabel: string;
}

export function SummaryCard({
  label,
  value,
  subLabel,
  Icon,
  iconClass,
  ariaLabel,
}: SummaryCardProps) {
  return (
    <Card className="rounded-xl border bg-card p-5 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <div className={cn('flex size-9 items-center justify-center rounded-lg', iconClass)}>
          <Icon aria-hidden="true" className="size-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground" aria-label={ariaLabel}>
          {value}
        </div>
        <CardDescription className="mt-1">{subLabel}</CardDescription>
      </CardContent>
    </Card>
  );
}