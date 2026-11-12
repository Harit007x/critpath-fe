/**
 * The `datetime-local` wire format, as pure functions.
 *
 * `YYYY-MM-DDTHH:mm`, local time, no zone — unchanged from the native input
 * this replaced, so callers doing `new Date(value).toISOString()` need no
 * migration and the value still round-trips through a plain string in state.
 *
 * Extracted from the picker rather than living inside it because every real
 * hazard here is arithmetic, not rendering: midnight is 12 AM and noon is
 * 12 PM, and both convert to a 24-hour clock through a rule that reads wrong
 * (12 → 0 for AM, 12 → 12 for PM). Getting that subtly wrong publishes a post
 * twelve hours from when someone meant, unattended, and the mistake is
 * invisible in the UI that caused it.
 */

const PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/

/**
 * Parse without going through `new Date(string)`.
 *
 * The Date constructor's handling of bare datetime-local strings has moved
 * between engines and spec versions — some read them as UTC, some as local —
 * and a scheduler silently off by the viewer's offset is the worst bug to ship
 * here, because it looks correct on the machine that wrote it. Explicit
 * field-by-field construction is unambiguously local.
 */
export function parseLocal(value: string): Date | null {
  const match = PATTERN.exec(value)
  if (!match) return null
  const [, y, mo, d, h, mi] = match
  const date = new Date(+y, +mo - 1, +d, +h, +mi, 0, 0)
  return Number.isNaN(date.getTime()) ? null : date
}

const pad = (n: number) => String(n).padStart(2, "0")

export function serialiseLocal(date: Date): string {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

/** Next quarter hour — the soonest slot a scheduler should offer. */
export function nextQuarterHour(from: Date = new Date()): Date {
  const date = new Date(from)
  date.setSeconds(0, 0)
  date.setMinutes(date.getMinutes() + ((15 - (date.getMinutes() % 15)) % 15 || 15))
  return date
}

export type Meridiem = "AM" | "PM"

export const to12Hour = (hours24: number): number => hours24 % 12 || 12

export const meridiemOf = (hours24: number): Meridiem =>
  hours24 >= 12 ? "PM" : "AM"

export function to24Hour(hours12: number, meridiem: Meridiem): number {
  if (meridiem === "AM") return hours12 === 12 ? 0 : hours12
  return hours12 === 12 ? 12 : hours12 + 12
}

/**
 * Move the day, keep the time.
 *
 * `fallback` supplies the clock the first time a day is picked. Emitting a
 * date with no time would be worse than emitting nothing: the caller's
 * `new Date(value)` accepts it happily and schedules midnight, which is never
 * what someone reaching for a scheduler meant.
 */
export function withDate(
  value: string,
  day: Date,
  fallback: () => Date = nextQuarterHour
): string {
  const base = parseLocal(value) ?? fallback()
  const next = new Date(day)
  next.setHours(base.getHours(), base.getMinutes(), 0, 0)
  return serialiseLocal(next)
}

/** Move the clock, keep the day — filling the day in on first touch. */
export function withTime(
  value: string,
  hours24: number,
  minutes: number,
  fallback: () => Date = nextQuarterHour
): string {
  const next = new Date(parseLocal(value) ?? fallback())
  next.setHours(hours24, minutes, 0, 0)
  return serialiseLocal(next)
}

/** Step a bounded field, wrapping at both ends the way a native one does. */
export function stepWrapped(
  current: number,
  delta: number,
  min: number,
  max: number
): number {
  const span = max - min + 1
  return ((current - min + delta + span) % span) + min
}
