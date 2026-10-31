import { fireEvent, render, screen } from "@testing-library/react";
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

  it("renders a native select on coarse pointers", () => {
    mockCoarsePointer(true);
    const { container } = render(
      <ResponsiveSelect
        value="all"
        onValueChange={() => {}}
        options={options}
        aria-label="Filter"
      />,
    );
    expect(container.querySelector("select")).toBeTruthy();
    expect(container.querySelector("[data-slot=select-trigger]")).toBeNull();
  });

  it("renders shadcn Select on fine pointers", () => {
    mockCoarsePointer(false);
    render(
      <ResponsiveSelect
        value="all"
        onValueChange={() => {}}
        options={options}
        aria-label="Filter"
      />,
    );
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("forwards id, required, and aria-required to the native select", () => {
    mockCoarsePointer(true);
    render(
      <ResponsiveSelect
        id="user-role"
        value=""
        onValueChange={() => {}}
        options={options}
        required
      />,
    );
    const select = screen.getByRole("combobox");
    expect(select.tagName).toBe("SELECT");
    expect(select).toHaveAttribute("id", "user-role");
    expect(select).toBeRequired();
    expect(select).toHaveAttribute("aria-required", "true");
  });

  it("forwards id, required, and aria-required to the shadcn trigger", () => {
    mockCoarsePointer(false);
    render(
      <ResponsiveSelect
        id="user-role"
        value="all"
        onValueChange={() => {}}
        options={options}
        aria-label="割り当てるロール"
        required
      />,
    );
    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveAttribute("id", "user-role");
    expect(trigger).toHaveAttribute("required");
    expect(trigger).toHaveAttribute("aria-required", "true");
  });

  it("ignores Radix-only props on the native select and still reports value changes", () => {
    mockCoarsePointer(true);
    const onValueChange = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ResponsiveSelect
        value="all"
        onValueChange={onValueChange}
        options={options}
        aria-label="Filter"
        open
        onOpenChange={onOpenChange}
        dir="rtl"
        name="role"
      />,
    );
    const select = screen.getByRole("combobox");
    expect(select.tagName).toBe("SELECT");
    expect(select).not.toHaveAttribute("dir");
    expect(select).not.toHaveAttribute("open");
    expect(select).toHaveAttribute("name", "role");
    fireEvent.change(select, { target: { value: "1" } });
    expect(onValueChange).toHaveBeenCalledWith("1");
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("forwards shared DOM props to the native select", () => {
    mockCoarsePointer(true);
    render(
      <ResponsiveSelect
        value="all"
        onValueChange={() => {}}
        options={options}
        id="role"
        className="w-32"
        aria-label="Role"
        data-testid="role-select"
      />,
    );
    const select = screen.getByTestId("role-select");
    expect(select.tagName).toBe("SELECT");
    expect(select).toHaveAttribute("id", "role");
    expect(select).toHaveAttribute("aria-label", "Role");
    expect(select.className).toContain("w-32");
  });

  it("forwards shared DOM props to the shadcn trigger", () => {
    mockCoarsePointer(false);
    render(
      <ResponsiveSelect
        value="all"
        onValueChange={() => {}}
        options={options}
        id="role"
        className="w-32"
        aria-label="Role"
        data-testid="role-select"
      />,
    );
    const trigger = screen.getByTestId("role-select");
    expect(trigger).toHaveAttribute("data-slot", "select-trigger");
    expect(trigger).toHaveAttribute("id", "role");
    expect(trigger).toHaveAttribute("aria-label", "Role");
    expect(trigger.className).toContain("w-32");
  });

  it("calls onValueChange from the shadcn select", () => {
    mockCoarsePointer(false);
    const onValueChange = vi.fn();
    render(
      <form>
        <ResponsiveSelect
          value="all"
          onValueChange={onValueChange}
          options={options}
          aria-label="Filter"
        />
      </form>,
    );
    expect(screen.getByRole("combobox")).toHaveTextContent("All");
    const bubble = document.querySelector("select");
    expect(bubble).toBeTruthy();
    fireEvent.change(bubble as HTMLSelectElement, { target: { value: "1" } });
    expect(onValueChange).toHaveBeenCalledWith("1");
  });
});
