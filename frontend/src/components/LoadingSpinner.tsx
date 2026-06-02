import { Loader2 } from "lucide-react";

export default function LoadingSpinner() {
  return <div className="flex justify-center items-center min-h-100">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
  </div>
}
