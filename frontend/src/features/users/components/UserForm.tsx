import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { UserDTO } from "@/api/generated/schemas/userDTO";
import type { RoleDTO } from "@/api/generated/schemas/roleDTO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UserFormProps {
  editingUser?: UserDTO | null;
  availableRoles: RoleDTO[];
  onSubmit: (data: {
    email: string;
    password?: string;
    roleId: number;
  }) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  isLoadingRoles: boolean;
}

export default function UserForm({
  editingUser,
  availableRoles,
  onSubmit,
  onCancel,
  isSubmitting,
  isLoadingRoles,
}: UserFormProps) {
  const [userEmail, setUserEmail] = useState(editingUser?.email || "");
  const [userPassword, setUserPassword] = useState("");
  const [userRoleId, setUserRoleId] = useState<number>(() => {
    if (editingUser?.roleId) return editingUser.roleId;
    const defaultRole =
      availableRoles.find((r) => r.name === "Writer")?.id ||
      availableRoles[0]?.id ||
      0;
    return defaultRole;
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!userEmail.trim()) {
      setValidationError("メールアドレスを入力してください。");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(userEmail)) {
      setValidationError("有効なメールアドレス形式で入力してください。");
      return;
    }

    if (!editingUser && !userPassword.trim()) {
      setValidationError("パスワードを入力してください。");
      return;
    }

    if (!userRoleId) {
      setValidationError("ロールを選択してください。");
      return;
    }

    try {
      await onSubmit({
        email: userEmail,
        password: editingUser ? undefined : userPassword,
        roleId: userRoleId,
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
          <Label htmlFor="user-email">
            メールアドレス <span className="text-destructive">*</span>
          </Label>
          <Input
            id="user-email"
            type="email"
            placeholder="例: user@example.com"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            disabled={isSubmitting}
            required
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
              disabled={isSubmitting}
              required
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
            disabled={isSubmitting || isLoadingRoles}
            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground dark:bg-background disabled:opacity-50"
            required
          >
            <option value={0} disabled>
              ロールを選択してください
            </option>
            {availableRoles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
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
          disabled={isSubmitting || !userRoleId}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          保存
        </Button>
      </div>
    </form>
  );
}
