import { Key, Edit2, Trash2 } from "lucide-react";
import type { RoleDTO } from "@/api/generated/schemas/roleDTO";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { PERMISSION_UI_DEFS } from "@/lib/permissions";

interface RoleCardProps {
  role: RoleDTO;
  onEdit: (role: RoleDTO) => void;
  onDelete: (role: RoleDTO) => void;
  isDeleting: boolean;
}

export function RoleCard({ role, onEdit, onDelete, isDeleting }: RoleCardProps) {
  const isAdministrator = role.permissions.some(
    (p) => p.type === "Administrator",
  );

  return (
    <Card className="relative flex flex-col justify-between hover:shadow-md transition-all border border-border/80 bg-gradient-to-br from-card to-background">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              {role.name}
            </CardTitle>
            <CardDescription className="line-clamp-2 min-h-10">
              {role.description || "説明はありません。"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-muted"
              onClick={() => onEdit(role)}
              disabled={isDeleting}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            {role.name !== "Administrator" && role.name !== "Guest Reader" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onDelete(role)}
                disabled={isDeleting}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex-1 flex flex-col justify-end">
        <div className="border-t border-border/50 pt-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            権限構成
          </div>
          {isAdministrator ? (
            <span className="inline-flex items-center rounded-md bg-violet-50 dark:bg-violet-950/30 px-2 py-1 text-xs font-semibold text-violet-700 dark:text-violet-400 border border-violet-200/50">
              全機能アクセス (Administrator)
            </span>
          ) : role.permissions.length === 0 ? (
            <span className="text-xs text-muted-foreground italic">
              権限はありません（読み取り専用）
            </span>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {role.permissions.map((p) => {
                const def = PERMISSION_UI_DEFS[p.type];
                const propsStr = Object.entries(p)
                  .filter(([key]) => key !== "type")
                  .map(([key, val]) => `${key}: ${val}`)
                  .join(", ");
                return (
                  <span
                    key={p.type}
                    className="inline-flex items-center rounded-md bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary border border-primary/10"
                    title={def?.description}
                  >
                    {def?.label || p.type}
                    {propsStr && (
                      <span className="text-[10px] text-muted-foreground ml-1">
                        ({propsStr})
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
