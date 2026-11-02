"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type WizardStep =
  "pilih-layanan" | "isi-detail" | "lampiran" | "tinjau-kirim" | "preferensi";

export interface WizardLayoutProps {
  steps: readonly WizardStep[];
  currentStep: number;
  showProgress?: boolean;
  children: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  backLabel?: string;
  hideNavigation?: boolean;
}

export interface WizardLayoutContextValue {
  currentStep: number;
  steps: readonly WizardStep[];
  goToStep: (step: number) => void;
  goToNext: () => void;
  goToBack: () => void;
}

const WizardLayoutContext =
  React.createContext<WizardLayoutContextValue | null>(null);

function useWizardLayout(): WizardLayoutContextValue {
  const context = React.useContext(WizardLayoutContext);
  if (!context) {
    throw new Error(
      "useWizardLayout must be used within a WizardLayoutProvider",
    );
  }
  return context;
}
function WizardProgress({
  currentStep,
  steps,
}: {
  currentStep: number;
  steps: readonly WizardStep[];
}) {
  const progress = Math.round(((currentStep + 1) / steps.length) * 100);
  const stepLabels: Record<WizardStep, string> = {
    "pilih-layanan": "Pilih layanan",
    "isi-detail": "Isi detail",
    lampiran: "Lampiran",
    "tinjau-kirim": "Tinjau & kirim",
    preferensi: "Preferensi",
  };

  return (
    <section
      aria-label="Progres pengajuan"
      className="border-border bg-card rounded-xl border p-4 shadow-sm"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-medium">
          Langkah {currentStep + 1} dari {steps.length}
        </p>
        <p className="text-muted-foreground text-xs">{progress}% selesai</p>
      </div>
      <div
        className="bg-muted mb-4 h-2 overflow-hidden rounded-full"
        role="progressbar"
        aria-label="Progres langkah pengajuan"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <div
          className="bg-primary h-full rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <ol className="flex gap-3 overflow-x-auto pb-1">
        {steps.map((step, index) => {
          const number = index + 1;
          const completed = number < currentStep + 1;
          const active = number === currentStep + 1;
          return (
            <li
              key={step}
              aria-current={active ? "step" : undefined}
              className="flex min-w-max items-center gap-2 text-xs"
            >
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${
                  completed || active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                {completed ? (
                  <Check className="size-3.5" aria-hidden="true" />
                ) : (
                  number
                )}
              </span>
              <span
                className={
                  active
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground"
                }
              >
                {number}. {stepLabels[step]}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
function WizardNavigation({
  currentStep,
  steps,
  onBack,
  onNext,
  nextDisabled,
  nextLabel,
  backLabel,
  hideNavigation,
}: {
  currentStep: number;
  steps: readonly WizardStep[];
  onBack?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  backLabel?: string;
  hideNavigation?: boolean;
}) {
  if (hideNavigation) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  return (
    <div className="border-border flex flex-col-reverse justify-between gap-3 border-t pt-4 sm:flex-row">
      <Button
        type="button"
        variant="outline"
        disabled={isFirst}
        onClick={onBack}
        className="w-full sm:w-auto"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {backLabel ?? "Kembali"}
      </Button>
      {!isLast ? (
        <Button
          type="button"
          disabled={nextDisabled}
          onClick={onNext}
          className="w-full sm:w-auto"
        >
          {nextLabel ?? "Lanjutkan"}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  );
}

export function WizardLayout({
  steps,
  currentStep,
  children,
  showProgress = true,
  onBack,
  onNext,
  nextDisabled = false,
  nextLabel,
  backLabel,
  hideNavigation,
}: WizardLayoutProps) {
  const contextValue = React.useMemo<WizardLayoutContextValue>(
    () => ({
      currentStep,
      steps,
      goToStep: () => {
        // Intentionally no-op here; parent controls state
      },
      goToNext: onNext ?? (() => {}),
      goToBack: onBack ?? (() => {}),
    }),
    [currentStep, steps, onNext, onBack],
  );

  return (
    <WizardLayoutContext.Provider value={contextValue}>
      <div className="space-y-5">
        {showProgress ? (
          <WizardProgress currentStep={currentStep} steps={steps} />
        ) : null}
        <Card className="rounded-xl shadow-sm">
          <CardContent className="space-y-6 p-4 sm:p-6">{children}</CardContent>
        </Card>
        <WizardNavigation
          currentStep={currentStep}
          steps={steps}
          onBack={onBack}
          onNext={onNext}
          nextDisabled={nextDisabled}
          nextLabel={nextLabel}
          backLabel={backLabel}
          hideNavigation={hideNavigation}
        />
      </div>
    </WizardLayoutContext.Provider>
  );
}

export { useWizardLayout, WizardLayoutContext };
