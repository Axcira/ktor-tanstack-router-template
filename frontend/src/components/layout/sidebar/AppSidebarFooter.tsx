import { SidebarFooter } from "@/components/ui/sidebar.tsx";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react"; // ログアウト用のアイコンを追加

export default function AppSidebarFooter() {
    return(
        <SidebarFooter className="p-4 border-t border-sidebar-border">
            <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:bg-sidebar-accent hover:text-destructive"
                onClick={() => {

                    console.log("ログアウトしました");
                }}
            >
                <LogOut className="mr-2 h-4 w-4" />
                ログアウト
            </Button>
        </SidebarFooter>
    )
}