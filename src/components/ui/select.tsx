import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.ComponentProps<'select'> {
  /** Options rendered as `<option>` elements. */
  options: readonly SelectOption[];
  /** Optional placeholder rendered as a disabled empty-value option. */
  placeholder?: string;
}

/**
 * Base single-select control built on the native `<select>` element
 * (keyboard accessible and screen-reader friendly). Uncontrolled by
 * default; use `value` + `onChange` for controlled usage.
 */
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, placeholder, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'flex h-9 w-full appearance-none rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className,
      )}
      {...props}
    >
      {placeholder ? (
        <option value="" disabled>
          {placeholder}
        </option>
      ) : null}
      {options.map((option) => (
        <option key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </select>
  ),
);
Select.displayName = 'Select';

export { Select };