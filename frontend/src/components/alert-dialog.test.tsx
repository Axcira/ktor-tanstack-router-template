import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MouseEvent } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function ConfirmDialog({
  onConfirm,
}: {
  onConfirm: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger>開く</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>確認</AlertDialogTitle>
        <AlertDialogDescription>この操作を実行します。</AlertDialogDescription>
        <AlertDialogCancel>キャンセル</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm}>実行</AlertDialogAction>
      </AlertDialogContent>
    </AlertDialog>
  );
}

describe("AlertDialogAction", () => {
  it("runs onClick and closes the dialog", async () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog onConfirm={onConfirm} />);

    await userEvent.click(screen.getByRole("button", { name: "開く" }));
    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "実行" }));

    expect(onConfirm).toHaveBeenCalledOnce();
    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
  });

  it("keeps the dialog open when onClick prevents the close", async () => {
    const onConfirm = vi.fn((event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
    });
    render(<ConfirmDialog onConfirm={onConfirm} />);

    await userEvent.click(screen.getByRole("button", { name: "開く" }));
    await userEvent.click(await screen.findByRole("button", { name: "実行" }));

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });
});
