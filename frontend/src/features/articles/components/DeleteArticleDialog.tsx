import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useDeleteArticleV1 } from "@/api/generated/default/default";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteArticleDialogProps {
  articleId: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DeleteArticleDialog({
  articleId,
  isOpen,
  onOpenChange,
}: DeleteArticleDialogProps) {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteMutation = useDeleteArticleV1();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync({ id: articleId.toString() });
      onOpenChange(false);
      await navigate({ to: "/articles", replace: true });
    } catch (error) {
      console.error("Failed to delete article:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>記事を削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            この操作は取り消せません。この記事は永久に削除されます。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            キャンセル
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete().then();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            削除する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
