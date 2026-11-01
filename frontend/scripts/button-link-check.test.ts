import { describe, expect, it } from "vitest";
import { buttonLinkIssuesInSource } from "./button-link-check.ts";

describe("buttonLinkIssuesInSource", () => {
  it("flags Button render props that point at Link or an anchor", () => {
    const source = `
      <Button render={<Link to="/login">ログイン</Link>} />
      <Button
        variant="ghost"
        render={
          <a href="/articles">一覧</a>
        }
      />
    `;
    const issues = buttonLinkIssuesInSource(source);
    expect(issues.map((issue) => issue.line)).toEqual([2, 3]);
  });

  it("allows ButtonLink, plain buttons, and longer element names", () => {
    const source = `
      <ButtonLink to="/articles">書く</ButtonLink>
      <Button type="submit">保存</Button>
      <ButtonGroup><Button>内側</Button></ButtonGroup>
      <SidebarMenuButton render={<Link to="/" />} />
    `;
    expect(buttonLinkIssuesInSource(source)).toEqual([]);
  });
});
