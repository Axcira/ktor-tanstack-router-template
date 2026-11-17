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
import { Button, ButtonLink } from "@/components/ui/button";

export function activeAccountIndex(
  authuser: number | undefined,
  accounts: AccountSummary[],
): number | undefined {
  if (
    authuser !== undefined &&
    accounts.some((account) => account.index === authuser)
  ) {
    return authuser;
  }
  return accounts.find((account) => account.isDefault)?.index;
}

export function AccountSwitcherList({
  accounts,
  activeIndex,
  onSwitch,
  onLogoutRequest,
}: {
  accounts: AccountSummary[];
  activeIndex: number | undefined;
  onSwitch: (index: number) => void;
  onLogoutRequest: (index: number) => void;
}) {
  return (
    <div className="space-y-1 p-2">
      <p className="px-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
        アカウント
      </p>
      <ul className="space-y-1">
        {accounts.map((account) => {
          const active = account.index === activeIndex;
          return (
            <li key={account.index} className="flex items-center gap-1">
              <button
                type="button"
                aria-current={active ? "true" : undefined}
                className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted"
                onClick={() => {
                  if (!active) onSwitch(account.index);
                }}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {(account.displayName || account.email)
                    .slice(0, 1)
                    .toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {account.displayName}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
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
      <ButtonLink
        to="/login"
        search={{ addAccount: true }}
        variant="ghost"
        className="w-full justify-start"
      >
        <UserPlus />
        アカウントを追加
      </ButtonLink>
    </div>
  );
}

export function AccountLogoutDialog({
  account,
  pending,
  onOpenChange,
  onConfirm,
}: {
  account: AccountSummary | null;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={account !== null} onOpenChange={onOpenChange}>
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
