/** The nearest ancestor that scrolls vertically, or null when the page itself scrolls. */
export function scrollParent(el: HTMLElement): HTMLElement | null {
  let node = el.parentElement;
  while (node && !/auto|scroll/.test(getComputedStyle(node).overflowY))
    node = node.parentElement;
  return node;
}
