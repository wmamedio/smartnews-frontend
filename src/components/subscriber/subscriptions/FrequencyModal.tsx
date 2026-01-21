"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { FeedSubscriptionWithDetails } from "@/lib/types/feed";

interface FrequencyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: FeedSubscriptionWithDetails | null;
  onSave: (subscriptionId: number, frequency: string) => Promise<void>;
}

const FREQUENCY_OPTIONS = [
  {
    value: "daily",
    label: "Daily",
    description: "Get updates every day",
  },
  {
    value: "weekly",
    label: "Weekly",
    description: "Get updates every week",
  },
  {
    value: "bi-weekly",
    label: "Bi-weekly",
    description: "Get updates every two weeks",
  },
];

export function FrequencyModal({ open, onOpenChange, subscription, onSave }: FrequencyModalProps) {
  const [selectedFrequency, setSelectedFrequency] = useState(
    subscription?.delivery_frequency || "daily"
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!subscription) return;

    setIsSaving(true);
    try {
      await onSave(subscription.id, selectedFrequency);
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsSaving(false);
    }
  };

  // Update selected frequency when subscription changes
  if (subscription && selectedFrequency !== subscription.delivery_frequency) {
    setSelectedFrequency(subscription.delivery_frequency);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Delivery Frequency</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="mb-4 text-sm text-muted-foreground">
            Choose how often you receive updates from {subscription?.feed.name}
          </p>

          <RadioGroup value={selectedFrequency} onValueChange={setSelectedFrequency}>
            {FREQUENCY_OPTIONS.map((option) => (
              <div
                key={option.value}
                className="flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent"
              >
                <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                <Label htmlFor={option.value} className="flex-1 cursor-pointer space-y-1">
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-muted-foreground">{option.description}</div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
