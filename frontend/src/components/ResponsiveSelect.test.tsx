import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ResponsiveSelect } from "@/components/ResponsiveSelect";

function mockCoarsePointer(coarse: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query.includes("pointer: coarse") ? coarse : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}

describe("ResponsiveSelect", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const options = [
    { value: "all", label: "All" },
    { value: "1", label: "Admin" },
  ];

  it("renders a native select on coarse pointers, forwards DOM props, and ignores popup props", () => {
    mockCoarsePointer(true);
    const onValueChange = vi.fn();
    const onOpenChange = vi.fn();
    const { container } = render(
      <ResponsiveSelect
        id="user-role"
        value="all"
        onValueChange={onValueChange}
        options={options}
        aria-label="Filter"
        className="w-32"
        data-testid="role-select"
        required
        open
        onOpenChange={onOpenChange}
        name="role"
      />,
    );
    expect(container.querySelector("[data-slot=select-trigger]")).toBeNull();
    const select = screen.getByTestId("role-select");
    expect(select.tagName).toBe("SELECT");
    expect(select).toHaveAttribute("id", "user-role");
    expect(select).toHaveAttribute("aria-label", "Filter");
    expect(select).toBeRequired();
    expect(select).toHaveAttribute("aria-required", "true");
    expect(select.className).toContain("w-32");
    expect(select).not.toHaveAttribute("open");
    expect(select).toHaveAttribute("name", "role");

    fireEvent.change(select, { target: { value: "1" } });
    expect(onValueChange).toHaveBeenCalledWith("1");
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("renders shadcn Select on fine pointers, forwards DOM props, and reports value changes", async () => {
    mockCoarsePointer(false);
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(
      <form>
        <ResponsiveSelect
          id="user-role"
          value="all"
          onValueChange={onValueChange}
          options={options}
          aria-label="Filter"
          className="w-32"
          data-testid="role-select"
          required
        />
      </form>,
    );
    const trigger = screen.getByTestId("role-select");
    expect(trigger).toHaveAttribute("data-slot", "select-trigger");
    expect(trigger).toHaveAttribute("id", "user-role");
    expect(trigger).toHaveAttribute("aria-label", "Filter");
    expect(trigger).toHaveAttribute("required");
    expect(trigger).toHaveAttribute("aria-required", "true");
    expect(trigger.className).toContain("w-32");
    expect(trigger).toHaveTextContent("All");

    await user.click(trigger);
    await user.click(await screen.findByRole("option", { name: "Admin" }));
    expect(onValueChange).toHaveBeenCalled();
    expect(onValueChange.mock.calls[0]?.[0]).toBe("1");
  });
});
