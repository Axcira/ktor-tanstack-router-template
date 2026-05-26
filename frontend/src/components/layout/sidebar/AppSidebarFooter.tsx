import { SidebarFooter } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useRouter, useNavigate } from "@tanstack/react-router"

import { useLogout } from "@/api/generated/default/default"

// （※ご自身の環境の認証状態クリア処理があればインポートしてください）
// import { useAuth } from "@/hooks/useAuth"

export default function AppSidebarFooter() {
    const router = useRouter()
    const navigate = useNavigate()
    // const { clearAuth } = useAuth()

    const logoutMutation = useLogout({
        mutation: {
            onSuccess: async () => {
                console.log("サーバー側のログアウトに成功しました")

                // フロントエンドの認証状態をクリアする（必要であれば）
                // clearAuth()

                await router.invalidate()

                navigate({ to: "/hero" })
            },
            onError: (error) => {
                console.error("ログアウト処理でエラーが発生しました:", error)
            }
        }
    })

    return (
        <SidebarFooter className="p-4 border-t border-sidebar-border">
            <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:bg-sidebar-accent hover:text-destructive"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
            >
                <LogOut className="mr-2 h-4 w-4" />
                {logoutMutation.isPending ? "ログアウト中..." : "ログアウト"}
            </Button>
        </SidebarFooter>
    )
}