import type { SystemPreferences } from "../types/models";

export function formatDateTime(value: string, preferences: SystemPreferences) {
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: preferences.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  const year = part("year");
  const month = part("month");
  const day = part("day");
  const formattedDate = preferences.dateFormat === "YYYY-MM-DD"
    ? `${year}-${month}-${day}`
    : preferences.dateFormat === "MM/DD/YYYY"
      ? `${month}/${day}/${year}`
      : `${day}/${month}/${year}`;

  return `${formattedDate}, ${part("hour")}:${part("minute")}`;
}
