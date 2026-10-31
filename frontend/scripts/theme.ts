#!/usr/bin/env bun
/**
 * Material Design 3 theme generator (matugen-style).
 *
 * Usage:
 *   bun run theme --help
 *   bun run theme [primaryHex] [--variant=tonal-spot] [--contrast=0]
 *     [--success=#hex] [--info=#hex] [--warning=#hex]
 *     [--radius-sm=0.375rem] [--radius-md=0.5rem] [--radius-lg=0.75rem] [--radius-xl=1.25rem]
 *     [--check]
 *
 * Defaults live in DEFAULT_THEME / DEFAULT_RADIUS below. `theme:check` runs this
 * file with `--check` and no other flags, so the committed CSS must match those
 * defaults. There is no separate config file.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as materialColor from "@material/material-color-utilities";
import {
  type DynamicScheme,
  Hct,
  Variant,
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

/** DynamicScheme contrastLevel. 0 is the spec; -1 minimum, 1 maximum. */
export const DEFAULT_CONTRAST = 0;

/**
 * Corner radii consumed by Tailwind `rounded-sm|md|lg|xl` via the CSS variables
 * in theme.generated.css. `--radius` aliases `--radius-lg`. Pill / `rounded-full`
 * stays fixed in styles.css.
 */
export const DEFAULT_RADIUS = {
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1.25rem",
} as const;

export type RadiusScale = {
  sm: string;
  md: string;
  lg: string;
  xl: string;
};

type SchemeConstructor = new (
  sourceColorHct: Hct,
  isDark: boolean,
  contrastLevel: number,
) => DynamicScheme;

function variantEnumMembers(): string[] {
  return Object.keys(Variant).filter((key) => Number.isNaN(Number(key)));
}

function cliNameFromEnum(member: string): string {
  return member.toLowerCase().replaceAll("_", "-");
}

function schemeExportName(member: string): string {
  const pascal = member
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  return `Scheme${pascal}`;
}

const materialExports = materialColor as unknown as Record<string, unknown>;

/** Every `Variant` the installed library exports, keyed by CLI name. */
export const VARIANTS: Readonly<Record<string, SchemeConstructor>> =
  Object.fromEntries(
    variantEnumMembers().map((member) => {
      const exportName = schemeExportName(member);
      const ctor = materialExports[exportName];
      if (typeof ctor !== "function") {
        throw new Error(
          `Variant.${member} is missing DynamicScheme subclass ${exportName}.`,
        );
      }
      return [cliNameFromEnum(member), ctor as SchemeConstructor];
    }),
  );

export const VARIANT_NAMES: readonly string[] = Object.keys(VARIANTS);

export const DEFAULT_THEME = {
  primary: DEFAULT_PRIMARY,
  variant: "tonal-spot",
  contrast: DEFAULT_CONTRAST,
  success: "#1b873f",
  info: "#0277bd",
  warning: "#f9a825",
  radius: { ...DEFAULT_RADIUS },
};

export type ThemeConfig = {
  primary: string;
  variant: string;
  contrast: number;
  success: string;
  info: string;
  warning: string;
  radius: RadiusScale;
};

export type ParsedThemeArgs = ThemeConfig & { check: boolean; help: boolean };

if (!VARIANT_NAMES.includes(DEFAULT_THEME.variant)) {
  throw new Error(
    `Default variant "${DEFAULT_THEME.variant}" is not exported by the installed library.`,
  );
}

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

const CONTRAST_PATTERN = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/;
const RADIUS_PATTERN = /^(\d+(?:\.\d+)?|\.\d+)(px|rem)$/i;

const RADIUS_FLAGS = {
  "--radius-sm": "sm",
  "--radius-md": "md",
  "--radius-lg": "lg",
  "--radius-xl": "xl",
} as const satisfies Record<string, keyof RadiusScale>;

function variantList(): string {
  return VARIANT_NAMES.join(", ");
}

function unknownVariantError(name: string): Error {
  return new Error(
    `Unknown variant "${name}". Expected one of: ${variantList()}.`,
  );
}

function normalizeHex(hex: string): string {
  const raw = hex.startsWith("#") ? hex.slice(1) : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return `#${raw.toLowerCase()}`;
}

