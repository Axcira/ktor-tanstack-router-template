#!/usr/bin/env bun
/**
 * Material Design 3 theme generator (matugen-style).
 * Usage:
 *   bun run theme [seedHex] [--variant=tonal-spot] [--check]
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  type DynamicScheme,
  Hct,
  SchemeContent,
  SchemeExpressive,
  SchemeFidelity,
  SchemeFruitSalad,
  SchemeMonochrome,
  SchemeNeutral,
  SchemeRainbow,
  SchemeTonalSpot,
  SchemeVibrant,
  alphaFromArgb,
  argbFromHex,
  blueFromArgb,
  greenFromArgb,
  redFromArgb,
} from "@material/material-color-utilities";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = join(scriptDir, "..");
const outputPath = join(frontendRoot, "src/theme.generated.css");

/** Legacy template primary before MD3 migration: oklch(0.541 0.235 259.6) */
const DEFAULT_SEED_OKLCH = { l: 0.541, c: 0.235, h: 259.6 };

const VARIANTS = {
  "tonal-spot": SchemeTonalSpot,
  vibrant: SchemeVibrant,
  expressive: SchemeExpressive,
  monochrome: SchemeMonochrome,
  neutral: SchemeNeutral,
  fidelity: SchemeFidelity,
  content: SchemeContent,
  rainbow: SchemeRainbow,
  "fruit-salad": SchemeFruitSalad,
} as const;

type VariantName = keyof typeof VARIANTS;

type Md3Role =
  | "primary"
  | "onPrimary"
  | "primaryContainer"
  | "onPrimaryContainer"
  | "secondary"
  | "onSecondary"
  | "secondaryContainer"
  | "onSecondaryContainer"
  | "tertiary"
  | "onTertiary"
  | "tertiaryContainer"
  | "onTertiaryContainer"
  | "error"
  | "onError"
  | "errorContainer"
  | "onErrorContainer"
  | "surface"
  | "onSurface"
  | "onSurfaceVariant"
  | "surfaceContainerLow"
  | "surfaceContainer"
  | "surfaceContainerHigh"
  | "surfaceContainerHighest"
  | "outline"
  | "outlineVariant"
  | "inversePrimary";

function oklchToArgb(l: number, c: number, hDeg: number): number {
  const h = (hDeg * Math.PI) / 180;
  const a = c * Math.cos(h);
  const b = c * Math.sin(h);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const L = l_ ** 3;
  const M = m_ ** 3;
  const S = s_ ** 3;
  let r = +4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S;
  let g = -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S;
  let bl = -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S;
  const linearize = (x: number) => {
    x = Math.max(0, Math.min(1, x));
    return x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
  };
  const to8 = (x: number) => Math.round(Math.max(0, Math.min(1, x)) * 255);
  r = linearize(r);
  g = linearize(g);
  bl = linearize(bl);
  return (255 << 24) | (to8(r) << 16) | (to8(g) << 8) | to8(bl);
}

