import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import ArticleForm from "./ArticleForm";

describe("ArticleForm", () => {
  it("renders initial values", () => {
    renderWithProviders(
      <ArticleForm
        initialValues={{
          title: "T",
          description: "D",
          body: "B",
          tagList: "a,b",
        }}
        onSubmit={vi.fn()}
        isSubmitting={false}
        submitLabel="保存"
      />,
    );

    expect(screen.getByLabelText("タイトル")).toHaveValue("T");
    expect(screen.getByLabelText("概要")).toHaveValue("D");
    expect(screen.getByLabelText("本文")).toHaveValue("B");
    expect(screen.getByLabelText("タグ (カンマ区切り)")).toHaveValue("a,b");
  });

  it("submits current values", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderWithProviders(
      <ArticleForm
        onSubmit={onSubmit}
        isSubmitting={false}
        submitLabel="投稿"
      />,
    );

    await user.type(screen.getByLabelText("タイトル"), "Title");
    await user.type(screen.getByLabelText("概要"), "Desc");
    await user.type(screen.getByLabelText("本文"), "Body");
    await user.type(screen.getByLabelText("タグ (カンマ区切り)"), "tag1");
    await user.click(screen.getByRole("button", { name: "投稿" }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: "Title",
      description: "Desc",
      body: "Body",
      tagList: "tag1",
    });
  });

  it("disables submit while submitting", () => {
    renderWithProviders(
      <ArticleForm onSubmit={vi.fn()} isSubmitting submitLabel="投稿" />,
    );

    expect(screen.getByRole("button", { name: /投稿/ })).toBeDisabled();
  });
});
