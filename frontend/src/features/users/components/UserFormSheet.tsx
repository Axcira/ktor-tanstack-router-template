import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import type { UserDTO } from "@/api/generated/schemas/userDTO";
import type { RoleDTO } from "@/api/generated/schemas/roleDTO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface UserFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser: UserDTO | null;
  availableRoles: RoleDTO[];
  onSave: (data: { email: string; password?: string; roleId: number }) => void;
  onValidationError: (message: string) => void;
  isSubmitting: boolean;
  isLoadingRoles: boolean;
}

export function UserFormSheet({
  open,
  onOpenChange,
  editingUser,
  availableRoles,
  onSave,
  onValidationError,
  isSubmitting,
  isLoadingRoles,
}: UserFormSheetProps) {
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userRoleId, setUserRoleId] = useState<number>(0);

  useEffect(() => {
    if (open) {
      if (editingUser) {
        setUserEmail(editingUser.email);
        setUserPassword("");
        setUserRoleId(editingUser.roleId || availableRoles[0]?.id || 0);
      } else {
        setUserEmail("");
        setUserPassword("");
        const defaultRole =
          availableRoles.find((r) => r.name === "Writer")?.id ||
          availableRoles[0]?.id ||
          0;
        setUserRoleId(defaultRole);
      }
    }
  }, [open, editingUser, availableRoles]);

  const handleSaveClick = () => {
    if (!userEmail.trim()) {
      onValidationError("メールアドレスを入力してください。");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(userEmail)) {
      onValidationError("有効なメールアドレス形式で入力してください。");
      return;
    }

    if (!editingUser && !userPassword.trim()) {
      onValidationError("パスワードを入力してください。");
      return;
    }

    if (!userRoleId) {
      onValidationError("ロールを選択してください。");
      return;
    }

    onSave({
      email: userEmail,
      password: editingUser ? undefined : userPassword,
      roleId: userRoleId,
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
                disabled={isSubmitting}
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
        </div>

        <div className="border-t pt-4 mt-auto flex items-center justify-end gap-3 bg-card pb-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSaveClick}
            className="bg-primary text-primary-foreground hover:opacity-90"
            disabled={isSubmitting || !userRoleId}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            保存
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
