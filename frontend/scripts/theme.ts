#!/usr/bin/env bun
/**
 * Material Design 3 theme generator (matugen-style).
 * Usage:
 *   bun run theme [primaryHex] [--variant=tonal-spot] [--success=#hex] [--info=#hex] [--warning=#hex] [--check]
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
  customColor,
  greenFromArgb,
  redFromArgb,
} from "@material/material-color-utilities";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = join(scriptDir, "..");
const outputPath = join(frontendRoot, "src/theme.generated.css");

/** Legacy template primary before MD3 migration (oklch primary → hex). */
export const DEFAULT_PRIMARY = "#0061f3";

export const DEFAULT_THEME = {
  primary: DEFAULT_PRIMARY,
  variant: "tonal-spot" as const,
  success: "#1b873f",
  info: "#0277bd",
  warning: "#f9a825",
};

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

export type VariantName = keyof typeof VARIANTS;

export type ThemeConfig = {
  primary: string;
  variant: VariantName;
  success: string;
  info: string;
  warning: string;
};

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
  | "outlineVariant";

type SemanticPalette = {
  base: string;
  on: string;
  container: string;
  onContainer: string;
};

function normalizeHex(hex: string): string {
  const raw = hex.startsWith("#") ? hex.slice(1) : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return `#${raw.toLowerCase()}`;
}

function argbToCss(argb: number): string {
  const a = alphaFromArgb(argb);
  const r = redFromArgb(argb);
  const g = greenFromArgb(argb);
  const b = blueFromArgb(argb);
  if (a === 255) {
    return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
  }
  const alpha = Math.round((a / 255) * 1000) / 1000;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
  };
  return map[role]().getArgb(scheme);
}

function pick(scheme: DynamicScheme, role: Md3Role): string {
  return argbToCss(resolveRole(scheme, role));
}

function semanticPalette(
  sourceArgb: number,
  seedHex: string,
  name: string,
  isDark: boolean,
): SemanticPalette {
  const group = customColor(sourceArgb, {
    value: argbFromHex(normalizeHex(seedHex)),
    name,
    blend: true,
  });
  const tone = isDark ? group.dark : group.light;
  return {
    base: argbToCss(tone.color),
    on: argbToCss(tone.onColor),
    container: argbToCss(tone.colorContainer),
    onContainer: argbToCss(tone.onColorContainer),
  };
}

function borderColor(scheme: DynamicScheme, isDark: boolean): string {
  if (isDark) {
    return "rgba(255, 255, 255, 0.12)";
  }
  return pick(scheme, "outlineVariant");
}

function inputColor(scheme: DynamicScheme, isDark: boolean): string {
  if (isDark) {
    return "rgba(255, 255, 255, 0.16)";
  }
  return pick(scheme, "outlineVariant");
}

function buildSchemeBlock(
  scheme: DynamicScheme,
  isDark: boolean,
  sourceArgb: number,
  seeds: Pick<ThemeConfig, "success" | "info" | "warning">,
): string {
  const success = semanticPalette(sourceArgb, seeds.success, "success", isDark);
  const info = semanticPalette(sourceArgb, seeds.info, "info", isDark);
  const warning = semanticPalette(sourceArgb, seeds.warning, "warning", isDark);

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
    success: success.base,
    "success-foreground": success.on,
    "success-container": success.container,
    "success-container-foreground": success.onContainer,
    info: info.base,
    "info-foreground": info.on,
    "info-container": info.container,
    "info-container-foreground": info.onContainer,
    warning: warning.base,
    "warning-foreground": warning.on,
    "warning-container": warning.container,
    "warning-container-foreground": warning.onContainer,
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

function parseHexFlag(arg: string, flag: string): string | undefined {
  if (arg.startsWith(`${flag}=`)) {
    return normalizeHex(arg.slice(flag.length + 1));
  }
  return undefined;
}

export function parseThemeArgs(argv: string[]): ThemeConfig & { check: boolean } {
  let primary: string | undefined;
  let variant: VariantName = DEFAULT_THEME.variant;
  let success = DEFAULT_THEME.success;
  let info = DEFAULT_THEME.info;
  let warning = DEFAULT_THEME.warning;
  let check = false;

  for (const arg of argv) {
    if (arg === "--check") {
      check = true;
      continue;
    }
    if (arg.startsWith("--variant=")) {
      const name = arg.slice("--variant=".length) as VariantName;
      if (!(name in VARIANTS)) {
        throw new Error(`Unknown variant "${name}".`);
      }
      variant = name;
      continue;
    }
    const successFlag = parseHexFlag(arg, "--success");
    if (successFlag) {
      success = successFlag;
      continue;
    }
    const infoFlag = parseHexFlag(arg, "--info");
    if (infoFlag) {
      info = infoFlag;
      continue;
    }
    const warningFlag = parseHexFlag(arg, "--warning");
    if (warningFlag) {
      warning = warningFlag;
      continue;
    }
    if (arg.startsWith("-")) {
      throw new Error(`Unknown flag: ${arg}`);
    }
    primary = normalizeHex(arg);
  }

  return {
    primary: primary ?? DEFAULT_THEME.primary,
    variant,
    success,
    info,
    warning,
    check,
  };
}

export function generateThemeCss(config: ThemeConfig): string {
  const primary = normalizeHex(config.primary);
  const success = normalizeHex(config.success);
  const info = normalizeHex(config.info);
  const warning = normalizeHex(config.warning);
  const SchemeCtor = VARIANTS[config.variant];
  const sourceArgb = argbFromHex(primary);
  const sourceHct = Hct.fromInt(sourceArgb);
  const lightScheme = new SchemeCtor(sourceHct, false, 0);
  const darkScheme = new SchemeCtor(sourceHct, true, 0);
  const seeds = { success, info, warning };

  const lightBlock = buildSchemeBlock(lightScheme, false, sourceArgb, seeds);
  const darkBlock = buildSchemeBlock(darkScheme, true, sourceArgb, seeds);

  return `/* Generated by frontend/scripts/theme.ts — do not edit by hand. */
/* primary: ${primary}  variant: ${config.variant}  success: ${success}  info: ${info}  warning: ${warning} */

:root {
${lightBlock}
}

.dark {
${darkBlock}
}

.theme-preview-light {
    color-scheme: light;
    background-color: var(--background);
    color: var(--foreground);
${lightBlock}
}

.theme-preview-dark {
    color-scheme: dark;
    background-color: var(--background);
    color: var(--foreground);
${darkBlock}
}
`;
}

function main() {
  try {
    const args = parseThemeArgs(process.argv.slice(2));
    const css = generateThemeCss(args);

    if (args.check) {
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
    console.log(
      `Wrote ${outputPath} (primary ${args.primary}, variant ${args.variant})`,
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}
