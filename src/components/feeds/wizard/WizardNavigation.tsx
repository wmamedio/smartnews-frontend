"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface WizardNavigationProps {
  onCancel?: () => void;
  onBack?: () => void;
  onNext?: () => void;
  cancelLabel?: string;
  backLabel?: string;
  nextLabel?: string;
  isNextDisabled?: boolean;
  isNextLoading?: boolean;
}

/**
 * Floating navigation buttons for wizard steps
 * Fixed to bottom with sidebar margin for consistent UX across all steps
 */
export function WizardNavigation({
  onCancel,
  onBack,
  onNext,
  cancelLabel = "Cancel",
  backLabel = "Back",
  nextLabel = "Next",
  isNextDisabled = false,
  isNextLoading = false,
}: WizardNavigationProps) {
  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex items-center justify-between px-6 md:left-64">
      {/* Cancel button on the left */}
      <div>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
        )}
      </div>

      {/* Back/Next buttons on the right */}
      <div className="flex items-center gap-3">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            {backLabel}
          </Button>
        )}
        {onNext && (
          <Button onClick={onNext} disabled={isNextDisabled || isNextLoading}>
            {nextLabel}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
