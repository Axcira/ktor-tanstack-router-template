import { Edit2, Loader2, Mail, Trash2 } from "lucide-react";
import type { RoleDTO } from "@/api/generated/schemas/roleDTO";
import type { UserDTO } from "@/api/generated/schemas/userDTO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const getRoleBadgeClass = (roleName: string) => {
  switch (roleName) {
    case "Administrator":
      return "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-900/50";
    case "Editor":
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50";
    case "Writer":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50";
    case "Guest Reader":
      return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950/30 dark:text-slate-400 dark:border-slate-900/50";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400 dark:border-gray-900/50";
  }
};

interface UsersTableProps {
  users: UserDTO[];
  availableRoles: RoleDTO[];
  isLoading: boolean;
  deletingId: number | null;
  isSubmitting: boolean;
  onEdit: (user: UserDTO) => void;
  onDelete: (userId: number, email: string) => void;
}

export function UsersTable({
  users,
  availableRoles,
  isLoading,
  deletingId,
  isSubmitting,
  onEdit,
  onDelete,
}: UsersTableProps) {
  const getRoleInfo = (roleId?: number | null) => {
    const role = availableRoles.find((r) => r.id === roleId);
    if (role) {
      return {
        name: role.name,
        badgeClass: getRoleBadgeClass(role.name),
      };
    }
    return {
      name: "未割り当て",
      badgeClass: "bg-gray-100 text-gray-800",
    };
  };

  return (
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
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="p-8 text-center text-muted-foreground italic bg-background/50"
                  >
                    ユーザーが見つかりません。
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const roleInfo = getRoleInfo(user.roleId);
                  const initialLetter = user.email.charAt(0).toUpperCase();
                  const isUserDeleting = deletingId === user.id;

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
                            aria-label="編集"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-muted"
                            onClick={() => onEdit(user)}
                            disabled={
                              isUserDeleting ||
                              isSubmitting ||
                              availableRoles.length === 0
                            }
                          >
                            <Edit2 className="h-3.5 w-3.5 text-foreground" />
                          </Button>
                          <Button
                            aria-label="削除"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => onDelete(user.id, user.email)}
                            disabled={isUserDeleting || isSubmitting}
                          >
                            {isUserDeleting ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-destructive" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
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
  );
}
