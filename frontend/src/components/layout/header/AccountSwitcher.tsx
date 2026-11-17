import { Check, LogOut, UserPlus } from "lucide-react";
import type { AccountSummary } from "@/api/generated/schemas/accountSummary";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { activeAccountIndex } from "@/lib/account-dialog";

export { activeAccountIndex };

export type LogoutDialogState = {
  account: AccountSummary | null;
  open: boolean;
};

export function nextLogoutDialogState(
  state: LogoutDialogState,
  event:
    | { type: "request"; account: AccountSummary }
    | { type: "open"; open: boolean }
    | { type: "closed" },
): LogoutDialogState {
  if (event.type === "request") return { account: event.account, open: true };
  if (event.type === "open") return { ...state, open: event.open };
  return { account: null, open: false };
}

export function AccountSwitcherList({
  accounts,
  activeIndex,
  onSwitch,
  onReauth,
  onAddAccount,
  onLogoutRequest,
  onSignOutAllRequest,
}: {
  accounts: AccountSummary[];
  activeIndex: number | undefined;
  onSwitch: (index: number) => void;
  onReauth: (account: AccountSummary) => void;
  onAddAccount: () => void;
  onLogoutRequest: (index: number) => void;
  onSignOutAllRequest: () => void;
}) {
  return (
    <div className="space-y-1 p-2">
      <p className="px-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
        アカウント
      </p>
      <ul className="space-y-1">
        {accounts.map((account) => {
          const active = account.index === activeIndex;
          const reauth = account.requiresReauth;
          const initial = (account.displayName || account.email)
            .slice(0, 1)
            .toUpperCase();
          return (
            <li key={account.index} className="flex items-center gap-1">
              <button
                type="button"
                aria-current={active ? "true" : undefined}
                aria-label={
                  reauth
                    ? `${account.displayName}（${account.email}）。再ログインが必要`
                    : undefined
                }
                title={reauth ? "再ログインが必要" : undefined}
                className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted"
                onClick={() => {
                  if (reauth) {
                    onReauth(account);
                    return;
                  }
                  if (!active) onSwitch(account.index);
                }}
              >
                <span className="relative shrink-0">
                  <span
                    className={
                      reauth
                        ? "flex size-8 items-center justify-center rounded-full bg-warning text-xs font-semibold text-warning-foreground"
                        : "flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
                    }
                  >
                    {initial}
                  </span>
                  {reauth ? (
                    <span className="absolute -right-0.5 -bottom-0.5 flex size-3.5 items-center justify-center rounded-full bg-warning text-[10px] font-bold leading-none text-warning-foreground ring-2 ring-card">
                      !
                    </span>
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={
                      reauth
                        ? "block truncate text-sm font-semibold text-warning"
                        : "block truncate text-sm font-semibold"
                    }
                  >
                    {account.displayName}
                  </span>
                  <span
                    className={
                      reauth
                        ? "block truncate text-xs text-warning"
                        : "block truncate text-xs text-muted-foreground"
                    }
                  >
                    {account.email}
                  </span>
                </span>
                {active ? (
                  <Check
                    className="size-4 shrink-0 text-primary"
                    aria-label="使用中"
                  />
                ) : null}
              </button>
              {active ? null : (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`${account.email} からログアウト`}
                  onClick={() => onLogoutRequest(account.index)}
                >
                  <LogOut />
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      <Button
        type="button"
        variant="ghost"
        className="w-full justify-start"
        onClick={onAddAccount}
      >
        <UserPlus />
        アカウントを追加
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="w-full justify-start text-destructive hover:text-destructive"
        onClick={onSignOutAllRequest}
      >
        <LogOut />
        全てのアカウントからログアウト
      </Button>
    </div>
  );
}

export function AccountLogoutDialog({
  account,
  open,
  pending,
  onOpenChange,
  onOpenChangeComplete,
  onConfirm,
}: {
  account: AccountSummary | null;
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenChangeComplete?: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={onOpenChangeComplete}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            このアカウントからログアウトしますか？
          </AlertDialogTitle>
          <AlertDialogDescription>
            {account
              ? `${account.email} だけサインアウトします。他のアカウントはそのままです。`
              : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            ログアウト
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function SignOutAllDialog({
  open,
  pending,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            全てのアカウントからログアウトしますか？
          </AlertDialogTitle>
          <AlertDialogDescription>
            このブラウザにサインインしているすべてのアカウントからログアウトします。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            全てのアカウントからログアウト
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
