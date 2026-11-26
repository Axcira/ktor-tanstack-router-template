import { Link, useRouterState } from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthorize } from "@/hooks/useAuthorize";
import { MASTER_TABS, type MasterTab } from "./masters";

export function MasterTabs() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const current =
    MASTER_TABS.find((tab) => pathname === tab.to)?.id ?? MASTER_TABS[0].id;

  return (
    <Tabs value={current}>
      <TabsList aria-label="マスタ">
        {MASTER_TABS.map((tab) => (
          <MasterTabTrigger key={tab.id} tab={tab} />
        ))}
      </TabsList>
    </Tabs>
  );
}

function MasterTabTrigger({ tab }: { tab: MasterTab }) {
  const { isAllowed } = useAuthorize(tab.permission);
  if (!isAllowed) return null;
  return (
    <TabsTrigger
      value={tab.id}
      nativeButton={false}
      render={<Link to={tab.to} />}
    >
      {tab.label}
    </TabsTrigger>
  );
}
