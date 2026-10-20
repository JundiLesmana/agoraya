'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { Select, type SelectProps } from '@/components/ui/select';
import { useFormFieldContext } from './form-field';
import { cn } from '@/lib/utils';

export interface FormSelectProps extends Omit<SelectProps, 'name'> {}

/**
 * Select registered with the enclosing `<FormField>`. Surfaces
 * validation state via `aria-invalid`/`aria-describedby` and styling.
 */
export function FormSelect({ className, ...props }: FormSelectProps) {
  const { register, getFieldState } = useFormContext();
  const field = useFormFieldContext();
  const hasError = Boolean(getFieldState(field.name).error);

  return (
    <Select
      id={field.controlId}
      aria-invalid={hasError || undefined}
      aria-describedby={hasError ? field.errorId : field.hintId || undefined}
      className={cn(hasError && 'border-destructive focus-visible:ring-destructive', className)}
      {...props}
      {...register(field.name)}
    />
  );
}