import { describe, expect, it } from "vitest";
import { movedSortKey, sortKeyBeforeFirst } from "./sort-keys";

describe("master sort keys", () => {
  it("places a new row before the first key", () => {
    expect(sortKeyBeforeFirst(null)).toBe("a0");
    expect(sortKeyBeforeFirst("a0")).toBe("Zz");
    expect(sortKeyBeforeFirst("Zz") < "Zz").toBe(true);
  });

  it("builds a key between the neighbors after a move", () => {
    const items = [
      { id: 1, sortKey: "a0" },
      { id: 2, sortKey: "a1" },
      { id: 3, sortKey: "a2" },
    ];

    const movedDown = movedSortKey(items, 1, 3);
    expect(movedDown?.id).toBe(1);
    expect(movedDown && movedDown.sortKey > "a1").toBe(true);
    expect(movedDown && movedDown.sortKey > "a2").toBe(true);

    const movedUp = movedSortKey(items, 3, 1);
    expect(movedUp?.sortKey === "a0").toBe(false);
    expect(movedUp && movedUp.sortKey < "a0").toBe(true);

    expect(movedSortKey(items, 2, 2)).toBeNull();
  });
});
