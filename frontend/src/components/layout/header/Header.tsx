import { Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar.tsx";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function AppHeader() {
  const {toggleSidebar} = useSidebar();
  return (<header className="w-full h-17 bg-background text-foreground border-b border-border flex items-center justify-between px-6">

      <div className="flex items-center gap-5">
        <Button
          variant="ghost"
          size="icon"

          className="text-primary hover:bg-primary/10 hover:text-primary w-10 h-10 md:hidden"
          aria-label="メニュー"
          onClick={toggleSidebar}
        >
          <Menu className="h-6 w-6"/>
        </Button>
        <span className="text-primary font-medium text-xl">Ktor-Tanstack-Router-Template</span>
      </div>

      <Avatar className="h-10 w-10 cursor-pointer ring-2 ring-primary/20 hover:ring-primary/50 transition-all">
        <AvatarImage src="" alt="ユーザー"/>
        <AvatarFallback className="bg-primary text-primary-foreground text-sm">U</AvatarFallback>
      </Avatar>

    </header>);
}
