import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import AppearanceForm from "@/components/settings/AppearanceForm";
import { renderWithProviders } from "@/test/render";

describe("AppearanceForm theme previews", () => {
  afterEach(() => {
    document.documentElement.classList.remove("dark");
  });

  it("scopes mock UI to theme-preview-light and theme-preview-dark", () => {
    document.documentElement.classList.add("dark");
    const { container } = renderWithProviders(<AppearanceForm />);
    expect(container.querySelectorAll(".theme-preview-light").length).toBe(2);
    expect(container.querySelectorAll(".theme-preview-dark").length).toBe(2);
    expect(screen.getByText("ライト")).toBeInTheDocument();
  });
});
