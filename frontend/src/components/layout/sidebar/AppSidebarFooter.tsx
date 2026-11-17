import { VersionStamp } from "@/components/layout/VersionStamp";
import { SidebarFooter, useSidebar } from "@/components/ui/sidebar";

export default function AppSidebarFooter() {
  const { isMobile, state } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;
  if (isCollapsed) return null;

  return (
    <SidebarFooter className="border-t border-sidebar-border p-2">
      <div className="px-2">
        <VersionStamp />
      </div>
    </SidebarFooter>
  );
}
