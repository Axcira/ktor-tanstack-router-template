import { useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
import { useListAccountsV1 } from "@/api/generated/default/default";
import { AccountAuthDialog } from "@/components/AccountAuthDialog";
import {
  activeAccountIndex,
  closeAccountDialog,
  fallbackAccountIndex,
  reauthAccountFromUrl,
  rememberUsableAccount,
  useAccountDialog,
} from "@/lib/account-dialog";

import { accountNavigation, accountSwitchUrl } from "@/lib/authuser";

export function AccountDialogHost() {
  const { authuser } = useSearch({ from: "__root__" });
  const accountsQuery = useListAccountsV1({ query: { retry: false } });
  const accounts = accountsQuery.data?.data ?? [];
  const requested = useAccountDialog();
  const urlAccount = reauthAccountFromUrl(authuser, accounts);
  const mode = requested?.mode ?? (urlAccount ? "reauth" : null);
  const email =
    requested?.mode === "reauth"
      ? requested.email
      : mode === "reauth"
        ? (urlAccount?.email ?? "")
        : "";

  useEffect(() => {
    if (urlAccount) return;
    const active = activeAccountIndex(authuser, accounts);
    if (active === undefined) return;
    const account = accounts.find((item) => item.index === active);
    if (account && !account.requiresReauth) {
      rememberUsableAccount(account.index);
    }
  }, [accounts, authuser, urlAccount]);

  const finish = (accountIndex: number) => {
    closeAccountDialog();
    accountNavigation.assign(
      accountSwitchUrl(accountNavigation.href(), accountIndex),
    );
  };

  const cancel = () => {
    closeAccountDialog();
    if (!urlAccount) return;
    const target = fallbackAccountIndex(accounts, urlAccount.index);
    accountNavigation.assign(
      target === undefined
        ? "/login"
        : accountSwitchUrl(accountNavigation.href(), target),
    );
  };

  return (
    <AccountAuthDialog
      open={mode !== null}
      mode={mode ?? "add"}
      email={email}
      onOpenChange={(open) => {
        if (open) return;
        if (requested?.mode === "add") {
          closeAccountDialog();
          return;
        }
        cancel();
      }}
      onSuccess={finish}
    />
  );
}
