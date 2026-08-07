import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import UserForm from "./UserForm";

const roles = [
  {
    id: 1,
    name: "Writer",
    description: "Writer",
    permissions: [],
  },
  {
    id: 2,
    name: "Editor",
    description: "Editor",
    permissions: [],
  },
];

function requireForm() {
  const form = screen.getByRole("button", { name: "保存" }).closest("form");
  expect(form).toBeTruthy();
  return form as HTMLFormElement;
}

describe("UserForm", () => {
  it("shows validation error for invalid email", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <UserForm
        availableRoles={roles}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        isSubmitting={false}
        isLoadingRoles={false}
      />,
    );

    await user.type(screen.getByLabelText(/メールアドレス/), "not-an-email");
    await user.type(screen.getByLabelText(/パスワード/), "secret");
    fireEvent.submit(requireForm());

    expect(
      screen.getByText("有効なメールアドレス形式で入力してください。"),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("requires password when creating a user", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <UserForm
        availableRoles={roles}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        isSubmitting={false}
        isLoadingRoles={false}
      />,
    );

    await user.type(screen.getByLabelText(/メールアドレス/), "a@b.com");
    fireEvent.submit(requireForm());

    expect(
      screen.getByText("パスワードを入力してください。"),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits create payload with password", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderWithProviders(
      <UserForm
        availableRoles={roles}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        isSubmitting={false}
        isLoadingRoles={false}
      />,
    );

    await user.type(screen.getByLabelText(/メールアドレス/), "a@b.com");
    await user.type(screen.getByLabelText(/パスワード/), "secret");
    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(onSubmit).toHaveBeenCalledWith({
      email: "a@b.com",
      password: "secret",
      roleId: 1,
    });
  });

  it("omits password when editing", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderWithProviders(
      <UserForm
        editingUser={{ id: 9, email: "old@b.com", roleId: 2 }}
        availableRoles={roles}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        isSubmitting={false}
        isLoadingRoles={false}
      />,
    );

    expect(screen.queryByLabelText(/パスワード/)).not.toBeInTheDocument();
    await user.clear(screen.getByLabelText(/メールアドレス/));
    await user.type(screen.getByLabelText(/メールアドレス/), "new@b.com");
    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(onSubmit).toHaveBeenCalledWith({
      email: "new@b.com",
      password: undefined,
      roleId: 2,
    });
  });
});
