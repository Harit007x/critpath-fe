/** Whether shortcuts use ⌘ (Apple) rather than Ctrl. */
export const mac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
