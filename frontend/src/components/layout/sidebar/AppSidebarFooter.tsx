import { SidebarFooter } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useRouter, useNavigate } from "@tanstack/react-router"

import { useLogout } from "@/api/generated/default/default"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
    AlertDialogPortal,
    AlertDialogOverlay,
} from "@/components/ui/alert-dialog"

export default function AppSidebarFooter() {
    const router = useRouter()
    const navigate = useNavigate()

    const logoutMutation = useLogout({
        mutation: {
            onSuccess: async () => {
                console.log("サーバー側のログアウトに成功しました")
                await router.invalidate()
                navigate({ to: "/hero" })
            },
            onError: (error) => {
                console.error("ログアウト処理でエラーが発生しました:", error)
            }
        }
    })

    return (
        <SidebarFooter className="p-4 border-t border-sidebar-border group-data-[state=collapsed]:p-2 group-data-[state=collapsed]:flex group-data-[state=collapsed]:justify-center">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-destructive hover:bg-sidebar-accent hover:text-destructive group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:w-10 group-data-[state=collapsed]:h-10 group-data-[state=collapsed]:p-0"
                        disabled={logoutMutation.isPending}
                    >
                        <LogOut className="h-4 w-4 group-data-[state=collapsed]:mr-0 mr-2 shrink-0" />
                        <span className="group-data-[state=collapsed]:hidden">
                            {logoutMutation.isPending ? "ログアウト中..." : "ログアウト"}
                        </span>
                    </Button>
                </AlertDialogTrigger>

                <AlertDialogPortal>
                    <AlertDialogOverlay className="fixed inset-0 z-50 bg-black/5 backdrop-blur-sm" />
                    <AlertDialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg -translate-x-[50%] -translate-y-[50%] gap-4 border bg-background p-6 shadow-lg sm:rounded-lg duration-100 data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:zoom-out-95">
                        <AlertDialogHeader>
                            <AlertDialogTitle>ログアウトしますか？</AlertDialogTitle>
                            <AlertDialogDescription>
                                ログアウトすると、再度ログインするまで一部の機能が利用できなくなります。
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>キャンセル</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => logoutMutation.mutate()}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                ログアウト
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogPortal>
            </AlertDialog>
        </SidebarFooter>
    )
}