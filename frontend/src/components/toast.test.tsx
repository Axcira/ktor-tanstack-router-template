import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { createToastManager, Toaster } from "@/components/ui/toast";

function renderToaster() {
  const manager = createToastManager();
  const view = render(
    <>
      <button
        type="button"
        onClick={() =>
          manager.add({
            type: "success",
            title: "保存しました",
            description: "詳細です",
          })
        }
      >
        success
      </button>
      <button
        type="button"
        onClick={() => manager.add({ title: "通常の通知です" })}
      >
        plain
      </button>
      <button
        type="button"
        onClick={() => manager.add({ type: "error", title: "失敗しました" })}
      >
        failure
      </button>
      <Toaster toastManager={manager} />
    </>,
  );
  return { user: userEvent.setup(), ...view };
}

describe("Toaster", () => {
  it("renders a typed toast on the semantic surface", async () => {
    const { user } = renderToaster();

    await user.click(screen.getByRole("button", { name: "success" }));

    const title = await screen.findByRole("heading", { name: "保存しました" });
    expect(screen.getByText("詳細です")).toBeInTheDocument();
    const toast = title.closest("[data-slot=toast]");
    expect(toast).toHaveAttribute("data-type", "success");
    expect(toast).toHaveClass(
      "bg-success-container",
      "text-success-container-foreground",
      "border-success",
      "rounded-lg",
    );
  });

  it("uses the default surface when a toast has no type", async () => {
    const { user } = renderToaster();

    await user.click(screen.getByRole("button", { name: "plain" }));

    const title = await screen.findByRole("heading", {
      name: "通常の通知です",
    });
    const toast = title.closest("[data-slot=toast]");
    expect(toast).not.toHaveAttribute("data-type");
    expect(toast).toHaveClass("bg-surface-container", "text-foreground");
  });

  it("closes from the toast itself", async () => {
    const { user } = renderToaster();

    await user.click(screen.getByRole("button", { name: "failure" }));

    const title = await screen.findByRole("heading", { name: "失敗しました" });
    const toast = title.closest("[data-slot=toast]");
    expect(toast).toHaveClass("bg-destructive-container");

    const close = toast?.querySelector("[data-slot=toast-close]");
    expect(close).not.toBeNull();
    await user.click(close as HTMLElement);

    expect(toast).toHaveAttribute("data-ending-style");
  });
});
