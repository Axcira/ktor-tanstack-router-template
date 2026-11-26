import { Search } from "lucide-react";
import { ResponsiveSelect } from "@/components/ResponsiveSelect";
import { Input } from "@/components/ui/input";
import type { ActiveFilter } from "./useMasterFilters";

const activeOptions = [
  { value: "all", label: "すべて" },
  { value: "true", label: "有効" },
  { value: "false", label: "無効" },
];

export function MasterToolbar({
  q,
  onQChange,
  active,
  onActiveChange,
  totalCount,
  reorderEnabled,
}: {
  q: string;
  onQChange: (value: string) => void;
  active: ActiveFilter;
  onActiveChange: (value: ActiveFilter) => void;
  totalCount: number;
  reorderEnabled: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            aria-label="検索"
            placeholder="コード・名前で検索"
            value={q}
            onChange={(event) => onQChange(event.target.value)}
            className="pl-8"
          />
        </div>
        <ResponsiveSelect
          aria-label="状態"
          value={active}
          onValueChange={(value) => {
            if (value === "all" || value === "true" || value === "false") {
              onActiveChange(value);
            }
          }}
          options={activeOptions}
          className="w-32"
        />
        <p className="text-sm text-muted-foreground">{totalCount} 件</p>
      </div>
      {!reorderEnabled && (
        <p className="text-xs text-muted-foreground">
          絞り込み中は並び替えできません。
        </p>
      )}
    </div>
  );
}
