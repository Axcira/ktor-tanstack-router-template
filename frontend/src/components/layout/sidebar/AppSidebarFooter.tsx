import { SidebarFooter } from "@/components/ui/sidebar.tsx";


export default function AppSidebarFooter() {
    return(
        <SidebarFooter className="p-4 border-t">
            <div className="flex items-center gap-2">
                <img
                    src="https://github.com/shadcn.png"
                    alt="User"
                    className="h-8 w-8 rounded-full"
                />
                <div className="flex flex-col text-sm leading-tight">
                    <span className="font-semibold">shadcn</span>
                    <span className="text-xs text-gray-500">m@example.com</span>
                </div>
            </div>
        </SidebarFooter>
    )
}