import { describe, expect, it } from "vitest";
import {
  radiusIssuesInSource,
  radiusUtility,
} from "./radius-check.ts";

function reasons(source: string): string[] {
  return radiusIssuesInSource(source).map((issue) => issue.reason);
}

describe("radius utility extraction", () => {
  it("strips bracketed variants at the last top-level colon", () => {
    expect(
      radiusUtility("md:peer-data-[variant=inset]:rounded-3xl"),
    ).toBe("rounded-3xl");
    expect(radiusUtility("[&>div]:rounded-3xl")).toBe("rounded-3xl");
    expect(radiusUtility("[&:nth-child(2)]:rounded-xl")).toBe("rounded-xl");
  });

  it("strips named group variants", () => {
    expect(radiusUtility("group-hover/item:rounded-3xl")).toBe("rounded-3xl");
  });

  it("strips the important marker", () => {
    expect(radiusUtility("!rounded-3xl")).toBe("rounded-3xl");
    expect(radiusUtility("md:!rounded-lg")).toBe("rounded-lg");
  });

  it("keeps an allowed utility behind stacked variants", () => {
    expect(radiusUtility("sm:hover:rounded-md")).toBe("rounded-md");
    expect(radiusUtility("dark:sm:hover:focus:rounded-lg")).toBe("rounded-lg");
  });
});

describe("radiusIssuesInSource", () => {
  it("rejects bypasses that the old prefix regex missed", () => {
    const source = [
      'className="md:peer-data-[variant=inset]:rounded-3xl"',
      'className="group-hover/item:rounded-3xl"',
      'className="[&>div]:rounded-3xl"',
      'className="!rounded-3xl"',
    ].join("\n");
    const issues = radiusIssuesInSource(source);
    expect(issues).toHaveLength(4);
    expect(issues.every((issue) => issue.reason.includes("3xl"))).toBe(true);
  });

  it("accepts stacked variants of an allowed radius", () => {
    expect(
      reasons('className={cn("flex", "sm:hover:rounded-md")}'),
    ).toEqual([]);
    expect(
      reasons("md:peer-data-[variant=inset]:rounded-lg"),
    ).toEqual([]);
  });

  it("still rejects bare and arbitrary radii", () => {
    expect(reasons('className="rounded"')[0]).toMatch(/bare rounded/);
    expect(reasons('className="rounded-[8px]"')[0]).toMatch(/arbitrary/);
  });
});