function argbToOklch(argb: number): string {
  const a = alphaFromArgb(argb);
  let r = redFromArgb(argb) / 255;
  let g = greenFromArgb(argb) / 255;
  let b = blueFromArgb(argb) / 255;
  const toLinear = (c: number) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  r = toLinear(r);
  g = toLinear(g);
  b = toLinear(b);
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  const C = Math.hypot(A, B);
  let H = (Math.atan2(B, A) * 180) / Math.PI;
  if (H < 0) H += 360;
  const alpha =
    a < 255 ? ` / ${(a / 255).toFixed(3).replace(/0+$/, "").replace(/\.$/, "") || "0"}` : "";
  if (C < 0.0001) {
    return `oklch(${L.toFixed(3)} 0 0${alpha})`;
  }
  return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)}${alpha})`;
}

function resolveRole(scheme: DynamicScheme, role: Md3Role): number {
  const colors = scheme.colors;
  const map: Record<Md3Role, () => { getArgb: (s: DynamicScheme) => number }> = {
    primary: () => colors.primary(),
    onPrimary: () => colors.onPrimary(),
    primaryContainer: () => colors.primaryContainer(),
    onPrimaryContainer: () => colors.onPrimaryContainer(),
    secondary: () => colors.secondary(),
    onSecondary: () => colors.onSecondary(),
    secondaryContainer: () => colors.secondaryContainer(),
    onSecondaryContainer: () => colors.onSecondaryContainer(),
    tertiary: () => colors.tertiary(),
    onTertiary: () => colors.onTertiary(),
    tertiaryContainer: () => colors.tertiaryContainer(),
    onTertiaryContainer: () => colors.onTertiaryContainer(),
    error: () => colors.error(),
    onError: () => colors.onError(),
    errorContainer: () => colors.errorContainer(),
    onErrorContainer: () => colors.onErrorContainer(),
    surface: () => colors.surface(),
    onSurface: () => colors.onSurface(),
    onSurfaceVariant: () => colors.onSurfaceVariant(),
    surfaceContainerLow: () => colors.surfaceContainerLow(),
    surfaceContainer: () => colors.surfaceContainer(),
    surfaceContainerHigh: () => colors.surfaceContainerHigh(),
    surfaceContainerHighest: () => colors.surfaceContainerHighest(),
    outline: () => colors.outline(),
    outlineVariant: () => colors.outlineVariant(),
    inversePrimary: () => colors.inversePrimary(),
  };
  return map[role]().getArgb(scheme);
}

function pick(scheme: DynamicScheme, role: Md3Role): string {
  return argbToOklch(resolveRole(scheme, role));
}

function borderColor(scheme: DynamicScheme, isDark: boolean): string {
  if (isDark) {
    return "oklch(1 0 0 / 12%)";
  }
  return pick(scheme, "outlineVariant");
}

function inputColor(scheme: DynamicScheme, isDark: boolean): string {
  if (isDark) {
    return "oklch(1 0 0 / 16%)";
  }
  return pick(scheme, "outlineVariant");
}

function buildSchemeBlock(scheme: DynamicScheme, isDark: boolean): string {
  const lines: Record<string, string> = {
    background: pick(scheme, "surface"),
    foreground: pick(scheme, "onSurface"),
    card: pick(scheme, "surfaceContainerLow"),
    "card-foreground": pick(scheme, "onSurface"),
    popover: pick(scheme, "surfaceContainer"),
    "popover-foreground": pick(scheme, "onSurface"),
    primary: pick(scheme, "primary"),
    "primary-foreground": pick(scheme, "onPrimary"),
    secondary: pick(scheme, "secondaryContainer"),
    "secondary-foreground": pick(scheme, "onSecondaryContainer"),
    muted: pick(scheme, "surfaceContainerHighest"),
    "muted-foreground": pick(scheme, "onSurfaceVariant"),
    accent: pick(scheme, "tertiaryContainer"),
    "accent-foreground": pick(scheme, "onTertiaryContainer"),
    destructive: pick(scheme, "error"),
    "destructive-foreground": pick(scheme, "onError"),
    "destructive-container": pick(scheme, "errorContainer"),
    "destructive-container-foreground": pick(scheme, "onErrorContainer"),
    border: borderColor(scheme, isDark),
    input: inputColor(scheme, isDark),
    ring: pick(scheme, "primary"),
    success: pick(scheme, "tertiary"),
    "success-foreground": pick(scheme, "onTertiary"),
    "success-container": pick(scheme, "tertiaryContainer"),
    "success-container-foreground": pick(scheme, "onTertiaryContainer"),
    info: pick(scheme, "secondary"),
    "info-foreground": pick(scheme, "onSecondary"),
    "info-container": pick(scheme, "secondaryContainer"),
    "info-container-foreground": pick(scheme, "onSecondaryContainer"),
    warning: pick(scheme, "primaryContainer"),
    "warning-foreground": pick(scheme, "onPrimaryContainer"),
    "warning-container": pick(scheme, "primaryContainer"),
    "warning-container-foreground": pick(scheme, "onPrimaryContainer"),
    "primary-container": pick(scheme, "primaryContainer"),
    "on-primary-container": pick(scheme, "onPrimaryContainer"),
    "secondary-container": pick(scheme, "secondaryContainer"),
    "on-secondary-container": pick(scheme, "onSecondaryContainer"),
    "tertiary-container": pick(scheme, "tertiaryContainer"),
    "on-tertiary-container": pick(scheme, "onTertiaryContainer"),
    "surface-container": pick(scheme, "surfaceContainer"),
    "surface-container-high": pick(scheme, "surfaceContainerHigh"),
    "surface-container-highest": pick(scheme, "surfaceContainerHighest"),
    outline: pick(scheme, "outline"),
    "outline-variant": pick(scheme, "outlineVariant"),
    "chart-1": pick(scheme, "primary"),
    "chart-2": pick(scheme, "secondary"),
    "chart-3": pick(scheme, "tertiary"),
    "chart-4": pick(scheme, "primaryContainer"),
    "chart-5": pick(scheme, "secondaryContainer"),
    sidebar: pick(scheme, "surfaceContainerLow"),
    "sidebar-foreground": pick(scheme, "onSurface"),
    "sidebar-primary": pick(scheme, "primary"),
    "sidebar-primary-foreground": pick(scheme, "onPrimary"),
    "sidebar-accent": pick(scheme, "secondaryContainer"),
    "sidebar-accent-foreground": pick(scheme, "onSecondaryContainer"),
    "sidebar-border": borderColor(scheme, isDark),
    "sidebar-ring": pick(scheme, "primary"),
  };

  return Object.entries(lines)
    .map(([key, value]) => `    --${key}: ${value};`)
    .join("\n");
}

function seedHexFromOklch(): string {
  const argb = oklchToArgb(
    DEFAULT_SEED_OKLCH.l,
    DEFAULT_SEED_OKLCH.c,
    DEFAULT_SEED_OKLCH.h,
  );
  const r = redFromArgb(argb);
  const g = greenFromArgb(argb);
  const b = blueFromArgb(argb);
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

function parseArgs(argv: string[]) {
  let seedHex: string | undefined;
  let variant: VariantName = "tonal-spot";
  let check = false;

  for (const arg of argv) {
    if (arg === "--check") {
      check = true;
      continue;
    }
    if (arg.startsWith("--variant=")) {
      const name = arg.slice("--variant=".length) as VariantName;
      if (!(name in VARIANTS)) {
        console.error(`Unknown variant "${name}".`);
        process.exit(1);
      }
      variant = name;
      continue;
    }
    if (arg.startsWith("-")) {
      console.error(`Unknown flag: ${arg}`);
      process.exit(1);
    }
    seedHex = arg;
  }

  if (!seedHex) {
    seedHex = seedHexFromOklch();
  } else if (!/^#?[0-9a-fA-F]{6}$/.test(seedHex)) {
    console.error("Seed must be a 6-digit hex color, e.g. #6750A4");
    process.exit(1);
  }

  if (!seedHex.startsWith("#")) {
    seedHex = `#${seedHex}`;
  }

  return { seedHex, variant, check };
}

