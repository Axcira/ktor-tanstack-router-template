import  { SidebarHeader,useSidebar } from "@/components/ui/sidebar.tsx";
import { Button } from "@/components/ui/button";
import { Frame, PanelLeftClose, PanelLeft } from "lucide-react";

export default function AppSidebarHeader() {
    const { toggleSidebar } = useSidebar();
    return(
        <SidebarHeader className="p-4 h-17 border-b border-sidebar-border flex flex-row items-center justify-between group-data-[state=collapsed]:p-2 group-data-[state=collapsed]:justify-center">
            <div className="flex items-center gap-2 group-data-[state=collapsed]:hidden">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shrink-0">
                    <Frame className="h-5 w-5" />
                </div>
                <div className="flex flex-col text-sm leading-tight">
                    <span className="font-semibold">Acme Inc</span>
                    <span className="text-xs text-sidebar-foreground/70">Enterprise</span>
                </div>
            </div>

            {/* サイドバー開閉ボタン */}
            <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            >
                <PanelLeftClose className="h-5 w-5 group-data-[state=collapsed]:hidden" />
                <PanelLeft className="h-5 w-5 group-data-[state=expanded]:hidden" />
            </Button>

        </SidebarHeader>
    )
}