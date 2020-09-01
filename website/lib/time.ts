import {
  addMilliseconds,
  format,
  formatDuration,
  intervalToDuration,
} from "date-fns";

export function formatDateTime(date: string | Date) {
  date = new Date(date);
  return format(date, "Pp");
}

export function formatDurationFromMs(ms: number) {
  var start = new Date();
  var end = addMilliseconds(start, ms);
  return formatDuration(intervalToDuration({ start, end }));
}
