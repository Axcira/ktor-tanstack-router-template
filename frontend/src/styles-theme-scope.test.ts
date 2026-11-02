import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const frontendRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("theme preview CSS scope", () => {
  it("excludes theme-preview-light from the Tailwind dark variant", () => {
    const styles = readFileSync(join(frontendRoot, "src/styles.css"), "utf8");
    expect(styles).toMatch(
      /@custom-variant dark \(&:where\(\.dark, \.dark \*, \.theme-preview-dark, \.theme-preview-dark \*\):not\(:where\(\.theme-preview-light, \.theme-preview-light \*\)\)\);/,
    );
  });

  it("sets color-scheme on theme preview scopes", () => {
    const theme = readFileSync(
      join(frontendRoot, "src/theme.generated.css"),
      "utf8",
    );
    expect(theme).toMatch(
      /\.theme-preview-light \{\s*\n\s*color-scheme: light;/,
    );
    expect(theme).toMatch(/\.theme-preview-dark \{\s*\n\s*color-scheme: dark;/);
  });

  it("paints each preview scope with its own background token", () => {
    const theme = readFileSync(
      join(frontendRoot, "src/theme.generated.css"),
      "utf8",
    );
    for (const selector of [".theme-preview-light", ".theme-preview-dark"]) {
      const block = theme.match(
        new RegExp(`${selector.replace(".", "\\.")} \\{[\\s\\S]*?\\n\\}`),
      );
      expect(block, selector).toBeTruthy();
      expect(block?.[0]).toContain("background-color: var(--background);");
      expect(block?.[0]).toContain("color: var(--foreground);");
    }
  });
});
