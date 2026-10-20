import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge conditional class names and deduplicate conflicting Tailwind
 * utilities. Wraps `clsx` + `tailwind-merge`; the last conflicting
 * utility wins.
 *
 * @example
 * cn('px-2 py-1', 'px-4') // 'py-1 px-4'
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}