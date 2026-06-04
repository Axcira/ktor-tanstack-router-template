import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import type { Permission } from "@/api/generated/schemas/permission";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PERMISSION_UI_DEFS } from "@/lib/permissions";

const permissionEntries = Object.entries(PERMISSION_UI_DEFS) as [
  keyof typeof PERMISSION_UI_DEFS,
  (typeof PERMISSION_UI_DEFS)[keyof typeof PERMISSION_UI_DEFS],
][];

type PermissionStates = Record<
  string,
  { enabled: boolean; props: Record<string, string | number | boolean> }
>;

interface RoleFormProps {
  initialValues?: {
    name: string;
    description: string;
    permissions: Permission[];
  };
  onSubmit: (data: {
    name: string;
    description: string;
    permissions: Permission[];
  }) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel: string;
}

// 初期化ロジックを再利用できるようにヘルパー関数として切り出し
const computeInitialPermissionStates = (permissions?: Permission[]): PermissionStates => {
  const states: PermissionStates = {};
  permissionEntries.forEach(([type, def]) => {
    const activePerm = permissions?.find((p) => p.type === type);
    const defaultProps: Record<string, string | number | boolean> = {};

    Object.entries(def.props).forEach(([propKey, propMeta]) => {
      if (propMeta.type === "boolean") {
        defaultProps[propKey] = activePerm
          ? (((activePerm as unknown) as Record<string, unknown>)[
          propKey
          ] as boolean) ?? false
          : false;
      }
    });

    states[type] = {
      enabled: !!activePerm,
      props: defaultProps,
    };
  });
  return states;
};

export default function RoleForm({initialValues, onSubmit, onCancel, isSubmitting, submitLabel,}: RoleFormProps) {
  const [roleName, setRoleName] = useState(initialValues?.name || "");
  const [roleDescription, setRoleDescription] = useState(
    initialValues?.description || "",
  );
  const [permissionStates, setPermissionStates] = useState<PermissionStates>(() =>
    computeInitialPermissionStates(initialValues?.permissions)
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  // initialValuesが外部から変更されたらstateを同期する
  useEffect(() => {
    setRoleName(initialValues?.name || "");
    setRoleDescription(initialValues?.description || "");
    setPermissionStates(computeInitialPermissionStates(initialValues?.permissions));
  }, [initialValues]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!roleName.trim()) {
      setValidationError("ロール名を入力してください。");
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

    try {
      await onSubmit({
        name: roleName,
        description: roleDescription,
        permissions: constructedPermissions,
      });
    } catch (error) {
      console.error(error);
      setValidationError("保存処理中にエラーが発生しました。");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {validationError && (
        <div className="p-3 text-sm rounded-lg bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-400 animate-in fade-in">
          {validationError}
        </div>
      )}

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
            disabled={isSubmitting}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role-desc">説明</Label>
          <Input
            id="role-desc"
            placeholder="このロールの役割についての説明..."
            value={roleDescription}
            onChange={(e) => setRoleDescription(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
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
                className={`p-4 border transition-colors ${
                  isEnabled
                    ? "border-primary/50 bg-primary/5 dark:bg-primary/5"
                    : "border-border"
                }`}
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
                    disabled={isSubmitting}
                    type="button"
                  />
                </div>

                {isEnabled && hasProps && (
                  <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                    <span className="text-xs font-semibold text-muted-foreground">
                      オプション:
                    </span>
                    {Object.entries(def.props).map(([propKey, propMeta]) => (
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
                            disabled={isSubmitting}
                            type="button"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      <div className="border-t pt-4 flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          キャンセル
        </Button>
        <Button
          type="submit"
          className="bg-primary text-primary-foreground hover:opacity-90"
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}