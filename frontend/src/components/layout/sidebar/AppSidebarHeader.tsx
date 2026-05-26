import  { SidebarHeader } from "@/components/ui/sidebar.tsx";
import { Frame } from "lucide-react";

export default function AppSidebarHeader() {
    return(
        <SidebarHeader className="p-4 border-b">
            <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white">
                    <Frame className="h-5 w-5" />
                </div>
                <div className="flex flex-col text-sm leading-tight">
                    <span className="font-semibold">Acme Inc</span>
                    <span className="text-xs text-gray-500">Enterprise</span>
                </div>
            </div>
        </SidebarHeader>
    )
}