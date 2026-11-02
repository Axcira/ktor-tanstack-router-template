import { cn } from "@/lib/utils";

/** Semantic role badge styles (MD3 container roles); unrecognized names use the neutral fallback. */
export function roleBadgeClass(roleName: string): string {
  switch (roleName) {
    case "Administrator":
      return "bg-primary-container text-on-primary-container border-outline-variant";
    case "Editor":
      return "bg-info-container text-info-container-foreground border-outline-variant";
    case "Writer":
      return "bg-warning-container text-warning-container-foreground border-outline-variant";
    case "Guest Reader":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-surface-container-highest text-muted-foreground border-border";
  }
}

/** Merge optional classes into the semantic form error banner styles. */
export function formErrorBannerClass(className?: string): string {
  return cn(
    "rounded-lg border border-destructive/30 bg-destructive-container p-3 text-sm text-destructive-container-foreground",
    className,
  );
}

const toastSurfaces = {
  default: "border-border bg-surface-container text-foreground",
  success:
    "border-success bg-success-container text-success-container-foreground",
  info: "border-info bg-info-container text-info-container-foreground",
  warning:
    "border-warning bg-warning-container text-warning-container-foreground",
  error:
    "border-destructive bg-destructive-container text-destructive-container-foreground",
} as const;

/** Surface classes for a toast. Unknown types, including loading, use the default surface. */
export function toastSurfaceClass(type?: string): string {
  switch (type) {
    case "success":
    case "info":
    case "warning":
    case "error":
      return toastSurfaces[type];
    default:
      return toastSurfaces.default;
  }
}

/** Return semantic container styles for an inline notification. */
export function notificationToastClass(
  type: "success" | "info" | "error",
): string {
  switch (type) {
    case "success":
      return "bg-success-container text-success-container-foreground border-outline-variant";
    case "info":
      return "bg-info-container text-info-container-foreground border-outline-variant";
    case "error":
      return "bg-destructive-container text-destructive-container-foreground border-outline-variant";
  }
}
