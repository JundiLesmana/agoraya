'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';

export interface FormFieldContextValue {
  name: string;
  controlId: string;
  labelId: string;
  errorId: string;
  hintId: string;
  describedBy: string | undefined;
  required: boolean;
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

/** Access the enclosing `<FormField>` context. Throws outside a field. */
export function useFormFieldContext(): FormFieldContextValue {
  const context = React.useContext(FormFieldContext);
  if (!context) {
    throw new Error(
      'Field controls must be rendered inside a <FormField> within a <Form>.',
    );
  }
  return context;
}

export interface FormFieldProps extends React.ComponentProps<'div'> {
  /** Field name — must match the form schema key. */
  name: string;
  /** Visible label associated with the control. */
  label?: string;
  /** Helper text shown below the control. */
  hint?: string;
  /** Marks the label as required (visual + `required` context). */
  required?: boolean;
}

/**
 * Wraps a field control with a label, hint, and validation error.
 * The control must be one of the `Form*` controls (e.g. `<FormInput />`)
 * which read the field context to register with react-hook-form.
 */
export function FormField({
  name,
  label,
  hint,
  required = false,
  className,
  children,
  ...rest
}: FormFieldProps) {
  const { getFieldState } = useFormContext();
  const error = getFieldState(name).error;

  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const controlId = `field-${uid}`;

  const contextValue = React.useMemo<FormFieldContextValue>(() => {
    const errorId = `${controlId}-error`;
    const hintId = `${controlId}-hint`;
    return {
      name,
      controlId,
      labelId: `${controlId}-label`,
      errorId,
      hintId,
      describedBy:
        [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') ||
        undefined,
      required,
    };
  }, [name, controlId, error, hint, required]);

  return (
    <FormFieldContext.Provider value={contextValue}>
      <div className={cn('space-y-1.5', className)} {...rest}>
        {label ? (
          <label
            htmlFor={controlId}
            id={contextValue.labelId}
            className="text-sm font-medium leading-none"
          >
            {label}
            {required ? (
              <span aria-hidden="true" className="ml-0.5 text-destructive">
                *
              </span>
            ) : null}
          </label>
        ) : null}
        {children}
        {hint ? (
          <p id={contextValue.hintId} className="text-xs text-muted-foreground">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p
            id={contextValue.errorId}
            role="alert"
            data-testid={`error-${name}`}
            className="text-xs font-medium text-destructive"
          >
            {error.message}
          </p>
        ) : null}
      </div>
    </FormFieldContext.Provider>
  );
}