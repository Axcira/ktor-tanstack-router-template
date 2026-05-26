{/* shadcn/ui 部品 */}
import {Sidebar} from "@/components/ui/sidebar"

{/* UIコンポーネント */}
import AppSidebarHeader from "./AppSidebarHeader"
import AppSidebarContent from "./AppSidebarContent"
import AppSidebarFooter from "./AppSidebarFooter"

export function AppSidebar() {
    return (
        <Sidebar>
            {/* サイドバーのヘッダー部分（ロゴなど） */}
            <AppSidebarHeader />

            {/* メインのメニュー部分 */}
            <AppSidebarContent />

            {/* サイドバーのフッター部分（ユーザー情報） */}
            <AppSidebarFooter />
        </Sidebar>
    )
}