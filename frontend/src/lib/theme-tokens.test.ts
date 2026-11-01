import { describe, expect, it } from "vitest";
import { toastSurfaceClass } from "@/lib/theme-tokens";

describe("toastSurfaceClass", () => {
  it("maps toast types onto semantic container tokens", () => {
    expect(toastSurfaceClass()).toBe(
      "border-border bg-surface-container text-foreground",
    );
    expect(toastSurfaceClass("success")).toBe(
      "border-success bg-success-container text-success-container-foreground",
    );
    expect(toastSurfaceClass("info")).toBe(
      "border-info bg-info-container text-info-container-foreground",
    );
    expect(toastSurfaceClass("warning")).toBe(
      "border-warning bg-warning-container text-warning-container-foreground",
    );
    expect(toastSurfaceClass("error")).toBe(
      "border-destructive bg-destructive-container text-destructive-container-foreground",
    );
    expect(toastSurfaceClass("loading")).toBe(
      "border-border bg-surface-container text-foreground",
    );
  });
});
