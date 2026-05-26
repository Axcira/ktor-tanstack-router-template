import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {useSidebar} from "#/components/ui/sidebar.tsx";

export default function AppHeader() {
    const { toggleSidebar } = useSidebar();
    return (
		<header className="w-full h-17 bg-background text-foreground border-b border-border flex items-center justify-between px-6">

			{/* Left: Hamburger + Title */}
			<div className="flex items-center gap-5">
				<Button
					variant="ghost"
				    size="icon"

				    className="text-primary hover:bg-primary/10 hover:text-primary w-10 h-10"
				    aria-label="メニュー"
				    onClick={toggleSidebar}
				>
					<Menu className="h-6 w-6" />
				</Button>
				<span className="text-primary font-medium text-xl">Photos</span>
			</div>

			{/* Right: User icon */}
			{/* 修正3: リングの色を「白」から「青(primary)の透過」に変更 */}
			<Avatar className="h-10 w-10 cursor-pointer ring-2 ring-primary/20 hover:ring-primary/50 transition-all">
				<AvatarImage src="https://github.com/shadcn.png" alt="ユーザー" />
				{/* 修正4: 画像がない時の代替えアイコンを「青背景に白文字」に変更 */}
				<AvatarFallback className="bg-primary text-primary-foreground text-sm">U</AvatarFallback>
			</Avatar>

		</header>
    );
}