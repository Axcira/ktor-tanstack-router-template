import { useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  const [open, setOpen] = useState(mode !== null);

  useEffect(() => {
    if (mode !== null) setOpen(true);
  }, [mode]);

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
    setOpen(false);
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

  const handleCloseComplete = () => {
    if (requested?.mode === "add") {
      closeAccountDialog();
      return;
    }
    cancel();
  };

  if (mode === null && !open) return null;

  return (
    <AccountAuthDialog
      open={open}
      mode={mode ?? "add"}
      email={email}
      onOpenChange={(next) => {
        if (next) {
          setOpen(true);
          return;
        }
        setOpen(false);
      }}
      onOpenChangeComplete={(next) => {
        if (next) return;
        handleCloseComplete();
      }}
      onSuccess={finish}
    />
  );
}
