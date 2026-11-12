import { useLayoutEffect, useRef, useState } from "react";

import { meridiemOf, to12Hour } from "@/lib/datetime-value";
import {
  clampTime,
  middleIndex,
  recentre,
  timeOptions,
  WHEEL_COPIES,
  wheelIndex,
  wheelValue,
} from "@/lib/wheel";
import { cn } from "@/lib/utils";

/**
 * A time picked on wheels, as iOS does: hour, minute and AM/PM. Scrolling (wheel,
 * trackpad, a finger) snaps a row into the band in the middle; clicking a row brings it there;
 * with a wheel focused, ↑ / ↓ step it, Page Up / Page Down step by five, Home / End go to its ends.
 * `value` is any Date: only its hours and minutes change, so the day is kept.
 *
 * To assistive technology each wheel is one spinbutton saying its value; its rows are hidden, or a
 * screen reader would walk hundreds of them. A touch screen reader sends no arrow keys, so each
 * wheel also has two buttons only it can reach.
 *
 * With `min`, a time before it is never offered (owner): on `min`'s day the wheels hold only
 * `min` and later and stop looping (`timeOptions`); any other day they loop for ever.
 */
export function WheelTimePicker({
  value,
  onChange,
  min = null,
  className,
}: {
  value: Date;
  onChange: (next: Date) => void;
  min?: Date | null;
  className?: string;
}) {
  const options = timeOptions(value, min);
  const hours24 = value.getHours();
  const minutes = value.getMinutes();
  const set = (h24: number, m: number) => {
    const next = new Date(value);
    next.setHours(h24, m, 0, 0);
    // A wheel that changes another's list (an hour that starts now) lands on its earliest.
    onChange(clampTime(next, min));
  };
  const meridiem = meridiemOf(hours24);
  return (
    <div
      aria-label="Time"
      // On a short screen (a small iPhone in Safari, any phone on its side) three rows, not five.
      className={cn(
        "relative flex items-stretch justify-center gap-1 px-2 [@media(max-height:620px)]:[--wheel-fade:20%] [@media(max-height:620px)]:[--wheel-rows:3]",
        className,
      )}
      role="group"
    >
      {/* The band the chosen row sits in, behind the wheels. Forced colours drop backgrounds. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-2 top-1/2 -translate-y-1/2 rounded-md bg-muted forced-colors:border forced-colors:border-[CanvasText]"
        data-band
        style={{ height: ROW }}
      />
      {/* Keyed by their lists: a wheel whose list changes opens again on its value. */}
      <Wheel
        key={`h-${options.hours.join(",")}`}
        label="Hour"
        loop={options.hours.length === 12}
        onChange={(h24) => set(h24, minutes)}
        options={options.hours}
        render={(h24) => String(to12Hour(h24))}
        value={hours24}
      />
      <Wheel
        key={`m-${options.minutes[0]}-${options.minutes.length}`}
        label="Minute"
        // A whole hour ahead today still loops: only a cut-short list has an end.
        loop={options.minutes.length === 60}
        onChange={(m) => set(hours24, m)}
        options={options.minutes}
        render={(m) => String(m).padStart(2, "0")}
        value={minutes}
      />
      <Wheel
        key={`p-${options.meridiems.join(",")}`}
        label="AM or PM"
        narrow
        onChange={(index) => {
          const pm = options.meridiems[index] === "PM";
          set((hours24 % 12) + (pm ? 12 : 0), minutes);
        }}
        options={options.meridiems.map((_, index) => index)}
        render={(index) => options.meridiems[index] ?? ""}
        value={Math.max(0, (options.meridiems as readonly string[]).indexOf(meridiem))}
      />
    </div>
  );
}

/**
 * Row height in px; the middle row shown is the chosen one. In px, never rem: the
 * desktop's root font is 110%, and a 2rem row (35.2 px) against this 32 drifted
 * a row per long scroll and moved the hour as the picker opened.
 */
const ROW = 32;
/** How long a scroll must rest before it counts as settled (Safari has no `scrollend` yet). */
const SETTLE_MS = 120;
/** Fades the rows away from the band, as the iOS wheel does. Inline, with Safari's older name. */
const FADE =
  "linear-gradient(to bottom, transparent, black var(--wheel-fade, 35%), black calc(100% - var(--wheel-fade, 35%)), transparent)";

