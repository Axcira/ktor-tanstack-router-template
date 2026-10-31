import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { RoleDTO } from "@/api/generated/schemas/roleDTO";
import { ResponsiveSelect } from "@/components/ResponsiveSelect";
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
  const [selectedFallbackId, setSelectedFallbackId] = useState<string>("");

  useEffect(() => {
    if (roleToDelete) {
      setSelectedFallbackId("");
    }
  }, [roleToDelete]);

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
            <ResponsiveSelect
              id="fallback-role"
              value={selectedFallbackId}
              onValueChange={setSelectedFallbackId}
              placeholder="ロールを選択"
              className="w-full"
              options={roles
                .filter((r) => r.id !== roleToDelete?.id)
                .map((r) => ({
                  value: String(r.id),
                  label: r.name,
                }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            キャンセル
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting || !selectedFallbackId}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            削除を実行
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
