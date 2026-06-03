import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import type { RoleDTO } from "@/api/generated/schemas/roleDTO";
import type { Permission } from "@/api/generated/schemas/permission";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PERMISSION_UI_DEFS } from "@/lib/permissions";

const permissionEntries = Object.entries(PERMISSION_UI_DEFS) as [
  keyof typeof PERMISSION_UI_DEFS,
  (typeof PERMISSION_UI_DEFS)[keyof typeof PERMISSION_UI_DEFS],
][];

type PermissionStates = Record<
  string,
  { enabled: boolean; props: Record<string, string | number | boolean> }
>;

interface RoleFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRole: RoleDTO | null;
  onSave: (data: { name: string; description: string; permissions: Permission[] }) => void;
  onValidationError: (message: string) => void;
  isSaving: boolean;
}

export function RoleFormSheet({
  open,
  onOpenChange,
  editingRole,
  onSave,
  onValidationError,
  isSaving,
}: RoleFormSheetProps) {
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [permissionStates, setPermissionStates] = useState<PermissionStates>({});

  useEffect(() => {
    if (open) {
      if (editingRole) {
        setRoleName(editingRole.name);
        setRoleDescription(editingRole.description);

        const initialPermStates: PermissionStates = {};
        permissionEntries.forEach(([type, def]) => {
          const activePerm = editingRole.permissions.find((p) => p.type === type);
          const defaultProps: Record<string, string | number | boolean> = {};

          Object.entries(def.props).forEach(([propKey, propMeta]) => {
            if (propMeta.type === "boolean") {
              defaultProps[propKey] = activePerm
                ? ((activePerm as unknown) as Record<string, unknown>)[propKey] as boolean ?? false
                : false;
            }
          });

          initialPermStates[type] = {
            enabled: !!activePerm,
            props: defaultProps,
          };
        });
        setPermissionStates(initialPermStates);
      } else {
        setRoleName("");
        setRoleDescription("");

        const initialPermStates: PermissionStates = {};
        permissionEntries.forEach(([type, def]) => {
          const defaultProps: Record<string, string | number | boolean> = {};
          Object.entries(def.props).forEach(([propKey, propMeta]) => {
            if (propMeta.type === "boolean") defaultProps[propKey] = false;
          });
          initialPermStates[type] = { enabled: false, props: defaultProps };
        });
        setPermissionStates(initialPermStates);
      }
    }
  }, [open, editingRole]);

  const handleTogglePermission = (type: string, checked: boolean) => {
    setPermissionStates((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        enabled: checked,
      },
    }));
  };

  const handlePropChange = (type: string, propKey: string, value: boolean) => {
    setPermissionStates((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        props: {
          ...prev[type].props,
          [propKey]: value,
        },
      },
    }));
  };

  const handleSaveClick = () => {
    if (!roleName.trim()) {
      onValidationError("ロール名を入力してください。");
      return;
    }

    const constructedPermissions: Permission[] = [];
    permissionEntries.forEach(([type]) => {
      const state = permissionStates[type];
      if (state?.enabled) {
        constructedPermissions.push({
          type,
          ...state.props,
        } as unknown as Permission);
      }
    });

    onSave({
      name: roleName,
      description: roleDescription,
      permissions: constructedPermissions,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col h-full bg-card overflow-hidden"
      >
        <SheetHeader className="pb-4 border-b">
          <SheetTitle>
            {editingRole ? "ロールの編集" : "新規ロールの作成"}
          </SheetTitle>
          <SheetDescription>
            ロール名、説明文、および適用する権限の詳細を編集します。
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-1">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">
                ロール名 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="role-name"
                placeholder="例: ContentModerator"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-desc">説明</Label>
              <Input
                id="role-desc"
                placeholder="このロールの役割についての説明..."
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              権限アサイン
            </div>
            <div className="space-y-3">
              {permissionEntries.map(([type, def]) => {
                const state = permissionStates[type] || {
                  enabled: false,
                  props: {},
                };
                const isEnabled = state.enabled;
                const hasProps = Object.keys(def.props).length > 0;

                return (
                  <Card
                    key={type}
                    className={`p-4 border transition-colors ${isEnabled ? "border-primary/50 bg-primary/5" : "border-border"}`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-semibold block">
                          {def.label}
                        </Label>
                        <span className="text-xs text-muted-foreground block leading-normal">
                          {def.description}
                        </span>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) =>
                          handleTogglePermission(type, checked)
                        }
                        disabled={isSaving}
                      />
                    </div>

                    {isEnabled && hasProps && (
                      <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                        <span className="text-xs font-semibold text-muted-foreground">
                          オプション:
                        </span>
                        {Object.entries(def.props).map(
                          ([propKey, propMeta]) => (
                            <div
                              key={propKey}
                              className="flex items-center justify-between pl-2"
                            >
                              <Label
                                htmlFor={`prop-${type}-${propKey}`}
                                className="text-xs text-foreground cursor-pointer"
                              >
                                - {propMeta.label}
                              </Label>
                              {propMeta.type === "boolean" && (
                                <Switch
                                  id={`prop-${type}-${propKey}`}
                                  checked={(state.props[propKey] as boolean) || false}
                                  onCheckedChange={(checked) =>
                                    handlePropChange(type, propKey, checked)
                                  }
                                  disabled={isSaving}
                                />
                              )}
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border-t pt-4 mt-auto flex items-center justify-end gap-3 bg-card pb-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSaveClick}
            className="bg-primary text-primary-foreground hover:opacity-90"
            disabled={isSaving}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            保存
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
