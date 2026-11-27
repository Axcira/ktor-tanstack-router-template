import { useMemo, useState } from "react";

export type ActiveFilter = "all" | "true" | "false";

export function useMasterFilters() {
  const [q, setQ] = useState("");
  const [active, setActive] = useState<ActiveFilter>("all");
  const params = useMemo(() => {
    const trimmed = q.trim();
    return {
      ...(trimmed ? { q: trimmed } : {}),
      ...(active === "all" ? {} : { isActive: active }),
    };
  }, [active, q]);
  return {
    q,
    setQ,
    active,
    setActive,
    params,
    reorderEnabled: active === "all" && q.trim() === "",
  };
}
