'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { Textarea, type TextareaProps } from '@/components/ui/textarea';
import { useFormFieldContext } from './form-field';
import { cn } from '@/lib/utils';

export interface FormTextareaProps extends Omit<TextareaProps, 'name'> {}

/**
 * Textarea registered with the enclosing `<FormField>`. Surfaces
 * validation state via `aria-invalid`/`aria-describedby` and styling.
 */
export function FormTextarea({ className, ...props }: FormTextareaProps) {
  const { register, getFieldState } = useFormContext();
  const field = useFormFieldContext();
  const hasError = Boolean(getFieldState(field.name).error);

  return (
    <Textarea
      id={field.controlId}
      aria-invalid={hasError || undefined}
      aria-describedby={hasError ? field.errorId : field.hintId || undefined}
      className={cn(hasError && 'border-destructive focus-visible:ring-destructive', className)}
      {...props}
      {...register(field.name)}
    />
  );
}