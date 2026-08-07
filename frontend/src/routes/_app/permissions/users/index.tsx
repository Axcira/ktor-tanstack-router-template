import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, Search, ShieldAlert, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useDeleteUserV1,
  useGetRolesV1,
  useGetUsersV1,
} from "@/api/generated/default/default.ts";
import type { UserDTO } from "@/api/generated/schemas/userDTO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteUserDialog } from "./-components/DeleteUserDialog";
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

  const [userToDelete, setUserToDelete] = useState<{
    id: number;
    email: string;
  } | null>(null);

  const handleOpenCreate = () => {
    navigate({ to: "/permissions/users/create" }).then();
  };

  const handleOpenEdit = (user: UserDTO) => {
    navigate({
      to: "/permissions/users/$userId/edit",
      params: { userId: String(user.id) },
    }).then();
  };

  const handleDeleteRequest = (userId: number, email: string) => {
    setUserToDelete({ id: userId, email });
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    const { id: userId, email } = userToDelete;
    setDeletingId(userId);
    try {
      await deleteUserMutation.mutateAsync({ id: String(userId) });
      setUserToDelete(null);
      await refetch();
      toast.success(`ユーザー「${email}」を削除しました。`);
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error("ユーザーの削除に失敗しました。");
    } finally {
      setDeletingId(null);
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
        onDelete={handleDeleteRequest}
      />

      <DeleteUserDialog
        email={userToDelete?.email ?? null}
        isOpen={!!userToDelete}
        isDeleting={deletingId !== null}
        onOpenChange={(open) => {
          if (!open && deletingId === null) setUserToDelete(null);
        }}
        onConfirm={() => {
          handleConfirmDelete().then();
        }}
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
