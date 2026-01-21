"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Clock, CalendarIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFeedBuilderStore } from "@/lib/stores/feed-builder-store";
import { WizardNavigation } from "./WizardNavigation";
import { feedSchedulesService } from "@/lib/api/services/feed-schedules.service";
import { FREQUENCY_MINUTES } from "@/lib/types/feed";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/utils/error-handler";
import { getFeedSuggestions } from "@/lib/api/feeds";

// Form validation schema with conditional rules (Story 1.3.4)
const publishSettingsSchema = z
  .object({
    schedule_enabled: z.boolean(),
    frequency: z
      .number()
      .refine((val) => [1440, 10080, 20160, 43200].includes(val), {
        message: "Invalid frequency value",
      })
      .optional(),
    delivery_time: z
      .string()
      .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)")
      .optional(),
    delivery_days: z.array(z.number().min(0).max(6)).optional(),
    delivery_day_of_month: z.number().min(-1).max(31).optional(),
    timezone: z.string().optional(),
  })
  .refine(
    (data) => {
      // If schedule is enabled, require frequency and delivery_time
      if (data.schedule_enabled) {
        return !!data.frequency && !!data.delivery_time;
      }
      return true;
    },
    {
      message: "Frequency and delivery time are required when automatic sending is enabled",
      path: ["frequency"],
    }
  )
  .refine(
    (data) => {
      // If weekly or bi-weekly, require at least 1 day selected
      if (data.schedule_enabled && (data.frequency === 10080 || data.frequency === 20160)) {
        return data.delivery_days && data.delivery_days.length > 0;
      }
      return true;
    },
    {
      message: "At least one day must be selected",
      path: ["delivery_days"],
    }
  )
  .refine(
    (data) => {
      // If monthly, require day_of_month
      if (data.schedule_enabled && data.frequency === 43200) {
        return data.delivery_day_of_month !== undefined;
      }
      return true;
    },
    {
      message: "Day of month is required for monthly frequency",
      path: ["delivery_day_of_month"],
    }
  );

type PublishSettingsFormValues = z.infer<typeof publishSettingsSchema>;

interface PublishSettingsStepProps {
  onNext: () => void;
  onBack: () => void;
  onCancel?: () => void;
  feedId?: number; // Optional: For editing existing feeds
}

// Days of the week for weekly/bi-weekly frequency
const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday", short: "Sun" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
];

// Helper function to format day with ordinal suffix (1st, 2nd, 3rd, etc.)
const getOrdinalSuffix = (day: number): string => {
  if (day >= 11 && day <= 13) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
};

/**
 * PublishSettingsStep - Feed Delivery Schedule Configuration (Story 1.3.4)
 *
 * Features:
 * - Frequency-based conditional UI (Daily, Weekly, Bi-Weekly, Monthly)
 * - Days-of-week selector for weekly/bi-weekly
 * - Day-of-month selector for monthly
 * - Schedule preview (next 5 delivery times)
 * - Form validation with conditional rules
 */
