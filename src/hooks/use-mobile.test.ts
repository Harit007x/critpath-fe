import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import { useIsMobile } from "./use-mobile";

/** Renders once with no effects, so this is what the hook answers on a page's first render. */
const firstRender = () => {
  const Probe = () => createElement("p", null, String(useIsMobile()));
  return renderToString(createElement(Probe));
};

describe("useIsMobile", () => {
  const original = window.innerWidth;
  const setWidth = (value: number) =>
    Object.defineProperty(window, "innerWidth", { configurable: true, value });

  afterEach(() => setWidth(original));

  // Answering false until its effect ran sent a phone's already-loaded Notes to the latest note.
  it("knows a phone on the first render", () => {
    setWidth(390);
    expect(firstRender()).toContain("true");
  });

  it("knows a wide screen on the first render", () => {
    setWidth(1400);
    expect(firstRender()).toContain("false");
  });
});