export function parseContrast(raw: string): number {
  if (!CONTRAST_PATTERN.test(raw)) {
    throw new Error(
      `Invalid contrast "${raw}". Expected a number from -1 to 1.`,
    );
  }
  const value = Number(raw);
  if (value < -1 || value > 1) {
    throw new Error(`Contrast ${raw} is outside -1..1.`);
  }
  return value;
}

export function parseRadiusLength(flag: string, raw: string): string {
  const value = raw.trim();
  const match = RADIUS_PATTERN.exec(value);
  if (!match) {
    throw new Error(
      `Invalid ${flag} "${raw}". Use a rem or px length (for example 0.25rem or 4px).`,
    );
  }
  return `${match[1]}${match[2].toLowerCase()}`;
}

function assertContrast(value: number): number {
  if (!Number.isFinite(value) || value < -1 || value > 1) {
    throw new Error(`Contrast ${String(value)} is outside -1..1.`);
  }
  return value;
}

function formatContrast(value: number): string {
  if (Object.is(value, -0)) return "0";
  return String(value);
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
  const map: Record<Md3Role, () => { getArgb: (s: DynamicScheme) => number }> =
    {
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

function radiusDeclarations(radius: RadiusScale): string {
  return [
    `    --radius-sm: ${radius.sm};`,
    `    --radius-md: ${radius.md};`,
    `    --radius-lg: ${radius.lg};`,
    `    --radius: var(--radius-lg);`,
    `    --radius-xl: ${radius.xl};`,
  ].join("\n");
}

function parseHexFlag(arg: string, flag: string): string | undefined {
  if (arg.startsWith(`${flag}=`)) {
    return normalizeHex(arg.slice(flag.length + 1));
  }
  return undefined;
}

function defaultParsed(check: boolean, help: boolean): ParsedThemeArgs {
  return {
    primary: DEFAULT_THEME.primary,
    variant: DEFAULT_THEME.variant,
    contrast: DEFAULT_THEME.contrast,
    success: DEFAULT_THEME.success,
    info: DEFAULT_THEME.info,
    warning: DEFAULT_THEME.warning,
    radius: { ...DEFAULT_RADIUS },
    check,
    help,
  };
}

export function themeHelpText(): string {
  const radius = DEFAULT_RADIUS;
  return [
    "Material Design 3 theme generator.",
    "",
    "Usage:",
    "  bun run theme [primaryHex] [options]",
    "",
    "Writes src/theme.generated.css (run from frontend/, or bun run frontend:theme",
    "from the repo root). With no flags, uses the defaults below. --check",
    "regenerates with the same flags and exits 1 if the file differs.",
    "bun run theme:check passes only --check, so the committed file must match",
    "these defaults. rounded-full / --radius-pill stays 9999px and is not a flag.",
    "",
    "Options:",
    "  --help                     Show this help and exit",
    "  --check                    Fail if theme.generated.css is out of date",
    `  --variant=<name>           DynamicScheme variant (default: ${DEFAULT_THEME.variant})`,
    `                             ${variantList()}`,
    `  --contrast=<number>        DynamicScheme contrastLevel, -1 to 1 (default: ${DEFAULT_CONTRAST})`,
    `  --success=<hex>            Success seed (default: ${DEFAULT_THEME.success})`,
    `  --info=<hex>               Info seed (default: ${DEFAULT_THEME.info})`,
    `  --warning=<hex>            Warning seed (default: ${DEFAULT_THEME.warning})`,
    `  --radius-sm=<length>       rounded-sm (default: ${radius.sm})`,
    `  --radius-md=<length>       rounded-md (default: ${radius.md})`,
    `  --radius-lg=<length>       rounded-lg and --radius (default: ${radius.lg})`,
    `  --radius-xl=<length>       rounded-xl (default: ${radius.xl})`,
    `  primaryHex                 Primary seed (default: ${DEFAULT_PRIMARY})`,
    "",
    "Lengths are rem or px, for example 0.25rem or 4px.",
    "",
  ].join("\n");
}

/**
 * Parse theme CLI arguments. Omitted flags use DEFAULT_THEME.
 * Colors accept six hex digits with an optional `#`; later values replace earlier ones.
 * Throws for invalid colors, contrast, or radii, unknown flags, or variant names
 * absent from the installed DynamicScheme variant list. `--help` skips validation.
 */
export function parseThemeArgs(argv: string[]): ParsedThemeArgs {
  if (argv.includes("--help")) {
    return defaultParsed(false, true);
  }

  let primary: string | undefined;
  let variant: string = DEFAULT_THEME.variant;
  let contrast = DEFAULT_THEME.contrast;
  let success = DEFAULT_THEME.success;
  let info = DEFAULT_THEME.info;
  let warning = DEFAULT_THEME.warning;
  let check = false;
  const radius: RadiusScale = { ...DEFAULT_RADIUS };

  for (const arg of argv) {
    if (arg === "--check") {
      check = true;
      continue;
    }
    if (arg.startsWith("--variant=")) {
      const name = arg.slice("--variant=".length);
      if (!(name in VARIANTS)) {
        throw unknownVariantError(name);
      }
      variant = name;
      continue;
    }
    if (arg.startsWith("--contrast=")) {
      contrast = parseContrast(arg.slice("--contrast=".length));
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
    let matchedRadius = false;
    for (const flag of Object.keys(RADIUS_FLAGS) as Array<
      keyof typeof RADIUS_FLAGS
    >) {
      if (arg.startsWith(`${flag}=`)) {
        radius[RADIUS_FLAGS[flag]] = parseRadiusLength(
          flag,
          arg.slice(flag.length + 1),
        );
        matchedRadius = true;
        break;
      }
    }
    if (matchedRadius) continue;
    if (arg.startsWith("-")) {
      throw new Error(`Unknown flag: ${arg}. Run with --help for options.`);
    }
    primary = normalizeHex(arg);
  }

  return {
    primary: primary ?? DEFAULT_THEME.primary,
    variant,
    contrast,
    success,
    info,
    warning,
    radius,
    check,
    help: false,
  };
}

function normalizeRadius(radius: RadiusScale): RadiusScale {
  return {
    sm: parseRadiusLength("--radius-sm", radius.sm),
    md: parseRadiusLength("--radius-md", radius.md),
    lg: parseRadiusLength("--radius-lg", radius.lg),
    xl: parseRadiusLength("--radius-xl", radius.xl),
  };
}

/**
 * Generate light, dark, and preview CSS from the primary and semantic seeds.
 * Contrast is passed to the DynamicScheme constructor. Radius variables are
 * emitted on :root. Throws if a seed is not a six-digit hex color, contrast is
 * outside -1..1, or a radius is not rem/px. Generation errors propagate.
 */
export function generateThemeCss(config: ThemeConfig): string {
  const primary = normalizeHex(config.primary);
  const success = normalizeHex(config.success);
  const info = normalizeHex(config.info);
  const warning = normalizeHex(config.warning);
  const contrast = assertContrast(config.contrast);
  const radius = normalizeRadius(config.radius);
  const SchemeCtor = VARIANTS[config.variant];
  if (!SchemeCtor) {
    throw unknownVariantError(config.variant);
  }
  const sourceArgb = argbFromHex(primary);
  const sourceHct = Hct.fromInt(sourceArgb);
  const lightScheme = new SchemeCtor(sourceHct, false, contrast);
  const darkScheme = new SchemeCtor(sourceHct, true, contrast);
  const seeds = { success, info, warning };

  const lightBlock = buildSchemeBlock(lightScheme, false, sourceArgb, seeds);
  const darkBlock = buildSchemeBlock(darkScheme, true, sourceArgb, seeds);

  return `/* Generated by frontend/scripts/theme.ts — do not edit by hand. */
/* primary: ${primary}  variant: ${config.variant}  contrast: ${formatContrast(contrast)}  success: ${success}  info: ${info}  warning: ${warning}  radius-sm: ${radius.sm}  radius-md: ${radius.md}  radius-lg: ${radius.lg}  radius-xl: ${radius.xl} */

:root {
${radiusDeclarations(radius)}

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
    if (args.help) {
      console.log(themeHelpText());
      return;
    }
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
      `Wrote ${outputPath} (primary ${args.primary}, variant ${args.variant}, contrast ${formatContrast(args.contrast)})`,
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}