export function PublishSettingsStep({
  onNext,
  onBack,
  onCancel,
  feedId,
}: PublishSettingsStepProps) {
  const pathname = usePathname();
  const isCreateMode = pathname?.includes("/feeds/create");

  const { schedule, setSchedule, feedId: builderFeedId } = useFeedBuilderStore();
  const queryClient = useQueryClient();
  const [isDayPickerOpen, setIsDayPickerOpen] = useState(false);

  // Story 1.3.6: Prefetch AI suggestions in background while user configures schedule
  // ONLY during CREATE mode (not EDIT mode - feed already has name/description/category)
  const { feed: builderFeed } = useFeedBuilderStore();
  useEffect(() => {
    const currentFeedId = feedId || builderFeedId;

    // Only prefetch if:
    // 1. Feed ID exists (draft was saved)
    // 2. Feed doesn't have a name yet (indicates CREATE mode, not EDIT mode)
    if (currentFeedId && !builderFeed.name) {
      console.log("[Story 1.3.6] Prefetching AI suggestions for NEW feed:", currentFeedId);

      queryClient.prefetchQuery({
        queryKey: ["feed-suggestions", currentFeedId],
        queryFn: () => getFeedSuggestions(currentFeedId),
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      });
    } else if (currentFeedId && builderFeed.name) {
      console.log(
        "[Story 1.3.6] Skipping AI prefetch - EDIT mode (feed already has name):",
        builderFeed.name
      );
    }
  }, [feedId, builderFeedId, builderFeed.name, queryClient]);

  // Track initial schedule state to detect if we need to delete on toggle off
  const initialScheduleState = useRef<boolean | null>(null);

  const form = useForm<PublishSettingsFormValues>({
    resolver: zodResolver(publishSettingsSchema),
    defaultValues: {
      // Create mode: always ON | Edit mode: respect existing schedule
      schedule_enabled: isCreateMode ? true : schedule !== null,
      frequency: schedule?.frequency || FREQUENCY_MINUTES.weekly,
      delivery_time: schedule?.delivery_time || "09:00",
      delivery_days: schedule?.delivery_days || [1], // Default: Monday
      delivery_day_of_month: schedule?.delivery_day_of_month || 1, // Default: 1st
      timezone: schedule?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  // Store initial schedule state on first load
  useEffect(() => {
    if (initialScheduleState.current === null) {
      initialScheduleState.current = schedule !== null;
    }
  }, [schedule]);

  // Reset form when schedule loads from API (edit mode)
  useEffect(() => {
    form.reset({
      // Create mode: always ON | Edit mode: respect existing schedule
      schedule_enabled: isCreateMode ? true : schedule !== null,
      frequency: schedule?.frequency || FREQUENCY_MINUTES.weekly,
      delivery_time: schedule?.delivery_time || "09:00",
      delivery_days: schedule?.delivery_days || [1],
      delivery_day_of_month: schedule?.delivery_day_of_month || 1,
      timezone: schedule?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  }, [schedule, form, isCreateMode]);

  const watchScheduleEnabled = form.watch("schedule_enabled");
  const watchFrequency = form.watch("frequency");
  const watchDaysOfWeek = form.watch("delivery_days");

  const handleDayToggle = (day: number) => {
    const currentDays = watchDaysOfWeek || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day].sort((a, b) => a - b);

    form.setValue("delivery_days", newDays, { shouldValidate: true });
  };

  /**
   * Convert local time to UTC for backend API
   * User inputs time in their local timezone (e.g., "09:00" PST)
   * Backend expects UTC time (e.g., "17:00" UTC)
   *
   * @param localTime - Time in HH:MM format (user's local time)
   * @param _timezone - IANA timezone (unused - we use browser's local time directly)
   * @returns Time in HH:MM format (UTC)
   */
  const convertLocalTimeToUTC = (localTime: string, _timezone: string): string => {
    const [hours, minutes] = localTime.split(":").map(Number);

    // Create a date object set to the specified local time
    const localDate = new Date();
    localDate.setHours(hours, minutes, 0, 0);

    // Get UTC hours and minutes directly from the Date object
    // JavaScript Date internally handles the timezone conversion
    const utcHours = localDate.getUTCHours();
    const utcMinutes = localDate.getUTCMinutes();

    return `${utcHours.toString().padStart(2, "0")}:${utcMinutes.toString().padStart(2, "0")}`;
  };

  const onSubmit = async (data: PublishSettingsFormValues) => {
    // If schedule was disabled and we're editing a feed with an existing schedule, delete it
    if (!data.schedule_enabled && initialScheduleState.current === true && feedId) {
      try {
        await feedSchedulesService.deleteFeedSchedule(feedId);
        toast.success("Schedule removed", {
          description: "Feed will now require manual sending.",
        });
        setSchedule(null);
      } catch (error: any) {
        console.error("Error deleting schedule:", error);
        const errorMessage = extractErrorMessage(error, "Failed to remove schedule");
        toast.error(errorMessage);
        return; // Don't proceed to next step if deletion failed
      }
    }
    // Build schedule object if enabled (Story 1.3.4)
    else if (data.schedule_enabled && data.frequency && data.delivery_time && data.timezone) {
      // Convert user's local time to UTC for backend storage
      const utcTime = convertLocalTimeToUTC(data.delivery_time, data.timezone);

      // Build schedule data - only include fields relevant to the frequency type
      // to avoid sending undefined values that might cause backend validation errors
      const scheduleData: {
        frequency: number;
        delivery_time: string;
        timezone: string;
        is_active: boolean;
        delivery_days?: number[];
        delivery_day_of_month?: number;
      } = {
        frequency: data.frequency,
        delivery_time: utcTime, // UTC time for backend processing
        timezone: data.timezone, // User's timezone for display/localization
        is_active: true,
      };

      // Add delivery_days for weekly/bi-weekly
      if (data.frequency === 10080 || data.frequency === 20160) {
        scheduleData.delivery_days = data.delivery_days || [1]; // Default to Monday if not set
      }

      // Add delivery_day_of_month for monthly
      if (data.frequency === 43200) {
        scheduleData.delivery_day_of_month = data.delivery_day_of_month || 1; // Default to 1st if not set
      }

      console.log("[Story 1.3.4] PublishSettingsStep - Schedule configured:");
      console.log("  - Frequency:", data.frequency, "minutes");
      console.log("  - Local time:", data.delivery_time, "-> UTC:", utcTime);
      console.log("  - Timezone:", data.timezone);
      console.log("  - Delivery days:", data.delivery_days);
      console.log("  - Day of month:", data.delivery_day_of_month);
      console.log("  - Full schedule data:", JSON.stringify(scheduleData, null, 2));

      setSchedule(scheduleData);
    } else {
      setSchedule(null); // No schedule (manual sending)
    }

    // Move to next step (review)
    onNext();
  };

  return (
    <>
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Publishing Settings</CardTitle>
          <CardDescription>
            Configure when and how your stream will be delivered to subscribers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Enable Scheduling (Automatic Sending) */}
              <FormField
                control={form.control}
                name="schedule_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        Automatic Sending
                      </FormLabel>
                      <FormDescription>
                        Automatically send updates to subscribers on a schedule. If disabled,
                        you&apos;ll need to manually send the stream each time.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Manual Sending Message (shown when automatic sending is OFF) */}
              {watchScheduleEnabled === false && (
                <Alert>
                  <AlertDescription>
                    You&apos;ll need to manually send the stream to your subscribers each time —
                    whenever you want.
                  </AlertDescription>
                </Alert>
              )}

              {/* Delivery Schedule (only shown if automatic sending enabled) */}
              {watchScheduleEnabled && (
                <div className="space-y-6 pl-4 border-l-2">
                  {/* Frequency */}
                  <FormField
                    control={form.control}
                    name="frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Frequency</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(Number(value))}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={FREQUENCY_MINUTES.daily.toString()}>
                              Daily
                            </SelectItem>
                            <SelectItem value={FREQUENCY_MINUTES.weekly.toString()}>
                              Weekly
                            </SelectItem>
                            <SelectItem value={FREQUENCY_MINUTES.biweekly.toString()}>
                              Bi-weekly
                            </SelectItem>
                            <SelectItem value={FREQUENCY_MINUTES.monthly.toString()}>
                              Monthly
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          How often subscribers will receive updates
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Days of Week (for weekly and bi-weekly) */}
                  {(watchFrequency === FREQUENCY_MINUTES.weekly ||
                    watchFrequency === FREQUENCY_MINUTES.biweekly) && (
                    <FormField
                      control={form.control}
                      name="delivery_days"
                      render={() => (
                        <FormItem>
                          <FormLabel>Delivery Days</FormLabel>
                          <div className="flex gap-2 flex-wrap">
                            {DAYS_OF_WEEK.map((day) => (
                              <Button
                                key={day.value}
                                type="button"
                                variant={
                                  watchDaysOfWeek?.includes(day.value) ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => handleDayToggle(day.value)}
                                className="w-16"
                              >
                                {day.short}
                              </Button>
                            ))}
                          </div>
                          <FormDescription>
                            Select which day{watchFrequency === FREQUENCY_MINUTES.weekly ? "" : "s"}{" "}
                            to send updates
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Day of Month (for monthly) */}
                  {watchFrequency === FREQUENCY_MINUTES.monthly && (
                    <>
                      <FormField
                        control={form.control}
                        name="delivery_day_of_month"
                        render={({ field }) => {
                          // Convert day number to Date object for Calendar component
                          // Using December 2024 where day 1 falls on Sunday
                          const selectedDate =
                            field.value && field.value > 0
                              ? new Date(2024, 11, field.value)
                              : undefined;

                          return (
                            <FormItem className="flex flex-col">
                              <div className="flex flex-col md:flex-row gap-6 items-start">
                                {/* Day selector with popover calendar */}
                                <div className="flex flex-col gap-1.5">
                                  <FormLabel>Day of Month</FormLabel>
                                  <FormControl>
                                    <Popover
                                      open={isDayPickerOpen}
                                      onOpenChange={setIsDayPickerOpen}
                                    >
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          className="w-[140px] justify-start text-left font-normal"
                                        >
                                          <CalendarIcon className="mr-2 h-4 w-4" />
                                          {field.value
                                            ? getOrdinalSuffix(field.value)
                                            : "Select day"}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                          mode="single"
                                          selected={selectedDate}
                                          onSelect={(date) => {
                                            if (date) {
                                              field.onChange(date.getDate());
                                              setIsDayPickerOpen(false);
                                            }
                                          }}
                                          showOutsideDays={false}
                                          month={new Date(2024, 11, 1)}
                                          hideNavigation
                                          classNames={{
                                            month_caption: "hidden",
                                            nav: "hidden",
                                            weekdays: "hidden",
                                          }}
                                        />
                                      </PopoverContent>
                                    </Popover>
                                  </FormControl>
                                  <p className="text-[11px] text-muted-foreground/80">
                                    {field.value
                                      ? `Day ${field.value} of each month`
                                      : "Select day of month"}
                                  </p>
                                </div>

                                {/* Send Time - shown next to calendar on desktop */}
                                <FormField
                                  control={form.control}
                                  name="delivery_time"
                                  render={({ field: timeField }) => (
                                    <div className="flex flex-col gap-1.5">
                                      <FormLabel>Send Time</FormLabel>
                                      <FormControl>
                                        <div className="relative flex items-center">
                                          <Clock className="text-muted-foreground pointer-events-none absolute left-3 h-4 w-4 select-none" />
                                          <Input
                                            type="time"
                                            step="300"
                                            {...timeField}
                                            className="w-[140px] appearance-none pl-9 pr-3 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                          />
                                        </div>
                                      </FormControl>
                                      <p className="text-[11px] text-muted-foreground/80">
                                        Your timezone
                                      </p>
                                      <FormMessage />
                                    </div>
                                  )}
                                />
                              </div>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                    </>
                  )}

                  {/* Send Time (for non-monthly frequencies) */}
                  {watchScheduleEnabled && watchFrequency !== FREQUENCY_MINUTES.monthly && (
                    <FormField
                      control={form.control}
                      name="delivery_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Send Time</FormLabel>
                          <FormControl>
                            <div className="relative flex w-full items-center">
                              <Clock className="text-muted-foreground pointer-events-none absolute left-3 h-4 w-4 select-none" />
                              <Input
                                type="time"
                                step="300"
                                {...field}
                                className="w-48 appearance-none pl-9 pr-3 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                              />
                            </div>
                          </FormControl>
                          <FormDescription className="text-[11px] text-muted-foreground/80">
                            Your timezone
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Timezone - Auto-detected, hidden field */}
                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => <input type="hidden" {...field} />}
                  />
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Floating Navigation */}
      <WizardNavigation
        onCancel={onCancel}
        onBack={onBack}
        onNext={form.handleSubmit(onSubmit)}
        backLabel="Back"
        nextLabel="Next: Review"
      />
    </>
  );
}
