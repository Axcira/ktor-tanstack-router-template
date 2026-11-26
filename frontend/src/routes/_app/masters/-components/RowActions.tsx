import { Check, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RowActions({
  editing,
  pending,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: {
  editing: boolean;
  pending: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  if (editing) {
    return (
      <div className="flex justify-end gap-1">
        <Button type="button" size="sm" onClick={onSave} disabled={pending}>
          <Check />
          保存
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onCancel}
          disabled={pending}
        >
          <X />
          キャンセル
        </Button>
      </div>
    );
  }

  return (
    <div className="flex justify-end gap-1">
      <Button type="button" size="sm" variant="outline" onClick={onEdit}>
        <Pencil />
        編集
      </Button>
      <Button type="button" size="sm" variant="destructive" onClick={onDelete}>
        <Trash2 />
        削除
      </Button>
    </div>
  );
}
