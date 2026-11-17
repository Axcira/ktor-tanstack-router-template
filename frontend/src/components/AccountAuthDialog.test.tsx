import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { AccountAuthDialog } from "@/components/AccountAuthDialog";
import { createTestQueryClient } from "@/test/render";

function renderDialog(ui: ReactElement) {
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(ui, { wrapper });
}

describe("AccountAuthDialog", () => {
  it("does not render a cancel button", () => {
    renderDialog(
      <AccountAuthDialog
        open
        mode="add"
        email=""
        onOpenChange={() => {}}
        onSuccess={() => {}}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "キャンセル" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "アカウントを追加" }),
    ).toBeInTheDocument();
  });

  it("tabs from password to the submit button", async () => {
    const user = userEvent.setup();
    renderDialog(
      <AccountAuthDialog
        open
        mode="reauth"
        email="expired@example.com"
        onOpenChange={() => {}}
        onSuccess={() => {}}
      />,
    );

    const password = screen.getByLabelText("パスワード");
    const submit = screen.getByRole("button", { name: "ログイン" });
    await user.click(password);
    await user.tab();
    expect(submit).toHaveFocus();
  });
});
