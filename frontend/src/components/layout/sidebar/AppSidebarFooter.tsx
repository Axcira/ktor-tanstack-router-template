import {
  useNavigate,
  useRouter,
} from "@tanstack/react-router"
import { LogOut } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  SidebarFooter,
  SidebarMenuButton,
  useSidebar,

} from "@/components/ui/sidebar"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip.tsx";
import { useLogoutV1 } from "@/api/generated/default/default.ts";

export default function AppSidebarFooter() {
  const router = useRouter()
  const navigate = useNavigate()
  const {state} = useSidebar()


  const logoutMutation = useLogoutV1({
    mutation: {
      onSuccess: async () => {
        console.log("サーバー側のログアウトに成功しました")
        await router.invalidate()
        await navigate({to: "/hero"})
      }, onError: (error) => {
        console.error("ログアウト処理でエラーが発生しました:", error)
      },
    },
  })
    const logOutLabel = logoutMutation.isPending ? "ログアウト中..." : "ログアウト"

  const _sidebarMenuButton = <SidebarMenuButton
      className="w-full justify-start text-destructive hover:bg-sidebar-accent hover:text-destructive group-data-[state=collapsed]:w-10 group-data-[state=collapsed]:h-10 group-data-[state=collapsed]:p-0"
      disabled={logoutMutation.isPending}
    >
      <LogOut className="h-4 w-4 mr-2 shrink-0 group-data-[state=collapsed]:mr-0" />
      <span className="group-data-[state=collapsed]:hidden">
                {logOutLabel}
              </span>
    </SidebarMenuButton>
  const _alertDialogPortal =       <AlertDialogPortal>
    <AlertDialogOverlay className="fixed inset-0 z-50 bg-black/5 backdrop-blur-sm"/>
    <AlertDialogContent
      className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg sm:rounded-lg duration-100 data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:zoom-out-95">
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


  if (state === "collapsed") {
    return (<SidebarFooter
      className="border-t border-sidebar-border p-2 group-data-[state=collapsed]:flex group-data-[state=collapsed]:justify-center">
      <AlertDialog>
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertDialogTrigger asChild>
              {_sidebarMenuButton}
            </AlertDialogTrigger>
          </TooltipTrigger>

          <TooltipContent side="right">
            {logOutLabel}
          </TooltipContent>
        </Tooltip>
        {_alertDialogPortal}
      </AlertDialog>
    </SidebarFooter>)
  } else {
    return (<SidebarFooter
      className="border-t border-sidebar-border p-2 group-data-[state=collapsed]:flex group-data-[state=collapsed]:justify-center">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          {_sidebarMenuButton}
        </AlertDialogTrigger>
        {_alertDialogPortal}
      </AlertDialog>

    </SidebarFooter>)
  }
}
