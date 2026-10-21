'use client';

import * as React from 'react';
import { Dialog } from 'radix-ui';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  /** Controlled open state. */
  open: boolean;
  /** Called when the dialog requests to open/close. */
  onOpenChange: (open: boolean) => void;
  /** Accessible dialog title. */
  title: React.ReactNode;
  /** Optional dialog description (recommended for screen readers). */
  description?: React.ReactNode;
  /** Body content rendered inside the dialog. */
  children?: React.ReactNode;
  /** Optional footer row (e.g. action buttons). */
  footer?: React.ReactNode;
  /** Extra classes for the dialog content panel. */
  contentClassName?: string;
  /** Show the top-right close button (default true). */
  showCloseButton?: boolean;
}

/**
 * Accessible modal dialog built on the Radix Dialog primitive: focus
 * management, ESC-to-close, `role="dialog"`, and `aria-labelledby`
 * wiring are provided out of the box.
 */
function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  contentClassName,
  showCloseButton = true,
}: ModalProps) {
  const titleId = React.useId();
  const descriptionId = React.useId();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay aria-hidden="true" className="fixed inset-0 z-50 bg-black/70" />
        <Dialog.Content
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          className={cn(
            'fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-6 shadow-lg sm:rounded-lg',
            contentClassName,
          )}
        >
          <Dialog.Title id={titleId} className="text-lg font-semibold leading-none tracking-tight">
            {title}
          </Dialog.Title>
          {description ? (
            <Dialog.Description id={descriptionId} className="text-sm text-muted-foreground">
              {description}
            </Dialog.Description>
          ) : null}
          {children ? <div className="text-sm">{children}</div> : null}
          {footer ? (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{footer}</div>
          ) : null}
          {showCloseButton ? (
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Tutup dialog"
                className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export { Modal };