import { cn } from "@/lib/utils";

/**
 * Delay per square, in cycle order — NOT in DOM order.
 *
 * The grid fills top-left, top-right, bottom-left, bottom-right, so these run
 * the pulse CLOCKWISE around the square: TL, TR, BR, BL. Sorting them into
 * 0/0.2/0.4/0.6 would read as a Z and looks like the obvious fix, which is
 * exactly why it is worth saying that it is not one.
 */
const DELAYS = ["0s", "0.2s", "0.6s", "0.4s"];

/**
 * A four-square cascade, for work that takes minutes rather than moments.
 *
 * A spinner says "wait"; it turns at the same rate whether a request is one
 * second from returning or four minutes. This says "something is progressing"
 * — the pulse travels, so a glance tells you the page is alive without
 * implying it is nearly done. Used where a render or a plan is running.
 *
 * Squares are painted in `currentColor`, so it takes the colour of whatever it
 * sits in rather than carrying one of its own.
 */
function CascadeLoader({
  className,
  label = "Loading",
  ...props
}: React.ComponentProps<"div"> & { label?: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      // Sized by the caller through className. The cells are fractions and the
      // gap is a percentage, so one size class scales the whole thing instead
      // of leaving 10px squares inside a 14px box.
      className={cn("grid size-[23px] grid-cols-2 grid-rows-2 gap-[13%]", className)}
      {...props}
    >
      {DELAYS.map((delay) => (
        <span
          key={delay}
          className="rounded-[2px] bg-current animate-[cascade-square_1.6s_ease-in-out_infinite] motion-reduce:animate-none motion-reduce:opacity-40"
          style={{ animationDelay: delay }}
        />
      ))}
    </div>
  );
}

export { CascadeLoader };
