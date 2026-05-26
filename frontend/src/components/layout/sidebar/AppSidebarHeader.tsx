import  { SidebarHeader,useSidebar } from "@/components/ui/sidebar.tsx";
import { Button } from "@/components/ui/button";

import { Frame, PanelLeftClose } from "lucide-react";



export default function AppSidebarHeader() {
    const { toggleSidebar } = useSidebar();
    return(
        <SidebarHeader className="p-4 border-b flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white">
                    <Frame className="h-5 w-5" />
                </div>
                <div className="flex flex-col text-sm leading-tight">
                    <span className="font-semibold">Acme Inc</span>
                    <span className="text-xs text-gray-500">Enterprise</span>
                </div>
            </div>

            {/* サイドバー閉じるボタン */}
            <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-8 w-8 text-gray-500 hover:text-black"
            >
                <PanelLeftClose className="h-5 w-5" />
            </Button>

        </SidebarHeader>
    )
}