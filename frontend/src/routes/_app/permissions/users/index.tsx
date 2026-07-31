import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Check,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  useDeleteUserV1,
  useGetRolesV1,
  useGetUsersV1,
} from "@/api/generated/default/default.ts";
import type { UserDTO } from "@/api/generated/schemas/userDTO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UsersTable } from "./-components/UsersTable";

export const Route = createFileRoute("/_app/permissions/users/")({
  component: UsersPage,
});

function UsersPage() {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const limit = 10;
  const offset = (page - 1) * limit;

  const {
    data: usersResponse,
    isLoading: isLoadingUsers,
    isError: isErrorUsers,
    refetch,
  } = useGetUsersV1({
    limit: String(limit),
    offset: String(offset),
  });
  const { data: rolesResponse, isLoading: isLoadingRoles } = useGetRolesV1();

  const deleteUserMutation = useDeleteUserV1();

  const isSubmitting = deleteUserMutation.isPending;
  const isLoading = isLoadingUsers || isLoadingRoles;

  const availableRoles = rolesResponse?.data || [];

  const [users, setUsers] = useState<UserDTO[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const meta = (
    usersResponse as { meta?: { totalCount?: number; totalPages?: number } }
  )?.meta;

  useEffect(() => {
    if (usersResponse?.data) {
      setUsers(usersResponse.data);
    }
  }, [usersResponse?.data]);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

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
    navigate({ to: "/permissions/users/create" }).then();
  };

  const handleOpenEdit = (user: UserDTO) => {
    navigate({
      to: "/permissions/users/$userId/edit",
      params: { userId: String(user.id) },
    }).then();
  };

  const handleDelete = async (userId: number, email: string) => {
    if (confirm(`ユーザー「${email}」を削除してもよろしいですか？`)) {
      setDeletingId(userId);
      try {
        await deleteUserMutation.mutateAsync({ id: String(userId) });
        await refetch();
        showNotification(`ユーザー「${email}」を削除しました。`, "info");
      } catch (error) {
        console.error("Failed to delete user:", error);
        showNotification("ユーザーの削除に失敗しました。", "error");
      } finally {
        setDeletingId(null);
      }
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.email
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesRole =
      roleFilter === "all" || user.roleId === Number(roleFilter);
    return matchesSearch && matchesRole;
  });

  if (isErrorUsers) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center h-[50vh]">
        <div className="text-center space-y-4">
          <ShieldAlert className="h-10 w-10 text-destructive mx-auto" />
          <p className="text-muted-foreground">
            ユーザーの取得に失敗しました。
          </p>
        </div>
      </div>
    );
  }

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
          {notification.type === "info" && <ShieldCheck className="h-4 w-4" />}
          {notification.type === "error" && <ShieldAlert className="h-4 w-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            ユーザー管理
          </h1>
          <p className="text-muted-foreground mt-1">
            システムにアクセスできるユーザーの一覧、およびロールの割り当てを管理します。
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto gap-2 bg-primary text-primary-foreground shadow hover:opacity-90"
          disabled={isLoading || availableRoles.length === 0}
        >
          <Plus className="h-4 w-4" />
          新規ユーザー招待
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-stretch sm:items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              aria-label={"ユーザーを検索"}
              placeholder="メールアドレスで検索..."
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              disabled={isLoading}
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            disabled={isLoading || availableRoles.length === 0}
            className="flex h-9 w-full sm:w-48 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-muted-foreground dark:bg-background"
          >
            <option value="all">すべてのロール</option>
            {availableRoles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>
        <div className="text-sm text-muted-foreground self-end sm:self-center shrink-0">
          該当ユーザー数:{" "}
          <strong className="text-foreground">{filteredUsers.length}</strong>
          {meta?.totalCount
            ? ` / ${meta.totalCount} (全体)`
            : ` / ${users.length} (現在ページ)`}
        </div>
      </div>

      <UsersTable
        users={filteredUsers}
        availableRoles={availableRoles}
        isLoading={isLoading}
        deletingId={deletingId}
        isSubmitting={isSubmitting}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
      />

      <div className="flex items-center justify-between border-t pt-4">
        <div className="text-sm text-muted-foreground">
          {meta?.totalPages && (
            <span>
              全 {meta.totalPages} ページ中 {page} ページ目を表示
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
          >
            前へ
          </Button>
          <div className="text-sm font-medium px-4">{page}</div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={
              (meta?.totalPages
                ? page >= meta.totalPages
                : users.length < limit) || isLoading
            }
          >
            次へ
          </Button>
        </div>
      </div>
    </div>
  );
}
