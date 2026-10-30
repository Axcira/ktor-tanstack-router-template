import { cn } from "@/lib/utils";

/** Semantic role badge styles (MD3 container roles). */
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

export function formErrorBannerClass(className?: string): string {
  return cn(
    "rounded-lg border border-destructive/30 bg-destructive-container p-3 text-sm text-destructive-container-foreground",
    className,
  );
}

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
