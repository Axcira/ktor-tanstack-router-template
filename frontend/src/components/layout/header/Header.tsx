import { Menu, Shield, Key, Mail, ShieldAlert, Check } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar.tsx";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Route } from "@/routes/_app";
import { useGetRoles } from "@/api/generated/default/default";
import { PERMISSION_UI_DEFS } from "@/lib/permissions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AppHeader() {
  const { toggleSidebar } = useSidebar();
  const { session } = Route.useRouteContext();
  const { data: rolesResponse, isLoading: isLoadingRoles } = useGetRoles();

  const userEmail = session?.user?.email || "User";
  const fallbackChar = userEmail[0].toUpperCase();

  const roles = rolesResponse?.data || [];
  const userRole = roles.find((role) => role.id === session?.user?.roleId);
  const roleName = isLoadingRoles ? "読み込み中..." : (userRole?.name || "ゲスト");

  const isAdministrator = session?.permissions?.some(
    (p) => p.type === "Administrator"
  ) ?? false;

  return (
    <header className="w-full h-17 bg-background text-foreground border-b border-border flex items-center justify-between px-6">
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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="h-10 w-10 cursor-pointer ring-2 ring-primary/20 hover:ring-primary/50 transition-all select-none">
            <AvatarImage src="" alt={userEmail} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
              {fallbackChar}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 p-3 rounded-2xl bg-card border shadow-xl">
          <div className="flex flex-col space-y-2.5 p-2">
            <div className="flex items-center space-x-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Mail className="h-4 w-4" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">メールアドレス</p>
                <p className="text-sm font-bold text-foreground truncate">{userEmail}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
                <Shield className="h-4 w-4" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">ロール (役割)</p>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center rounded-md bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:text-indigo-400 border border-indigo-200/50">
                    {roleName}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <DropdownMenuSeparator className="my-2" />
          
          <div className="space-y-2 p-2">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5" />
              付与されている権限一覧
            </div>
            
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1.5">
              {isAdministrator ? (
                <div className="p-2.5 rounded-xl border border-violet-200/60 bg-gradient-to-r from-violet-500/5 to-purple-500/5 dark:border-violet-900/40">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-violet-700 dark:text-violet-400">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    全権限アクセス許可
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    管理者権限が有効です。すべての機能に対してアクセスおよび編集が可能です。
                  </p>
                </div>
              ) : !session?.permissions || session.permissions.length === 0 ? (
                <div className="p-2.5 rounded-xl border border-border/85 bg-muted/30 text-center">
                  <p className="text-xs text-muted-foreground italic">
                    権限はありません（読み取り専用）
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {session.permissions.map((p, idx) => {
                    const def = PERMISSION_UI_DEFS[p.type];
                    const propsStr = Object.entries(p)
                      .filter(([key]) => key !== "type")
                      .map(([key, val]) => `${key}: ${val}`)
                      .join(", ");
                    
                    return (
                      <div 
                        key={`${p.type}-${idx}`}
                        className="p-2 rounded-xl border border-primary/10 bg-primary/5 dark:bg-primary/5 hover:bg-primary/10 transition-all flex flex-col gap-0.5"
                      >
                        <div className="flex items-center gap-1 text-xs font-bold text-primary">
                          <Check className="h-3 w-3 shrink-0" />
                          {def?.label || p.type}
                        </div>
                        {def?.description && (
                          <p className="text-[10px] text-muted-foreground leading-relaxed">
                            {def.description}
                          </p>
                        )}
                        {propsStr && (
                          <span className="text-[9px] font-mono text-muted-foreground/80 bg-background px-1.5 py-0.5 rounded border border-border/45 mt-1 self-start">
                            {propsStr}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
