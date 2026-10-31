import { Variant } from "@material/material-color-utilities";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_CONTRAST,
  DEFAULT_PRIMARY,
  DEFAULT_RADIUS,
  DEFAULT_THEME,
  VARIANT_NAMES,
  generateThemeCss,
  parseThemeArgs,
  themeHelpText,
} from "./theme.ts";

function enumCliNames(): string[] {
  return Object.keys(Variant)
    .filter((key) => Number.isNaN(Number(key)))
    .map((key) => key.toLowerCase().replaceAll("_", "-"));
}

describe("theme generator arguments", () => {
  it("lists every DynamicScheme variant the library exports", () => {
    expect(VARIANT_NAMES).toEqual(enumCliNames());
    expect(VARIANT_NAMES).toEqual(
      expect.arrayContaining([
        "monochrome",
        "neutral",
        "tonal-spot",
        "vibrant",
        "expressive",
        "fidelity",
        "content",
        "rainbow",
        "fruit-salad",
      ]),
    );
    expect(VARIANT_NAMES).not.toContain("android");
  });

  it("accepts each variant and names them when one is unknown", () => {
    for (const name of VARIANT_NAMES) {
      expect(parseThemeArgs([`--variant=${name}`]).variant).toBe(name);
    }
    expect(() => parseThemeArgs(["--variant=nope"])).toThrow(
      `Unknown variant "nope". Expected one of: ${VARIANT_NAMES.join(", ")}.`,
    );
  });

  it("validates contrastLevel in -1..1 and defaults to 0", () => {
    expect(parseThemeArgs([]).contrast).toBe(DEFAULT_CONTRAST);
    expect(parseThemeArgs(["--contrast=-1"]).contrast).toBe(-1);
    expect(parseThemeArgs(["--contrast=0"]).contrast).toBe(0);
    expect(parseThemeArgs(["--contrast=1"]).contrast).toBe(1);
    expect(parseThemeArgs(["--contrast=0.5"]).contrast).toBe(0.5);
    expect(() => parseThemeArgs(["--contrast=1.0001"])).toThrow(/-1\.\.1/);
    expect(() => parseThemeArgs(["--contrast=-1.1"])).toThrow(/-1\.\.1/);
    expect(() => parseThemeArgs(["--contrast=abc"])).toThrow(/-1 to 1/);
    expect(() => parseThemeArgs(["--contrast="])).toThrow(/-1 to 1/);
  });

  it("accepts rem and px radii and rejects other lengths", () => {
    const parsed = parseThemeArgs([
      "--radius-sm=0.25rem",
      "--radius-md=4px",
      "--radius-lg=0.375REM",
      "--radius-xl=.5rem",
    ]);
    expect(parsed.radius).toEqual({
      sm: "0.25rem",
      md: "4px",
      lg: "0.375rem",
      xl: ".5rem",
    });
    expect(parseThemeArgs([]).radius).toEqual({ ...DEFAULT_RADIUS });
    expect(() => parseThemeArgs(["--radius-sm=4"])).toThrow(/rem or px/);
    expect(() => parseThemeArgs(["--radius-md=4em"])).toThrow(/rem or px/);
    expect(() => parseThemeArgs(["--radius-lg=-1px"])).toThrow(/rem or px/);
    expect(() => parseThemeArgs(["--radius-xl="])).toThrow(/rem or px/);
  });

  it("describes every flag and default in --help", () => {
    const help = themeHelpText();
    expect(parseThemeArgs(["--help", "--variant=nope"]).help).toBe(true);
    for (const flag of [
      "--variant=",
      "--contrast=",
      "--success=",
      "--info=",
      "--warning=",
      "--radius-sm=",
      "--radius-md=",
      "--radius-lg=",
      "--radius-xl=",
      "--check",
      "--help",
    ]) {
      expect(help).toContain(flag);
    }
    expect(help).toContain(DEFAULT_THEME.variant);
    expect(help).toContain(String(DEFAULT_CONTRAST));
    expect(help).toContain(DEFAULT_PRIMARY);
    expect(help).toContain(DEFAULT_THEME.success);
    expect(help).toContain(DEFAULT_THEME.info);
    expect(help).toContain(DEFAULT_THEME.warning);
    for (const name of VARIANT_NAMES) {
      expect(help).toContain(name);
    }
    for (const length of Object.values(DEFAULT_RADIUS)) {
      expect(help).toContain(length);
    }
  });
});

describe("theme generator output", () => {
  it("emits the default radius scale and the previous default palette", () => {
    const css = generateThemeCss(DEFAULT_THEME);
    expect(css).toContain("--radius-sm: 0.375rem;");
    expect(css).toContain("--radius-md: 0.5rem;");
    expect(css).toContain("--radius-lg: 0.75rem;");
    expect(css).toContain("--radius: var(--radius-lg);");
    expect(css).toContain("--radius-xl: 1.25rem;");
    expect(css).toContain(
      "variant: tonal-spot  contrast: 0  success: #1b873f  info: #0277bd  warning: #f9a825  radius-sm: 0.375rem  radius-md: 0.5rem  radius-lg: 0.75rem  radius-xl: 1.25rem",
    );
    expect(css).toContain("--background: #faf8ff;");
    expect(css).toContain("--primary: #4a5d92;");
    expect(css).toContain("--primary-foreground: #ffffff;");
    expect(css).toContain("--outline: #757680;");
    expect(css).toContain("--outline-variant: #c5c6d0;");
    expect(css).toContain("--input: #c5c6d0;");
  });

  it("writes custom radii into the stylesheet and the header", () => {
    const css = generateThemeCss({
      ...DEFAULT_THEME,
      radius: {
        sm: "2px",
        md: "0.25rem",
        lg: "0.375rem",
        xl: "0.5rem",
      },
    });
    expect(css).toContain("--radius-sm: 2px;");
    expect(css).toContain("--radius-md: 0.25rem;");
    expect(css).toContain("--radius-lg: 0.375rem;");
    expect(css).toContain("--radius-xl: 0.5rem;");
    expect(css).toContain(
      "radius-sm: 2px  radius-md: 0.25rem  radius-lg: 0.375rem  radius-xl: 0.5rem",
    );
    expect(css).toContain("--primary: #4a5d92;");
  });

  it("passes contrastLevel through to primary, on-primary, and outline", () => {
    const css = generateThemeCss({ ...DEFAULT_THEME, contrast: 1 });
    expect(css).toContain("contrast: 1");
    expect(css).toContain("--primary: #14295c;");
    expect(css).toContain("--primary-foreground: #ffffff;");
    expect(css).toContain("--outline: #2a2c34;");
    expect(css).toContain("--outline-variant: #474951;");
    expect(css).not.toContain("--primary: #4a5d92;");
  });
});
