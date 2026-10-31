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
});
