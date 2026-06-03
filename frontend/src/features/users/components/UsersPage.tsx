import { useState, useEffect } from "react";
import {
  Users,
  Mail,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  ShieldAlert,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import type { UserDTO } from "@/api/generated/schemas/userDTO";
import { useGetApiUsers, usePostApiUsersCreate } from "@/api/generated/default/default.ts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const availableRoles = [
  {
    id: 1,
    name: "Administrator",
    badgeClass:
      "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-900/50",
  },
  {
    id: 2,
    name: "Editor",
    badgeClass:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50",
  },
  {
    id: 3,
    name: "Writer",
    badgeClass:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50",
  },
  {
    id: 4,
    name: "Guest Reader",
    badgeClass:
      "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950/30 dark:text-slate-400 dark:border-slate-900/50",
  },
];

export default function UsersPage() {
  const { data: usersResponse, isLoading, isError } = useGetApiUsers();
  const createUserMutation = usePostApiUsersCreate();

  const [users, setUsers] = useState<UserDTO[]>([]);

  useEffect(() => {
    if (usersResponse?.data) {
      setUsers(usersResponse.data);
    }
  }, [usersResponse?.data]);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDTO | null>(null);

  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userRoleId, setUserRoleId] = useState<number>(3);

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
    setUserEmail("");
    setUserPassword("");
    setUserRoleId(3);
    setIsSheetOpen(true);
  };

  const handleOpenEdit = (user: UserDTO) => {
    setEditingUser(user);
    setUserEmail(user.email);
    setUserPassword("");
    setUserRoleId(user.roleId || 4);
    setIsSheetOpen(true);
  };

  const handleSave = async () => {
    if (!userEmail.trim()) {
      showNotification("メールアドレスを入力してください。", "error");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(userEmail)) {
      showNotification("有効なメールアドレス形式で入力してください。", "error");
      return;
    }

    if (!editingUser && !userPassword.trim()) {
      showNotification("パスワードを入力してください。", "error");
      return;
    }

    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? { ...u, email: userEmail, roleId: userRoleId }
            : u,
        ),
      );
      showNotification(`ユーザー「${userEmail}」の情報を更新しました。`);
      setIsSheetOpen(false);
    } else {
      try {
        const response = await createUserMutation.mutateAsync({
          data: {
            email: userEmail,
            password: userPassword,
            roleId: userRoleId,
          },
        });

        if (response.data) {
          setUsers((prev) => [...prev, response.data]);
          showNotification(`ユーザー「${userEmail}」を作成しました。`);
          setIsSheetOpen(false);
        }
      } catch (error) {
        console.error("Failed to create user:", error);
        showNotification("ユーザーの作成に失敗しました。", "error");
      }
    }
  };

  const handleDelete = (userId: number, email: string) => {
    if (confirm(`ユーザー「${email}」を削除してもよろしいですか？`)) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      showNotification(`ユーザー「${email}」を削除しました。`, "info");
    }
  };

  const getRoleInfo = (roleId?: number) => {
    return (
      availableRoles.find((r) => r.id === roleId) || {
        name: "未割り当て",
        badgeClass: "bg-gray-100 text-gray-800",
      }
    );
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.email
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesRole =
      roleFilter === "all" || user.roleId === Number(roleFilter);
    return matchesSearch && matchesRole;
  });

  if (isError) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center h-[50vh]">
        <div className="text-center space-y-4">
          <ShieldAlert className="h-10 w-10 text-destructive mx-auto" />
          <p className="text-muted-foreground">ユーザーの取得に失敗しました。</p>
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
          disabled={isLoading}
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
            disabled={isLoading}
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

      <Card className="border border-border/80 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground font-medium">
                <th className="p-4 w-16 text-center">ID</th>
                <th className="p-4">ユーザー</th>
                <th className="p-4">アサイン済ロール</th>
                <th className="p-4 w-28 text-center">操作</th>
              </tr>
              </thead>
              <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground mt-2">読み込み中...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="p-8 text-center text-muted-foreground italic bg-background/50"
                  >
                    ユーザーが見つかりません。
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const roleInfo = getRoleInfo(user.roleId);
                  const initialLetter = user.email.charAt(0).toUpperCase();

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="p-4 text-center font-mono text-muted-foreground">
                        {user.id}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/10 flex items-center justify-center font-semibold text-primary">
                            {initialLetter}
                          </div>
                          <div className="flex flex-col">
                              <span className="font-semibold text-foreground flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                {user.email}
                              </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                          <span
                            className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold border ${roleInfo.badgeClass}`}
                          >
                            {roleInfo.name}
                          </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-muted"
                            onClick={() => handleOpenEdit(user)}
                          >
                            <Edit2 className="h-3.5 w-3.5 text-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDelete(user.id, user.email)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md flex flex-col h-full bg-card overflow-hidden"
        >
          <SheetHeader className="pb-4 border-b">
            <SheetTitle>
              {editingUser ? "ユーザー情報の編集" : "新規ユーザーの登録"}
            </SheetTitle>
            <SheetDescription>
              システム利用ユーザーのアカウント設定および、ロール（適用される権限セット）の割り当てを行います。
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-1">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user-email">
                  メールアドレス <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="user-email"
                  type="email"
                  placeholder="例: user@example.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  disabled={createUserMutation.isPending}
                />
              </div>

              {!editingUser && (
                <div className="space-y-2">
                  <Label htmlFor="user-password">
                    パスワード <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="user-password"
                    type="password"
                    placeholder="パスワードを入力してください"
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    disabled={createUserMutation.isPending}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="user-role">
                  割り当てるロール <span className="text-destructive">*</span>
                </Label>
                <select
                  id="user-role"
                  value={userRoleId}
                  onChange={(e) => setUserRoleId(Number(e.target.value))}
                  disabled={createUserMutation.isPending}
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground dark:bg-background disabled:opacity-50"
                >
                  {availableRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 mt-auto flex items-center justify-end gap-3 bg-card pb-2">
            <Button
              variant="outline"
              onClick={() => setIsSheetOpen(false)}
              disabled={createUserMutation.isPending}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleSave}
              className="bg-primary text-primary-foreground hover:opacity-90"
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}