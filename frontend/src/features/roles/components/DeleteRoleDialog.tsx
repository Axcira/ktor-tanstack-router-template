import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import type { RoleDTO } from "@/api/generated/schemas/roleDTO";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DeleteRoleDialogProps {
  roleToDelete: RoleDTO | null;
  onClose: () => void;
  onConfirm: (fallbackRoleId: string) => void;
  roles: RoleDTO[];
  isDeleting: boolean;
}

export function DeleteRoleDialog({
  roleToDelete,
  onClose,
  onConfirm,
  roles,
  isDeleting,
}: DeleteRoleDialogProps) {
  const [selectedFallbackId, setSelectedFallbackId] = useState<string>("4");

  useEffect(() => {
    if (roleToDelete) {
      // Set to "4" as default, or fallback to the first available non-deleted role
      const availableRoles = roles.filter((r) => r.id !== roleToDelete.id);
      const defaultFallback = availableRoles.some((r) => String(r.id) === "4")
        ? "4"
        : availableRoles[0]
          ? String(availableRoles[0].id)
          : "";
      setSelectedFallbackId(defaultFallback);
    }
  }, [roleToDelete, roles]);

  const handleConfirm = () => {
    onConfirm(selectedFallbackId);
  };

  return (
    <Dialog open={!!roleToDelete} onOpenChange={(open) => !open && onClose()}>
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
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            キャンセル
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isDeleting}>
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            削除を実行
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
