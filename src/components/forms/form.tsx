'use client';

import * as React from 'react';
import {
  FormProvider,
  useForm,
  type DefaultValues,
  type FieldValues,
  type SubmitHandler,
} from 'react-hook-form';
import type { z } from 'zod';
import { cn } from '@/lib/utils';

export interface FormProps<TSchema extends z.ZodType> {
  schema: TSchema;
  defaultValues: DefaultValues<z.input<TSchema>>;
  onSubmit: SubmitHandler<z.input<TSchema>>;
  className?: string;
  id?: string;
  'aria-label'?: string;
  children: React.ReactNode;
}

export function Form<TSchema extends z.ZodType>({
  schema,
  defaultValues,
  onSubmit,
  className,
  id,
  'aria-label': ariaLabel,
  children,
}: FormProps<TSchema>) {
  type FormValues = z.input<TSchema> & FieldValues;

  const form = useForm<FormValues>({
    resolver: async (values) => ({ values, errors: {} }),
    defaultValues: defaultValues as DefaultValues<FormValues>,
  });

  return (
    <FormProvider {...form}>
      <form
        id={id}
        aria-label={ariaLabel}
        className={cn('space-y-4', className)}
        onSubmit={form.handleSubmit(onSubmit as SubmitHandler<FormValues>)}
        noValidate
      >
        {children}
      </form>
    </FormProvider>
  );
}
