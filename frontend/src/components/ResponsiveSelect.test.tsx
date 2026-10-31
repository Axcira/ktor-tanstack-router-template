import { render, screen } from "@testing-library/react";
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
});
