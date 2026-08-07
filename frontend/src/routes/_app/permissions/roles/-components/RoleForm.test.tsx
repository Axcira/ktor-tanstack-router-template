import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import RoleForm from "./RoleForm";

function requireForm(submitLabel: string) {
  const form = screen
    .getByRole("button", { name: submitLabel })
    .closest("form");
  expect(form).toBeTruthy();
  return form as HTMLFormElement;
}

function requireSwitch(root: Element | null) {
  const sw = root?.querySelector('button[role="switch"]');
  expect(sw).toBeTruthy();
  return sw as HTMLElement;
}

describe("RoleForm", () => {
  it("requires a role name", () => {
    const onSubmit = vi.fn();

    renderWithProviders(
      <RoleForm
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        isSubmitting={false}
        submitLabel="作成"
      />,
    );

    fireEvent.submit(requireForm("作成"));

    expect(
      screen.getByText("ロール名を入力してください。"),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("builds permissions from toggles including allowOthers", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderWithProviders(
      <RoleForm
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        isSubmitting={false}
        submitLabel="作成"
      />,
    );

    await user.type(screen.getByLabelText(/ロール名/), "Moderator");
    await user.type(screen.getByLabelText(/説明/), "mods");

    const updateLabel = screen.getByText("記事の更新と編集");
    await user.click(requireSwitch(updateLabel.closest(".p-4")));

    const allowOthers = await screen.findByText("- 他人の記事の編集");
    await user.click(requireSwitch(allowOthers.closest("div")));

    await user.click(screen.getByRole("button", { name: "作成" }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Moderator",
      description: "mods",
      permissions: [
        expect.objectContaining({
          type: "UpdateArticle",
          allowOthers: true,
        }),
      ],
    });
  });
});
