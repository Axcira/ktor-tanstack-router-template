import { Link, useRouterState } from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthorize } from "@/hooks/useAuthorize";
import { MASTER_TABS } from "./masters";

export function MasterTabs() {
  const tags = useAuthorize({ type: "ManageMasters", masterId: "tags" });
  const customers = useAuthorize({
    type: "ManageMasters",
    masterId: "customers",
  });
  const products = useAuthorize({
    type: "ManageMasters",
    masterId: "products",
  });
  const allowed: Record<string, boolean> = {
    tags: tags.isAllowed,
    customers: customers.isAllowed,
    products: products.isAllowed,
  };
  const visible = MASTER_TABS.filter((tab) => allowed[tab.id]);
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const current =
    visible.find((tab) => pathname === tab.to)?.id ?? visible[0]?.id;

  if (!current) return null;

  return (
    <Tabs value={current}>
      <TabsList aria-label="マスタ">
        {visible.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            nativeButton={false}
            render={<Link to={tab.to} />}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
