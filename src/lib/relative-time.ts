/**
 * "15 minutes ago", and its counterpart for things that have not happened yet.
 *
 * Built on `Intl.RelativeTimeFormat`, which is in every browser this app targets
 * and knows how to say this in the reader's own language — the hand-rolled
 * version of this function is where "1 minutes ago" comes from.
 *
 * **It stops being relative after a week.** "Ago" is useful while it saves the
 * reader arithmetic; past that it costs them some, and "23 days ago" is a worse
 * answer than the date. Lists of sent posts get long, and a column of numbers
 * nobody can place is not history.
 */

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["second", 1000],
  ["minute", 60 * 1000],
  ["hour", 60 * 60 * 1000],
  ["day", 24 * 60 * 60 * 1000],
];

/** Past a week, a date beats a distance. */
const RELATIVE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

const absolute = (date: Date): string =>
  date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    // The year only when it is not this one — it is noise eleven months in
    // twelve and essential in the twelfth.
    ...(date.getFullYear() === new Date().getFullYear() ? {} : { year: "numeric" }),
  });

/**
 * How long ago, or how long until. `now` is a parameter so callers can render
 * a list against one clock reading rather than a slightly different one per row.
 */
export const relativeTime = (value: string | Date, now: Date = new Date()): string => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const delta = date.getTime() - now.getTime();
  if (Math.abs(delta) > RELATIVE_WINDOW_MS) return absolute(date);

  // Largest unit that gives a non-zero count, so five minutes reads as minutes
  // and five hours as hours.
  let chosen: Intl.RelativeTimeFormatUnit = "second";
  let size = 1000;
  for (const [unit, ms] of UNITS) {
    if (Math.abs(delta) >= ms) {
      chosen = unit;
      size = ms;
    }
  }

  return formatter.format(Math.round(delta / size), chosen);
};

/** "6:30 PM" — for a timetable, where the clock time is the point. Always 12-hour (owner, 2026-11-04). */
export const scheduleTime = (value: string | Date): string => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true });
};

/** How far back the Sent tab looks unless asked for more. */
export const SENT_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * The reader's today, as two instants: local midnight and the next one.
 *
 * Built from the calendar date rather than by adding 24 hours, because the day
 * a clock changes is 23 or 25 hours long and "midnight plus a day" lands an hour
 * off on exactly those days.
 */
export const todayBounds = (now: Date = new Date()): { start: Date; end: Date } => ({
  start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
  end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
});

/** Whether a timestamp falls on the reader's own today. */
export const isToday = (value: string | Date, now: Date = new Date()): boolean => {
  const date = value instanceof Date ? value : new Date(value);
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};