export function generateThemeCss(seedHex: string, variant: VariantName): string {
  const SchemeCtor = VARIANTS[variant];
  const sourceArgb = argbFromHex(seedHex);
  const sourceHct = Hct.fromInt(sourceArgb);
  const lightScheme = new SchemeCtor(sourceHct, false, 0);
  const darkScheme = new SchemeCtor(sourceHct, true, 0);

  return `/* Generated by frontend/scripts/theme.ts — do not edit by hand. */
/* seed: ${seedHex.toLowerCase()}  variant: ${variant} */

:root {
${buildSchemeBlock(lightScheme, false)}
}

.dark {
${buildSchemeBlock(darkScheme, true)}
}
`;
}

function main() {
  const { seedHex, variant, check } = parseArgs(process.argv.slice(2));
  const css = generateThemeCss(seedHex, variant);

  if (check) {
    if (!existsSync(outputPath)) {
      console.error(`${outputPath} is missing. Run: bun run theme`);
      process.exit(1);
    }
    const existing = readFileSync(outputPath, "utf8");
    if (existing !== css) {
      console.error("theme.generated.css is out of date. Run: bun run theme");
      process.exit(1);
    }
    console.log("theme.generated.css is up to date.");
    return;
  }

  writeFileSync(outputPath, css, "utf8");
  console.log(`Wrote ${outputPath} (seed ${seedHex}, variant ${variant})`);
}

if (import.meta.main) {
  main();
}
