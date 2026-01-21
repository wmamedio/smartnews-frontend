"use client";

import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepProgressProps {
  currentStep: number; // Current active step (1-5)
  totalSteps: number; // Total number of steps (5)
  completedSteps: number[]; // Array of completed step numbers
  onStepClick?: (step: number) => void; // Click handler for navigation
  labels?: string[]; // Optional step labels (Story 1.3.6: Sources → Preview → Publishing → Details → Review)
}

export function StepProgress({
  currentStep,
  totalSteps,
  completedSteps,
  onStepClick,
  labels = ["Sources", "Preview", "Publishing", "Details", "Review"],
}: StepProgressProps) {
  return (
    <div className="flex items-center justify-between w-full max-w-3xl mx-auto py-6">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => {
        const isCompleted = completedSteps.includes(step);
        const isCurrent = step === currentStep;
        const isClickable = isCompleted || step < currentStep;

        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-2 flex-1">
              {/* Step circle */}
              <button
                onClick={() => isClickable && onStepClick?.(step)}
                disabled={!isClickable}
                aria-label={`Step ${step}: ${labels[step - 1]}`}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all border-2",
                  isCurrent &&
                    "bg-primary text-primary-foreground ring-4 ring-primary/20 border-primary",
                  isCompleted && !isCurrent && "bg-primary/20 text-primary border-primary",
                  !isCompleted && !isCurrent && "bg-muted text-muted-foreground border-border",
                  isClickable && "cursor-pointer hover:scale-110",
                  !isClickable && "cursor-not-allowed"
                )}
              >
                {isCompleted && !isCurrent ? <Check className="w-5 h-5" /> : step}
              </button>

              {/* Step label */}
              <span
                className={cn(
                  "text-xs font-medium text-center hidden sm:block",
                  isCurrent && "text-primary",
                  !isCurrent && "text-muted-foreground"
                )}
              >
                {labels[step - 1]}
              </span>
            </div>

            {/* Connecting line */}
            {step < totalSteps && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-2 max-w-[120px]",
                  step < currentStep ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
