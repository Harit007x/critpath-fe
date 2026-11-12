/**
 * The arithmetic behind a scrolling wheel picker, apart from the DOM so it is tested.
 *
 * A looping wheel ("…11, 12, 1, 2…") is its values repeated `copies` times in one scroller. The
 * person starts in the middle copy; once a scroll settles near either end, the scroller jumps to
 * the same value in the middle copy, which looks like nothing happened and never runs out.
 */

/** How many times a looping wheel repeats its values: room for a long flick either way. */
export const WHEEL_COPIES = 9;

/** A value's index in 0…count-1 from any row index, negatives included. */
export const wheelValue = (index: number, count: number) => ((index % count) + count) % count;

/** The row centred at a scroll offset. */
export const wheelIndex = (scrollTop: number, itemHeight: number) =>
  Math.round(scrollTop / itemHeight);

/** Where a value sits in the middle copy: where a looping wheel opens and returns to. */
export const middleIndex = (value: number, count: number, copies = WHEEL_COPIES) =>
  count * Math.floor(copies / 2) + value;

/**
 * The row to jump to once a scroll settles: the same value in the middle copy when the row is in
 * the first or last copy, else the row itself (no jump).
 */
export function recentre(index: number, count: number, copies = WHEEL_COPIES) {
  if (index >= count && index < count * (copies - 1)) return index;
  return middleIndex(wheelValue(index, count), count, copies);
}

/** The first whole minute after `now`: the earliest time a reminder can be set to. */
export function nextMinute(now: Date) {
  const next = new Date(now);
  next.setSeconds(0, 0);
  next.setMinutes(next.getMinutes() + 1);
  return next;
}

/** `value`, moved up to `min` when it is earlier. */
export const clampTime = (value: Date, min: Date | null) =>
  min && value.getTime() < min.getTime() ? new Date(min) : value;

const range = (count: number, from = 0) => Array.from({ length: count }, (_, i) => i + from);

/**
 * What each wheel offers for a time on `value`'s day (a time already gone by is
 * not shown at all). On `min`'s day the wheels hold only `min` and later: AM only while it is
 * morning, the hours from `min`'s on, the minutes from `min`'s while that hour is picked; and they
 * stop looping (`limited`). Any other day, every value. Hours are 24-hour values in `value`'s half
 * of the day (0–11 or 12–23), shown 12-hour. `value` must already be clamped to `min`.
 */
export function timeOptions(value: Date, min: Date | null) {
  const pm = value.getHours() >= 12;
  const hours = pm ? range(12, 12) : range(12);
  const minutes = range(60);
  if (!min || value.toDateString() !== min.toDateString())
    return { meridiems: ["AM", "PM"] as const, hours, minutes, limited: false };
  const minHour = min.getHours();
  return {
    meridiems: minHour < 12 ? (["AM", "PM"] as const) : (["PM"] as const),
    hours: hours.filter((hour) => hour >= minHour),
    minutes: value.getHours() === minHour ? minutes.filter((m) => m >= min.getMinutes()) : minutes,
    limited: true,
  };
}
