import { describe, expect, it } from "vitest";
import { lineHasOpenSelect } from "./select-check.ts";

describe("lineHasOpenSelect", () => {
  it("matches an opening select tag, including one split before its attributes", () => {
    expect(lineHasOpenSelect("<select")).toBe(true);
    expect(lineHasOpenSelect("<select className=\"x\">")).toBe(true);
    expect(lineHasOpenSelect("  <select>")).toBe(true);
  });

  it("does not match a closing tag or a longer element name", () => {
    expect(lineHasOpenSelect("</select>")).toBe(false);
    expect(lineHasOpenSelect("<selectable />")).toBe(false);
    expect(lineHasOpenSelect("const selected = true")).toBe(false);
  });
});
