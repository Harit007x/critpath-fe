import * as React from "react"
import { RiCalendarScheduleLine } from "@remixicon/react"

import { cn } from "@/lib/utils"
import {
  nextQuarterHour,
  parseLocal,
  withDate,
  withTime,
} from "@/lib/datetime-value"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { TimeField } from "@/components/ui/time-field"

/**
 * Date and time in one control.
 *
 * Replaces `<input type="datetime-local">`, whose picker is drawn by the
 * browser and cannot be styled at all — it arrives with its own blue, its own
 * type, its own corner radii and, on Chrome, three scrolling columns that
 * belong to no design system. It also renders differently in every browser, so
 * the one screen it appeared on was the one screen nobody could make match the
 * rest of the product.
 *
 * Value and `onChange` keep the native string contract, so this is a drop-in.
 * All of the arithmetic lives in `lib/datetime-value` and is unit-tested there;
 * this file is layout and state.
 *
 * The clock is 12-hour with an explicit AM/PM control rather than a 24-hour
 * field. Scheduling is the act of picturing a time of day, and "21:00" asks the
 * reader to convert before they can picture anything — while a 24-hour field's
 * own failure mode, typing 9 when you meant 21, is silent and posts twelve
 * hours early.
 */
export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick a date and time",
  disabled,
  id,
  className,
  "aria-label": ariaLabel,
}: {
  /** `YYYY-MM-DDTHH:mm`, local, or "" for unset. */
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  id?: string
  className?: string
  "aria-label"?: string
}) {
  const [open, setOpen] = React.useState(false)
  const selected = parseLocal(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label={ariaLabel}
          className={cn(
            "w-full justify-start gap-2.5 font-normal",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <RiCalendarScheduleLine className="text-muted-foreground" />
          <span className="truncate">{formatDateTime(value) ?? placeholder}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-auto p-0">
        <DateTimePanel value={value} onChange={onChange} />
      </PopoverContent>
    </Popover>
  )
}

/** How a picked value reads back to the person who picked it, or null when
    nothing is picked. */
export function formatDateTime(value: string): string | null {
  const parsed = parseLocal(value)
  return parsed
    ? parsed.toLocaleString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : null
}

/**
 * The picker's body — calendar, clock, Clear and Soonest — without the popover
 * around it.
 *
 * For a surface that is already a popover whose only job is choosing a time.
 * Nesting the trigger inside it meant two popovers, a second click to reach the
 * calendar, and, when the inner one was opened automatically, a calendar that
 * visibly jumped: it was positioned against a trigger that was itself still
 * being positioned.
 */
export function DateTimePanel({
  value,
  onChange,
}: {
  /** `YYYY-MM-DDTHH:mm`, local, or "" for unset. */
  value: string
  onChange: (value: string) => void
}) {
  const selected = parseLocal(value)

  /* The month the grid opens on when nothing is picked yet. Held in state so
     paging around an empty picker is not undone on the next keystroke in the
     time fields. */
  const [month, setMonth] = React.useState<Date>(selected ?? new Date())
  React.useEffect(() => {
    const parsed = parseLocal(value)
    if (parsed) setMonth(parsed)
  }, [value])

  return (
    <>
      <Calendar
        mode="single"
        selected={selected ?? undefined}
        onSelect={(day) => {
          // `mode="single"` reports undefined when the selected day is
          // clicked again. That is a deselect, and this control has a Clear
          // button for that — silently emptying the field because someone
          // clicked the day they had already chosen is not what the gesture
          // means here.
          if (day) onChange(withDate(value, day))
        }}
        month={month}
        onMonthChange={setMonth}
        autoFocus
      />

      {/* Both controls are h-9, the system's control height, so the clock
          reads as one object rather than a field with a smaller thing parked
          beside it. */}
      <div className="flex items-center gap-2 border-t border-border p-3">
        <span className="text-3xs font-medium uppercase tracking-wider tabular-nums text-muted-foreground">Time</span>
        <TimeField
          className="ms-auto"
          value={
            selected
              ? { hours: selected.getHours(), minutes: selected.getMinutes() }
              : null
          }
          onChange={(hours, mins) => onChange(withTime(value, hours, mins))}
        />
      </div>

      <div className="flex items-center justify-between border-t border-border p-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={!value}
          onClick={() => onChange("")}
        >
          Clear
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(withTime("", 0, 0, nextQuarterHour))}
        >
          Soonest
        </Button>
      </div>
    </>
  )
}

export default DateTimePicker
