import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MasterToolbar } from "./MasterToolbar";
import type { useMasterFilters } from "./useMasterFilters";

export function MasterListFrame({
  filters,
  totalCount,
  isLoading,
  isError,
  errorMessage,
  children,
}: {
  filters: ReturnType<typeof useMasterFilters>;
  totalCount: number;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <MasterToolbar
        q={filters.q}
        onQChange={filters.setQ}
        active={filters.active}
        onActiveChange={filters.setActive}
        totalCount={totalCount}
        reorderEnabled={filters.reorderEnabled}
      />
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center min-h-40">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="p-4 text-destructive">{errorMessage}</div>
          ) : (
            children
          )}
        </CardContent>
      </Card>
    </div>
  );
}