function Wheel({
  options,
  value,
  onChange,
  render,
  label,
  loop = false,
  narrow = false,
}: {
  /** The values, in order; a looping wheel repeats them. */
  options: number[];
  value: number;
  onChange: (value: number) => void;
  render: (value: number) => string;
  label: string;
  loop?: boolean;
  narrow?: boolean;
}) {
  const count = Math.max(1, options.length);
  const valueAt = (row: number) => options[wheelValue(row, count)] ?? value;
  const scroller = useRef<HTMLDivElement>(null);
  const rows = loop ? count * WHEEL_COPIES : count;
  const position = Math.max(0, options.indexOf(value));
  const startRow = loop ? middleIndex(position, count) : position;
  // The centred row, for styling; follows the scroll, not `value`, so it moves under the finger.
  const [centre, setCentre] = useState(startRow);
  const settle = useRef<number | undefined>(undefined);
  const lastSent = useRef(value);
  // Where a smooth scroll is heading: held ↑ steps from there, not from a row still passing by.
  const heading = useRef<number | null>(null);

  // Open on the current value, without animating there.
  useLayoutEffect(() => {
    if (scroller.current) scroller.current.scrollTop = startRow * ROW;
    // Only on mount (a new list remounts it): later values come from its own scrolling.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goTo = (row: number) => {
    // A step while one is still gliding jumps instead, so a held key keeps pace with the wheel.
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior = heading.current === null && !calm ? "smooth" : "auto";
    heading.current = row;
    scroller.current?.scrollTo({ top: row * ROW, behavior });
  };

  const onScroll = () => {
    const element = scroller.current;
    if (!element) return;
    const row = Math.max(0, Math.min(rows - 1, wheelIndex(element.scrollTop, ROW)));
    if (row !== centre) setCentre(row);
    const next = valueAt(row);
    if (next !== lastSent.current) {
      lastSent.current = next;
      onChange(next);
    }
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => {
      heading.current = null;
      if (!loop || !scroller.current) return;
      const home = recentre(wheelIndex(scroller.current.scrollTop, ROW), count);
      if (home * ROW !== scroller.current.scrollTop) {
        scroller.current.scrollTop = home * ROW;
        setCentre(home);
      }
    }, SETTLE_MS);
  };

  const step = (delta: number) => {
    const from = heading.current ?? centre;
    // A looping wheel near its ends jumps home first, so a held key never reaches the last row.
    const base = loop ? recentre(from, count) : from;
    if (loop && base !== from && scroller.current) {
      scroller.current.scrollTop = scroller.current.scrollTop + (base - from) * ROW;
    }
    goTo(loop ? base + delta : Math.max(0, Math.min(count - 1, base + delta)));
  };

  return (
    // The ring is out here: on the wheel itself the fade would cut it off.
    <div
      className={cn(
        "relative z-10 rounded-md has-[[role=spinbutton]:focus-visible]:ring-2 has-[[role=spinbutton]:focus-visible]:ring-ring/50",
        narrow ? "w-12" : "w-14",
      )}
    >
      <button
        aria-label={`${label}: next`}
        className="sr-only"
        onClick={() => step(1)}
        tabIndex={-1}
        type="button"
      />
      <button
        aria-label={`${label}: previous`}
        className="sr-only"
        onClick={() => step(-1)}
        tabIndex={-1}
        type="button"
      />
      <div
        aria-label={label}
        aria-valuemax={options[options.length - 1]}
        aria-valuemin={options[0]}
        aria-valuenow={value}
        aria-valuetext={render(value)}
        className="no-scrollbar w-full touch-pan-y snap-y snap-mandatory overflow-y-auto overscroll-contain outline-none"
        onKeyDown={(event) => {
          if (event.key === "Home" || event.key === "End") {
            event.preventDefault();
            const end = event.key === "Home" ? 0 : count - 1;
            goTo(loop ? middleIndex(end, count) : end);
            return;
          }
          const deltas: Record<string, number> = { ArrowUp: 1, ArrowDown: -1, PageUp: 5, PageDown: -5 };
          const delta = deltas[event.key];
          if (delta === undefined) return;
          event.preventDefault();
          // ↑ makes the value larger: the next row, below, comes into the band.
          step(delta);
        }}
        onScroll={onScroll}
        ref={scroller}
        role="spinbutton"
        style={{
          // Rows shown, by CSS (5, or 3 when short). A row's scroll offset is row × ROW whatever this
          // is, because the padding always leaves the first row in the middle.
          height: `calc(var(--wheel-rows, 5) * ${ROW}px)`,
          paddingBlock: `calc((var(--wheel-rows, 5) - 1) / 2 * ${ROW}px)`,
          maskImage: FADE,
          WebkitMaskImage: FADE,
        }}
        tabIndex={0}
      >
        {Array.from({ length: rows }, (_, row) => {
          const distance = Math.abs(row - centre);
          return (
            <div
              aria-hidden
              className={cn(
                "flex cursor-pointer snap-center items-center justify-center text-sm tabular-nums transition-colors select-none",
                distance === 0
                  ? "font-medium text-foreground"
                  : distance === 1
                    ? "text-muted-foreground"
                    : "text-muted-foreground/60",
              )}
              key={row}
              onClick={() => goTo(row)}
              style={{ height: ROW }}
            >
              {render(valueAt(row))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
