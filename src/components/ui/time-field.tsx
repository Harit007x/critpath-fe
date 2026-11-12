import * as React from "react"
import { RiTimeLine } from "@remixicon/react"

import { cn } from "@/lib/utils"
import {
  meridiemOf,
  stepWrapped,
  to12Hour,
  to24Hour,
  type Meridiem,
} from "@/lib/datetime-value"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { SegmentedControl } from "@/components/ui/segmented-control"

/**
 * A time of day: hour, minute, AM/PM. Inline — there is no dropdown.
 *
 * Replaces `<input type="time">`, whose picker Chrome draws itself: three
 * scrolling columns on a white box with a system-blue selection, unstyleable,
 * and on the Posting times dialog it was the one surface in the product that
 * matched nothing around it. The same clock already lived inside
 * `DateTimePicker`; it is here so the two cannot drift apart.
 *
 * 12-hour with an explicit AM/PM control, for the reason `DateTimePicker` gives:
 * a schedule is the act of picturing a time of day, and a 24-hour field's own
 * failure — typing 9 when you meant 21 — is silent and posts twelve hours early.
 *
 * `value` is null while nothing is chosen; the first edit fills the other half
 * in (12 for an hour, 00 for a minute) so a partial clock is never emitted.
 */
export function TimeField({
  value,
  onChange,
  size = "md",
  className,
}: {
  value: { hours: number; minutes: number } | null
  /** Hours are 0–23. */
  onChange: (hours: number, minutes: number) => void
  /** `sm` is h-7, to sit in a row of h-7 pills; `md` is the system's h-9. */
  size?: "sm" | "md"
  className?: string
}) {
  const hours12 = value ? to12Hour(value.hours) : null
  const minutes = value ? value.minutes : null
  const meridiem: Meridiem = value ? meridiemOf(value.hours) : "AM"

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* `has-[:focus-visible]`, not `focus-within`: the halo is the system's
          keyboard affordance, and `focus-within` would draw it on a plain mouse
          click, which no other field here does. */}
      <div
        className={cn(
          "flex items-center rounded-md border border-border bg-card px-1 transition-[border-color,box-shadow] duration-150 ease-out has-[:focus-visible]:border-primary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/30",
          size === "sm" ? "h-7" : "h-9"
        )}
      >
        <TimeUnit
          aria-label="Hour"
          value={hours12}
          min={1}
          max={12}
          size={size}
          onCommit={(next) => onChange(to24Hour(next, meridiem), minutes ?? 0)}
        />
        <span aria-hidden="true" className="text-muted-foreground/60">
          :
        </span>
        <TimeUnit
          aria-label="Minute"
          value={minutes}
          min={0}
          max={59}
          size={size}
          onCommit={(next) => onChange(to24Hour(hours12 ?? 12, meridiem), next)}
        />
      </div>
      <SegmentedControl
        aria-label="AM or PM"
        size={size}
        options={[
          { value: "AM", label: "AM" },
          { value: "PM", label: "PM" },
        ]}
        value={meridiem}
        onChange={(next) => onChange(to24Hour(hours12 ?? 12, next), minutes ?? 0)}
      />
    </div>
  )
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1)
const MINUTES = Array.from({ length: 60 }, (_, i) => i)
const MERIDIEMS: Meridiem[] = ["AM", "PM"]
const pad = (n: number) => String(n).padStart(2, "0")
const mod = (n: number, m: number) => ((n % m) + m) % m

/** Row height in px. Five rows show: two either side of the selection. */
const ROW = 28
const VISIBLE = 5

/**
 * A time of day, picked on wheels.
 *
 * The field reads `09:00 AM`. Clicking it opens a card with Cancel and Save
 * across the top and three wheels beneath — hour, minute, AM/PM — with the
 * current choice sitting in a highlighted band across the middle row.
 *
 * The wheels edit a draft. Save or a click outside keeps it; Cancel and Escape
 * discard it.
 *
 * Click any visible value and its wheel slides it into the band. The mouse
 * wheel or trackpad steps it one row at a time, and so do the arrow keys on a
 * focused wheel; Enter saves.
 *
 * Hours and minutes wrap, so 59 sits above 00 and 12 above 01, as on a clock.
 */
