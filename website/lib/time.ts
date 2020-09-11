import { addMilliseconds, formatDuration, intervalToDuration } from "date-fns";

import { format } from "date-fns-tz";

export function formatDateTime(date: string | Date) {
  date = new Date(date);
  return format(date, "yyyy-MM-dd HH:mm:ss zzz");
}

export function formatDurationFromMs(ms: number) {
  var start = new Date();
  var end = addMilliseconds(start, ms);
  return formatDuration(intervalToDuration({ start, end }));
}
