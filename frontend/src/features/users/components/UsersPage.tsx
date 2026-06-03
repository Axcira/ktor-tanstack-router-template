import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  Check,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import type { UserDTO } from "@/api/generated/schemas/userDTO";
import {
  useGetApiUsers,
  usePostApiUsersCreate,
  usePatchApiUsersUpdateId,
  useDeleteApiUsersDeleteId,
  useGetApiRoles,
} from "@/api/generated/default/default.ts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UsersTable } from "./UsersTable";
import { UserFormSheet } from "./UserFormSheet";

export default function UsersPage() {
  const { data: usersResponse, isLoading: isLoadingUsers, isError: isErrorUsers, refetch } = useGetApiUsers();
  const { data: rolesResponse, isLoading: isLoadingRoles } = useGetApiRoles();

  const createUserMutation = usePostApiUsersCreate();
  const updateUserMutation = usePatchApiUsersUpdateId();
  const deleteUserMutation = useDeleteApiUsersDeleteId();

  const isSubmitting =
    createUserMutation.isPending || updateUserMutation.isPending;
  const isLoading = isLoadingUsers || isLoadingRoles;

  // データ抽出
  const availableRoles = rolesResponse?.data || [];

  const [users, setUsers] = useState<UserDTO[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (usersResponse?.data) {
      setUsers(usersResponse.data);
    }
  }, [usersResponse?.data]);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDTO | null>(null);

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
    setEditingUser(null);
    setIsSheetOpen(true);
  };

  const handleOpenEdit = (user: UserDTO) => {
    setEditingUser(user);
    setIsSheetOpen(true);
  };

  const handleSave = async (data: { email: string; password?: string; roleId: number }) => {
    if (editingUser) {
      try {
        await updateUserMutation.mutateAsync({
          id: String(editingUser.id),
          data: {
            email: data.email,
            roleId: data.roleId,
          },
        });

        setUsers((prev) =>
          prev.map((u) =>
            u.id === editingUser.id
              ? { ...u, email: data.email, roleId: data.roleId }
              : u,
          ),
        );
        showNotification(`ユーザー「${data.email}」の情報を更新しました。`);
        setIsSheetOpen(false);
        refetch();
      } catch (error) {
        console.error("Failed to update user:", error);
        showNotification("ユーザーの更新に失敗しました。", "error");
      }
    } else {
      try {
        const response = await createUserMutation.mutateAsync({
          data: {
            email: data.email,
            password: data.password || "",
            roleId: data.roleId,
          },
        });

        if (response.data) {
          setUsers((prev) => [...prev, response.data]);
          showNotification(`ユーザー「${data.email}」を作成しました。`);
          setIsSheetOpen(false);
          refetch();
        }
      } catch (error) {
        console.error("Failed to create user:", error);
        showNotification("ユーザーの作成に失敗しました。", "error");
      }
    }
  };

  const handleDelete = async (userId: number, email: string) => {
    if (confirm(`ユーザー「${email}」を削除してもよろしいですか？`)) {
      setDeletingId(userId);
      try {
        await deleteUserMutation.mutateAsync({ id: String(userId) });
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        showNotification(`ユーザー「${email}」を削除しました。`, "info");
        refetch();
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
          disabled={isLoading || isSubmitting || availableRoles.length === 0}
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
              placeholder="メールアドレスで検索..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
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
          <strong className="text-foreground">{filteredUsers.length}</strong> /{" "}
          {users.length}
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

      <UserFormSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        editingUser={editingUser}
        availableRoles={availableRoles}
        onSave={handleSave}
        onValidationError={(msg) => showNotification(msg, "error")}
        isSubmitting={isSubmitting}
        isLoadingRoles={isLoadingRoles}
      />
    </div>
  );
}