'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { Button, type ButtonProps } from '@/components/ui/button';

export interface FormSubmitProps extends Omit<ButtonProps, 'type' | 'children'> {
  children?: React.ReactNode;
  /** Text shown while the form is submitting. */
  loadingLabel?: string;
}

/**
 * Submit button for a `<Form>`. Disables and shows a loading label
 * while `formState.isSubmitting` is true.
 */
export function FormSubmit({
  children = 'Simpan',
  loadingLabel = 'Menyimpan…',
  className,
  ...rest
}: FormSubmitProps) {
  const { formState } = useFormContext();
  const isSubmitting = formState.isSubmitting;

  return (
    <Button
      type="submit"
      loading={isSubmitting}
      disabled={isSubmitting}
      className={className}
      {...rest}
    >
      {isSubmitting ? loadingLabel : children}
    </Button>
  );
}