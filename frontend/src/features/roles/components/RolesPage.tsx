import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Shield,
  Key,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  Info,
  Loader2,
} from "lucide-react";
import type { RoleDTO } from "@/api/generated/schemas/roleDTO";
import type { Permission } from "@/api/generated/schemas/permission";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PERMISSION_UI_DEFS } from "@/lib/permissions";

import {
  useGetApiRoles,
  usePostApiRoles,
  usePatchApiRolesId,
  useDeleteApiRolesId,
  getGetApiRolesQueryKey,
} from "@/api/generated/default/default";

const permissionEntries = Object.entries(PERMISSION_UI_DEFS) as [
  keyof typeof PERMISSION_UI_DEFS,
  (typeof PERMISSION_UI_DEFS)[keyof typeof PERMISSION_UI_DEFS],
][];

export default function RolesPage() {
  const queryClient = useQueryClient();

  const { data: rolesResponse, isLoading } = useGetApiRoles();
  const roles = rolesResponse?.data || [];

  const createRoleMutation = usePostApiRoles();
  const updateRoleMutation = usePatchApiRolesId();
  const deleteRoleMutation = useDeleteApiRolesId();

  const isSaving = createRoleMutation.isPending || updateRoleMutation.isPending;
  const isDeleting = deleteRoleMutation.isPending;

  const [search, setSearch] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDTO | null>(null);

  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [permissionStates, setPermissionStates] = useState<
    Record<string, { enabled: boolean; props: Record<string, string | number | boolean> }>
  >({});

  const [roleToDelete, setRoleToDelete] = useState<RoleDTO | null>(null);
  const [selectedFallbackId, setSelectedFallbackId] = useState<string>("4");

  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "info" | "error";
  } | null>(null);

  const showNotification = (
    message: string,
    type: "success" | "info" | "error" = "success",
  ) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenCreate = () => {
    setEditingRole(null);
    setRoleName("");
    setRoleDescription("");

    const initialPermStates: typeof permissionStates = {};
    permissionEntries.forEach(([type, def]) => {
      const defaultProps: Record<string, string | number | boolean> = {};
      Object.entries(def.props).forEach(([propKey, propMeta]) => {
        if (propMeta.type === "boolean") defaultProps[propKey] = false;
      });
      initialPermStates[type] = { enabled: false, props: defaultProps };
    });
    setPermissionStates(initialPermStates);
    setIsSheetOpen(true);
  };

  const handleOpenEdit = (role: RoleDTO) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description);

    const initialPermStates: typeof permissionStates = {};
    permissionEntries.forEach(([type, def]) => {
      const activePerm = role.permissions.find((p) => p.type === type);
      const defaultProps: Record<string, string | number | boolean> = {};

      Object.entries(def.props).forEach(([propKey, propMeta]) => {
        if (propMeta.type === "boolean") {
          defaultProps[propKey] = activePerm
            ? (((activePerm as unknown) as Record<string, unknown>)[propKey] as boolean ?? false)
            : false;
        }
      });

      initialPermStates[type] = {
        enabled: !!activePerm,
        props: defaultProps,
      };
    });

    setPermissionStates(initialPermStates);
    setIsSheetOpen(true);
  };

  const handleSave = async () => {
    if (!roleName.trim()) {
      showNotification("ロール名を入力してください。", "error");
      return;
    }

    const constructedPermissions: Permission[] = [];
    permissionEntries.forEach(([type]) => {
      const state = permissionStates[type];
      if (state?.enabled) {
        constructedPermissions.push({
          type,
          ...state.props,
        } as Permission);
      }
    });

    try {
      if (editingRole) {
        await updateRoleMutation.mutateAsync({
          id: String(editingRole.id),
          data: {
            name: roleName,
            description: roleDescription,
            permissions: constructedPermissions,
          },
        });
        showNotification(`ロール「${roleName}」を更新しました。`);
      } else {
        await createRoleMutation.mutateAsync({
          data: {
            name: roleName,
            description: roleDescription,
            permissions: constructedPermissions,
          },
        });
        showNotification(`ロール「${roleName}」を作成しました。`);
      }

      queryClient.invalidateQueries({ queryKey: getGetApiRolesQueryKey() });
      setIsSheetOpen(false);
    } catch (error) {
      console.error(error);
      showNotification("保存処理中にエラーが発生しました。", "error");
    }
  };

  const handleTrashClick = (role: RoleDTO) => {
    setRoleToDelete(role);
    setSelectedFallbackId("4");
  };

  const executeDelete = async () => {
    if (!roleToDelete) return;

    try {
      await deleteRoleMutation.mutateAsync({
        id: String(roleToDelete.id),
        params: { fallbackRoleId: selectedFallbackId },
      });

      queryClient.invalidateQueries({ queryKey: getGetApiRolesQueryKey() });
      showNotification(`ロール「${roleToDelete.name}」を削除しました。`, "info");
      setRoleToDelete(null);
    } catch (error) {
      console.error(error);
      showNotification("削除処理中にエラーが発生しました。", "error");
    }
  };

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

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(search.toLowerCase()) ||
      role.description.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {notification && (
        <div
          className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border text-sm animate-in fade-in slide-in-from-bottom-5 duration-300 ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-400"
              : notification.type === "info"
                ? "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/30 dark:border-blue-900/50 dark:text-blue-400"
                : "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-400"
          }`}
        >
          {notification.type === "success" && <Check className="h-4 w-4" />}
          {notification.type === "info" && <Info className="h-4 w-4" />}
          {notification.type === "error" && <X className="h-4 w-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            ロール管理
          </h1>
          <p className="text-muted-foreground mt-1">
            システムに適用されるセキュリティロールとその権限を設定・定義します。
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto gap-2 bg-primary text-primary-foreground shadow hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          新規ロール作成
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ロール名や説明で検索..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground w-full md:w-auto justify-end">
          <span>
            登録ロール数:{" "}
            {isLoading ? (
              <Loader2 className="inline h-3 w-3 animate-spin ml-1" />
            ) : (
              <strong className="text-foreground">{roles.length}</strong>
            )}
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredRoles.map((role) => {
            const isAdministrator = role.permissions.some(
              (p) => p.type === "Administrator",
            );
            return (
              <Card
                key={role.id}
                className="relative flex flex-col justify-between hover:shadow-md transition-all border border-border/80 bg-gradient-to-br from-card to-background"
              >
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
                        onClick={() => handleOpenEdit(role)}
                        disabled={isDeleting}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      {role.name !== "Administrator" && role.name !== "Guest Reader" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleTrashClick(role)}
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
          })}
        </div>
      )}

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
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
              onClick={() => setIsSheetOpen(false)}
              disabled={isSaving}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleSave}
              className="bg-primary text-primary-foreground hover:opacity-90"
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={!!roleToDelete} onOpenChange={(open) => !open && setRoleToDelete(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>ロールの削除</DialogTitle>
            <DialogDescription>
              「{roleToDelete?.name}」を削除します。
              このロールを持つユーザーの新しい移行先（フォールバック）を選択してください。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fallback-role">移行先ロール</Label>
              <Select value={selectedFallbackId} onValueChange={setSelectedFallbackId}>
                <SelectTrigger id="fallback-role" className="w-full">
                  <SelectValue placeholder="ロールを選択" />
                </SelectTrigger>
                <SelectContent>
                  {roles
                    .filter((r) => r.id !== roleToDelete?.id)
                    .map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleToDelete(null)} disabled={isDeleting}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={executeDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              削除を実行
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}