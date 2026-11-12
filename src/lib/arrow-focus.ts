import type { KeyboardEvent } from "react";

/**
 * ← / → move focus along a row of buttons, such as a confirm's Cancel and Delete. Cancel takes
 * focus first, so Enter alone never deletes; reaching Delete is one arrow press, no pointer needed.
 * Stops at the ends instead of wrapping, so → always lands on the button to the right.
 */
export function moveFocusWithArrows(event: KeyboardEvent<HTMLElement>) {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (!(event.target instanceof HTMLButtonElement)) return;
  const buttons = Array.from(
    event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"),
  );
  const at = buttons.indexOf(event.target);
  if (at === -1) return;
  const next = buttons[at + (event.key === "ArrowRight" ? 1 : -1)];
  if (!next) return;
  event.preventDefault();
  next.focus();
}
