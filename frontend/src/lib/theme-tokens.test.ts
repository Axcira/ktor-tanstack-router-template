import { describe, expect, it } from "vitest";
import { sonnerToastCssVars } from "@/lib/theme-tokens";

describe("sonnerToastCssVars", () => {
  it("maps Sonner rich-color variables onto semantic tokens", () => {
    expect(sonnerToastCssVars["--normal-bg"]).toBe("var(--surface-container)");
    expect(sonnerToastCssVars["--normal-text"]).toBe("var(--foreground)");
    expect(sonnerToastCssVars["--normal-border"]).toBe("var(--border)");
    expect(sonnerToastCssVars["--success-bg"]).toBe("var(--success-container)");
    expect(sonnerToastCssVars["--success-text"]).toBe(
      "var(--success-container-foreground)",
    );
    expect(sonnerToastCssVars["--success-border"]).toBe("var(--success)");
    expect(sonnerToastCssVars["--info-bg"]).toBe("var(--info-container)");
    expect(sonnerToastCssVars["--warning-bg"]).toBe("var(--warning-container)");
    expect(sonnerToastCssVars["--error-bg"]).toBe(
      "var(--destructive-container)",
    );
    expect(sonnerToastCssVars["--error-text"]).toBe(
      "var(--destructive-container-foreground)",
    );
    expect(sonnerToastCssVars["--error-border"]).toBe("var(--destructive)");
  });
});
