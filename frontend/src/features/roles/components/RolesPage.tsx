import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Check, Info, Loader2, Plus, Search, Shield, X } from "lucide-react";
import { useState } from "react";
import {
  getGetRolesQueryKey,
  useDeleteRole,
  useGetRoles,
} from "@/api/generated/default/default";
import type { RoleDTO } from "@/api/generated/schemas/roleDTO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteRoleDialog } from "./DeleteRoleDialog";
import { RoleCard } from "./RoleCard";

export default function RolesPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: rolesResponse, isLoading } = useGetRoles();
  const roles = rolesResponse?.data || [];

  const deleteRoleMutation = useDeleteRole();
  const isDeleting = deleteRoleMutation.isPending;

  const [search, setSearch] = useState("");
  const [roleToDelete, setRoleToDelete] = useState<RoleDTO | null>(null);

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
    navigate({ to: "/permissions/roles/create" }).then();
  };

  const handleOpenEdit = (role: RoleDTO) => {
    navigate({
      to: "/permissions/roles/$roleId/edit",
      params: { roleId: String(role.id) },
    }).then();
  };

  const executeDelete = async (fallbackRoleId: string) => {
    if (!roleToDelete) return;

    try {
      await deleteRoleMutation.mutateAsync({
        id: String(roleToDelete.id),
        params: { fallbackRoleId },
      });

      await queryClient.invalidateQueries({ queryKey: getGetRolesQueryKey() });
      showNotification(
        `ロール「${roleToDelete.name}」を削除しました。`,
        "info",
      );
      setRoleToDelete(null);
    } catch (error) {
      console.error(error);
      showNotification("削除処理中にエラーが発生しました。", "error");
    }
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
            aria-label={"ロールを検索"}
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
          {filteredRoles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              onEdit={handleOpenEdit}
              onDelete={setRoleToDelete}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}

      <DeleteRoleDialog
        roleToDelete={roleToDelete}
        onClose={() => setRoleToDelete(null)}
        onConfirm={executeDelete}
        roles={roles}
        isDeleting={isDeleting}
      />
    </div>
  );
}
