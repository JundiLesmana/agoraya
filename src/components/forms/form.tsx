'use client';

import * as React from 'react';
import {
  FormProvider,
  useForm,
  type DefaultValues,
  type FieldValues,
  type SubmitHandler,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { cn } from '@/lib/utils';

export interface FormProps<TSchema extends z.ZodType> {
  /** Zod schema that defines the data contract and validation rules. */
  schema: TSchema;
  /** Initial values for the form (schema input shape). */
  defaultValues: DefaultValues<z.input<TSchema>>;
  /** Called with the validated values on submit. */
  onSubmit: SubmitHandler<z.input<TSchema>>;
  className?: string;
  /** Native form element id. */
  id?: string;
  /** Accessible name when the form has no visible heading. */
  'aria-label'?: string;
  /** Field controls + submit button, normally from `components/forms`. */
  children: React.ReactNode;
}

/**
 * Form wrapper that connects react-hook-form with a Zod schema.
 * Validation runs with zodResolver on submit; errors are surfaced by
 * the accompanying `<FormField>` + control components.
 *
 * ```tsx
 * <Form schema={schema} defaultValues={{ name: '' }} onSubmit={handleSave}>
 *   <FormField name="name" label="Nama">
 *     <FormInput />
 *   </FormField>
 *   <FormSubmit>Simpan</FormSubmit>
 * </Form>
 * ```
 */
export function Form<TSchema extends z.ZodType>({
  schema,
  defaultValues,
  onSubmit,
  className,
  id,
  'aria-label': ariaLabel,
  children,
}: FormProps<TSchema>) {
  // Boundary cast: zod input shapes and RHF field values are the same
  // object for the object schemas used here, and the schema is enforced
  // at runtime by zodResolver regardless of the static typing.
  type FormValues = z.input<TSchema> & FieldValues;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema as never),
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