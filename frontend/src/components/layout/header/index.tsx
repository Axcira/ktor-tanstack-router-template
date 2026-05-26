import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {useSidebar} from "#/components/ui/sidebar.tsx";

export default function AppHeader() {
    const { toggleSidebar } = useSidebar();
    return (
        <header className="w-full h-16 bg-[#1a73e8] flex items-center justify-between px-6">
            {/* Left: Hamburger + Title */}
            <div className="flex items-center gap-5">
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10 hover:text-white w-10 h-10"
                    aria-label="メニュー"
                    onClick={toggleSidebar}
                >
                    <Menu className="h-6 w-6" />
                </Button>
                <span className="text-white font-medium text-xl">Photos</span>
            </div>

            {/* Right: User icon */}
            <Avatar className="h-10 w-10 cursor-pointer ring-2 ring-white/30 hover:ring-white/60 transition-all">
                <AvatarImage src="https://github.com/shadcn.png" alt="ユーザー" />
                <AvatarFallback className="bg-white/20 text-white text-sm">U</AvatarFallback>
            </Avatar>
        </header>
    );
}