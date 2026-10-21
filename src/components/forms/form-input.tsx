'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input, type InputProps } from '@/components/ui/input';
import { useFormFieldContext } from './form-field';
import { cn } from '@/lib/utils';

export type FormInputProps = Omit<InputProps, 'name'>;

export function FormInput({ className, ...props }: FormInputProps) {
  const { register, getFieldState } = useFormContext();
  const field = useFormFieldContext();
  const hasError = Boolean(getFieldState(field.name).error);

  return (
    <Input
      id={field.controlId}
      aria-invalid={hasError || undefined}
      aria-describedby={hasError ? field.errorId : field.hintId || undefined}
      className={cn(
        hasError &&
          'border-destructive focus-visible:ring-destructive aria-[invalid=true]:border-destructive',
        className,
      )}
      {...props}
      {...register(field.name)}
    />
  );
}