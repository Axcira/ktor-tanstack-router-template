import { useVersionV1 } from "@/api/generated/default/default.ts";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip.tsx";

const bundled = __APP_VERSION__;

type VersionStampProps = {
  className?: string;
};

export function VersionStamp({ className }: VersionStampProps) {
  const { data: versionResponse } = useVersionV1({
    query: {
      staleTime: Number.POSITIVE_INFINITY,
      retry: false,
    },
  });

  const apiVersion =
    versionResponse?.status === 200 ? versionResponse.data : null;
  const backendShort = apiVersion?.commitShort ?? "…";
  const frontendMismatch =
    apiVersion?.frontend != null &&
    apiVersion.frontend.commit !== bundled.commit;

  const tooltipLines = [
    `Frontend (bundle): ${bundled.commit}${bundled.dirty ? " (dirty)" : ""}`,
    `Frontend built: ${bundled.builtAt}`,
    apiVersion
      ? `Backend: ${apiVersion.commit}${apiVersion.dirty ? " (dirty)" : ""}`
      : "Backend: loading…",
    apiVersion ? `Backend built: ${apiVersion.builtAt}` : null,
    apiVersion?.frontend
      ? `Static on server: ${apiVersion.frontend.commit}`
      : null,
    frontendMismatch
      ? "This page bundle does not match the frontend files on the server."
      : null,
  ].filter((line): line is string => line != null);

  return (
    <Tooltip>
      <TooltipTrigger
        className={
          className ??
          "font-mono text-xs text-muted-foreground hover:text-foreground"
        }
      >
        {bundled.commitShort}
        <span className="mx-1 text-muted-foreground/60">·</span>
        API {backendShort}
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-sm whitespace-pre-line">
        {tooltipLines.join("\n")}
      </TooltipContent>
    </Tooltip>
  );
}