export function TimePicker({
  value,
  onChange,
  className,
  "aria-label": ariaLabel = "Time of day",
}: {
  /** Hours are 0–23. */
  value: { hours: number; minutes: number }
  onChange: (hours: number, minutes: number) => void
  className?: string
  "aria-label"?: string
}) {
  const [open, setOpen] = React.useState(false)
  // What the wheels currently show, kept up to date by the card, so a click
  // outside can keep it without the card having to be asked.
  const draftRef = React.useRef<{ hours: number; minutes: number } | null>(null)

  const hours12 = to12Hour(value.hours)
  const meridiem = meridiemOf(value.hours)

  return (
    // `modal`, or the wheels cannot take the mouse wheel inside a Dialog: the
    // Dialog's scroll lock cancels every wheel event outside its own content,
    // and this card is portalled to <body>. A modal Popover's lock wins.
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${ariaLabel}, ${pad(hours12)}:${pad(value.minutes)} ${meridiem}`}
          className={cn(
            "flex h-8 items-center gap-2 rounded-md border bg-card px-2 text-xs/relaxed tabular-nums text-foreground outline-none",
            "transition-[border-color,box-shadow] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-ring/30",
            open ? "border-primary" : "border-border",
            className
          )}
        >
          {pad(hours12)}:{pad(value.minutes)} {meridiem}
          <RiTimeLine className="size-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[220px] overflow-hidden p-0"
        // Onto the hour wheel, so the arrow keys work the moment it opens.
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          ;(event.currentTarget as HTMLElement)
            .querySelector<HTMLElement>('[role="spinbutton"]')
            ?.focus({ preventScroll: true })
        }}
        // A click outside keeps what the wheels show — pressing Save is not
        // required. Cancel and Escape still discard it.
        onInteractOutside={() => {
          const draft = draftRef.current
          if (draft && (draft.hours !== value.hours || draft.minutes !== value.minutes)) {
            onChange(draft.hours, draft.minutes)
          }
        }}
      >
        {/* Mounted only while open, so every open starts from the saved value
            rather than from a draft that was cancelled last time. */}
        <WheelCard
          hours12={hours12}
          minutes={value.minutes}
          meridiem={meridiem}
          draftRef={draftRef}
          onCancel={() => setOpen(false)}
          onSave={(h, m, mer) => {
            onChange(to24Hour(h, mer), m)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

function WheelCard({
  hours12,
  minutes,
  meridiem,
  draftRef,
  onCancel,
  onSave,
}: {
  hours12: number
  minutes: number
  meridiem: Meridiem
  draftRef: React.RefObject<{ hours: number; minutes: number } | null>
  onCancel: () => void
  onSave: (hours12: number, minutes: number, meridiem: Meridiem) => void
}) {
  // Positions, not values. A wheel's position is an unbounded integer and its
  // value is the item at that position modulo the list, which is what lets a
  // wheel wrap from 59 to 00 by sliding forward one row rather than spinning
  // back through fifty-nine of them.
  const [hourAt, setHourAt] = React.useState(HOURS.indexOf(hours12))
  const [minuteAt, setMinuteAt] = React.useState(minutes)
  const [meridiemAt, setMeridiemAt] = React.useState(MERIDIEMS.indexOf(meridiem))

  React.useEffect(() => {
    draftRef.current = {
      hours: to24Hour(HOURS[mod(hourAt, HOURS.length)], MERIDIEMS[meridiemAt]),
      minutes: MINUTES[mod(minuteAt, MINUTES.length)],
    }
  }, [draftRef, hourAt, minuteAt, meridiemAt])

  const save = () =>
    onSave(
      HOURS[mod(hourAt, HOURS.length)],
      MINUTES[mod(minuteAt, MINUTES.length)],
      MERIDIEMS[meridiemAt]
    )

  return (
    <div
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault()
          save()
        }
      }}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[6px] text-2xs text-primary-ink outline-none transition-opacity duration-150 hover:opacity-75"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          className="rounded-[6px] text-xs/relaxed font-semibold text-primary-ink outline-none transition-opacity duration-150 hover:opacity-75"
        >
          Save
        </button>
      </div>

      <div className="relative px-2 py-3">
        {/* The band. Drawn behind the wheels, at the middle row. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-2 top-1/2 -translate-y-1/2 rounded-[8px] bg-muted"
          style={{ height: ROW + 4 }}
        />
        <div className="relative flex items-center justify-center">
          <Wheel
            label="Hour"
            items={HOURS}
            at={hourAt}
            wraps
            format={pad}
            onMove={setHourAt}
          />
          <span
            aria-hidden="true"
            className="w-4 text-center font-heading text-sm font-medium text-foreground"
          >
            :
          </span>
          <Wheel
            label="Minute"
            items={MINUTES}
            at={minuteAt}
            wraps
            format={pad}
            onMove={setMinuteAt}
          />
          <Wheel
            label="AM or PM"
            items={MERIDIEMS}
            at={meridiemAt}
            wraps={false}
            format={(m) => m}
            onMove={setMeridiemAt}
            className="ms-4"
          />
        </div>
      </div>
    </div>
  )
}

/**
 * One wheel.
 *
 * Rows are absolutely placed at `(row - at) * ROW` and keyed by their position,
 * so when `at` changes the same DOM nodes glide to their new offsets under a
 * transform transition — that glide is the animation. Only a window of rows
 * around `at` is rendered; it is wider than what shows by the largest single
 * jump (a click two rows away), so rows arriving at the window's edge appear
 * out of sight rather than popping in.
 */
function Wheel<T extends string | number>({
  label,
  items,
  at,
  wraps,
  format,
  onMove,
  className,
}: {
  label: string
  items: T[]
  at: number
  wraps: boolean
  format: (item: T) => string
  onMove: (at: number) => void
  className?: string
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const half = Math.floor(VISIBLE / 2)
  const reach = half + 2

  const clamp = (next: number) =>
    wraps ? next : Math.min(items.length - 1, Math.max(0, next))
  const move = (next: number) => {
    const target = clamp(next)
    if (target !== at) onMove(target)
  }

  // The latest `move` and `at`, for the native listener below, which is
  // attached once.
  const moveRef = React.useRef(move)
  const atRef = React.useRef(at)
  React.useEffect(() => {
    moveRef.current = move
    atRef.current = at
  })

  // A native listener, not React's `onWheel`: React registers wheel handlers
  // as passive, so `preventDefault` there is ignored and the page scrolls too.
  React.useEffect(() => {
    const node = ref.current
    if (!node) return
    let carried = 0
    let lastAt = 0
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const now = event.timeStamp
      if (now - lastAt > 150) carried = 0
      lastAt = now
      // A mouse notch is one row. A trackpad sends a stream of small deltas,
      // which are summed and spent a row at a time.
      if (Math.abs(event.deltaY) >= 50) {
        carried = 0
        moveRef.current(atRef.current + Math.sign(event.deltaY))
        return
      }
      carried += event.deltaY
      if (Math.abs(carried) >= 30) {
        moveRef.current(atRef.current + Math.sign(carried))
        carried = 0
      }
    }
    node.addEventListener("wheel", onWheel, { passive: false })
    return () => node.removeEventListener("wheel", onWheel)
  }, [])

  const rows: number[] = []
  for (let row = at - reach; row <= at + reach; row++) {
    if (wraps || (row >= 0 && row < items.length)) rows.push(row)
  }

  const current = items[mod(at, items.length)]

  return (
    <div
      ref={ref}
      role="spinbutton"
      tabIndex={0}
      aria-label={label}
      aria-valuetext={format(current)}
      className={cn(
        "relative w-12 overflow-hidden rounded-[8px] outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
        className
      )}
      style={{ height: ROW * VISIBLE }}
      onKeyDown={(event) => {
        if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return
        event.preventDefault()
        move(at + (event.key === "ArrowDown" ? 1 : -1))
      }}
    >
      {rows.map((row) => {
        const offset = row - at
        const selected = offset === 0
        return (
          <div
            key={row}
            aria-hidden="true"
            onClick={() => move(row)}
            className={cn(
              "absolute inset-x-0 flex cursor-default items-center justify-center tabular-nums select-none",
              "transition-[transform,color] duration-300 ease-out will-change-transform",
              selected
                ? "font-heading text-sm font-medium text-foreground"
                : "text-xs/relaxed text-muted-foreground hover:text-muted-foreground"
            )}
            style={{
              top: ROW * half,
              height: ROW,
              transform: `translateY(${offset * ROW}px)`,
            }}
          >
            {format(items[mod(row, items.length)])}
          </div>
        )
      })}
    </div>
  )
}

/**
 * One two-digit field of the clock.
 *
 * Kept as a local draft while focused so a half-typed "1" on its way to "12" is
 * not clamped to 01 under the cursor — the parent only hears values that are
 * actually in range. Arrow keys step and wrap, which is how every native time
 * field behaves and the only way to change the value without the hands leaving
 * home position.
 */
function TimeUnit({
  value,
  min,
  max,
  size,
  onCommit,
  "aria-label": ariaLabel,
}: {
  value: number | null
  min: number
  max: number
  size: "sm" | "md"
  onCommit: (value: number) => void
  "aria-label": string
}) {
  const [draft, setDraft] = React.useState<string | null>(null)
  const shown = draft ?? (value === null ? "" : String(value).padStart(2, "0"))

  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label={ariaLabel}
      placeholder="--"
      value={shown}
      size={2}
      maxLength={2}
      /* `focus-visible:shadow-none`: index.css halos every focusable element
         globally, and the wrapper around these two fields already draws that
         ring — without this the clock shows a halo inside a halo. */
      className={cn(
        "w-6 bg-transparent text-center tabular-nums text-foreground outline-none focus-visible:shadow-none placeholder:text-muted-foreground/60",
        size === "sm" ? "text-xs/relaxed" : "text-xs/relaxed"
      )}
      onChange={(event) => {
        const digits = event.target.value.replace(/\D/g, "").slice(0, 2)
        setDraft(digits)
        const parsed = Number(digits)
        if (digits !== "" && parsed >= min && parsed <= max) onCommit(parsed)
      }}
      onKeyDown={(event) => {
        if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return
        event.preventDefault()
        setDraft(null)
        onCommit(
          stepWrapped(value ?? min, event.key === "ArrowUp" ? 1 : -1, min, max)
        )
      }}
      onFocus={(event) => event.currentTarget.select()}
      onBlur={() => setDraft(null)}
    />
  )
}

export default TimeField
