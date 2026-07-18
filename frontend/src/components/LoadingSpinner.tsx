import { Loader2 } from "lucide-react";

export default function LoadingSpinner() {
  return (
    <output
      className="flex justify-center items-center min-h-100"
      aria-live={"polite"}
    >
      <Loader2
        className="h-8 w-8 animate-spin text-muted-foreground"
        aria-hidden={"true"}
      />
      <span className={"sr-only"}>読み込み中</span>
    </output>
  );
}
