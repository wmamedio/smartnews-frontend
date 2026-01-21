import type { DeliveryScheduleResponse } from "@/lib/types/feed";

/**
 * Convert UTC time to local time for display
 * Backend stores time in UTC, frontend displays in user's local time
 *
 * @param utcTime - Time in HH:MM UTC format (e.g., "17:00")
 * @param timezone - IANA timezone (e.g., "America/Los_Angeles") or "UTC"
 * @returns Time in HH:MM format in user's local timezone
 *
 * @example
 * ```typescript
 * convertUTCToLocalTime("17:00", "America/Los_Angeles") // => "09:00" (PST)
 * convertUTCToLocalTime("17:00", "UTC") // => "17:00"
 * ```
 */
export function convertUTCToLocalTime(utcTime: string, timezone: string = "UTC"): string {
  // If timezone is UTC, return as-is
  if (timezone === "UTC") {
    return utcTime;
  }

  const [hours, minutes] = utcTime.split(":").map(Number);

  // Create a UTC date with the specified time
  const utcDate = new Date();
  utcDate.setUTCHours(hours, minutes, 0, 0);

  // Get user's current timezone (browser detected)
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Convert to user's local time
  const localTimeStr = utcDate.toLocaleString("en-US", {
    timeZone: userTimezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  // Extract HH:MM from the formatted string
  const [localHours, localMinutes] = localTimeStr.split(":").map((part) => part.trim());
  return `${localHours}:${localMinutes}`;
}

/**
 * Format delivery schedule for display (Story 1.3.4)
 *
 * Formats a delivery schedule object into a human-readable string
 * Used in feeds list view and card view to show schedule configuration
 *
 * NOTE: Converts UTC time to user's local time for display
 *
 * @param schedule - Schedule object from API or null
 * @returns Formatted string like "Daily (09:00)", "Weekly (Monday)", "Monthly (15th)"
 *
 * @example
 * ```typescript
 * formatScheduleDisplay(null) // => "Manual"
 * formatScheduleDisplay({ frequency: 1440, delivery_time: "17:00", timezone: "UTC" }) // => "Daily (09:00)" (if user is PST)
 * formatScheduleDisplay({ frequency: 10080, delivery_days: [1], ... }) // => "Weekly (Monday)"
 * formatScheduleDisplay({ frequency: 10080, delivery_days: [1,3,5], ... }) // => "Weekly (3 days)"
 * formatScheduleDisplay({ frequency: 43200, delivery_day_of_month: 15, ... }) // => "Monthly (15th)"
 * formatScheduleDisplay({ frequency: 43200, delivery_day_of_month: -1, ... }) // => "Monthly (Last Day)"
 * ```
 */
export function formatScheduleDisplay(
  schedule: DeliveryScheduleResponse | null | undefined
): string {
  if (!schedule) {
    return "Manual";
  }

  const { frequency, delivery_time, delivery_days, delivery_day_of_month, timezone } = schedule;

  // Convert UTC time to user's local time for display
  const localTime = convertUTCToLocalTime(delivery_time, timezone);

  switch (frequency) {
    case 1440: // Daily
      return `Daily (${localTime})`;

    case 10080: {
      // Weekly
      if (delivery_days && delivery_days.length === 1) {
        const dayNames = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];
        const dayName = dayNames[delivery_days[0]];
        return `Weekly (${dayName})`;
      }
      return `Weekly (${delivery_days?.length || 0} days)`;
    }

    case 20160: // Bi-weekly
      return `Biweekly (${delivery_days?.length || 0} days)`;

    case 43200: {
      // Monthly
      if (delivery_day_of_month === -1) {
        return "Monthly (Last Day)";
      }
      // Add ordinal suffix: 1st, 2nd, 3rd, 4th, etc.
      const day = delivery_day_of_month || 1;
      const suffix = getOrdinalSuffix(day);
      return `Monthly (${day}${suffix})`;
    }

    default:
      return "Manual";
  }
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, 4th, etc.)
 * @param num - Number to get suffix for
 * @returns Ordinal suffix ("st", "nd", "rd", "th")
 */
function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;

  if (j === 1 && k !== 11) {
    return "st";
  }
  if (j === 2 && k !== 12) {
    return "nd";
  }
  if (j === 3 && k !== 13) {
    return "rd";
  }
  return "th";
}
