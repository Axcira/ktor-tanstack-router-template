import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Users } from "lucide-react";
import { ApiError } from "@/api/client";
import {
  getGetUserByIdV1QueryKey,
  getGetUsersV1QueryKey,
  useGetRolesV1,
  useGetUserByIdV1,
  useUpdateUserV1,
} from "@/api/generated/default/default.ts";
import { Button, ButtonLink } from "@/components/ui/button";
import { selfQueryOptions } from "@/lib/self";
import { queryClient as rootQueryClient } from "@/routes/__root";
import ForcePasswordForm from "./-components/ForcePasswordForm";
import UserForm from "./-components/UserForm";

export const Route = createFileRoute("/_app/permissions/users/$userId/edit")({
  component: UserEditPage,
});

function UserEditPage() {
  const { userId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: userResponse,
    isLoading: isLoadingUser,
    isError: isErrorUser,
    error: errorUser,
    refetch: refetchUser,
  } = useGetUserByIdV1(userId);
  const {
    data: rolesResponse,
    isLoading: isLoadingRoles,
    isError: isErrorRoles,
    refetch: refetchRoles,
  } = useGetRolesV1();

  const updateUser = useUpdateUserV1();

  const availableRoles = rolesResponse?.data || [];
  const user = userResponse?.data;
  const isUserNotFound =
    errorUser instanceof ApiError && errorUser.status === 404;

  const handleSubmit = async (values: { email: string; roleId: number }) => {
    if (!user) return;
    await updateUser.mutateAsync({
      id: String(user.id),
      data: {
        email: values.email,
        roleId: values.roleId,
      },
    });
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: getGetUsersV1QueryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: getGetUserByIdV1QueryKey(String(user.id)),
      }),
      queryClient.invalidateQueries({
        queryKey: selfQueryOptions.queryKey,
      }),
      queryClient.invalidateQueries({
        queryKey: ["authorize"],
      }),
      rootQueryClient.invalidateQueries({
        queryKey: selfQueryOptions.queryKey,
      }),
      rootQueryClient.invalidateQueries({
        queryKey: ["authorize"],
      }),
    ]);
    await navigate({ to: "/permissions/users" });
  };

  const isLoading = isLoadingUser || isLoadingRoles;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isUserNotFound) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-destructive">指定されたユーザーが見つかりません。</p>
        <ButtonLink variant="outline" to="/permissions/users">
          ユーザー一覧に戻る
        </ButtonLink>
      </div>
    );
  }

  if (isErrorUser || isErrorRoles) {
    return (
      <div className="space-y-4 p-6 text-center">
        <p className="text-destructive">
          {isErrorUser
            ? "ユーザー情報の取得に失敗しました。"
            : "ロール一覧の取得に失敗しました。"}
        </p>
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              if (isErrorUser) refetchUser().then();
              if (isErrorRoles) refetchRoles().then();
            }}
          >
            再試行
          </Button>
          <ButtonLink variant="ghost" to="/permissions/users">
            ユーザー一覧に戻る
          </ButtonLink>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-destructive">指定されたユーザーが見つかりません。</p>
        <ButtonLink variant="outline" to="/permissions/users">
          ユーザー一覧に戻る
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-6">
      <ButtonLink
        variant="ghost"
        size="sm"
        className="-ml-2 text-muted-foreground hover:text-foreground"
        to="/permissions/users"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        ユーザー一覧に戻る
      </ButtonLink>

      <div className="flex items-center gap-3 border-b border-border pb-5">
        <Users className="h-8 w-8 text-primary" />
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight">
            ユーザー情報の編集
          </h1>
          <p className="text-muted-foreground">
            システム利用ユーザーのアカウント設定および、ロールの割り当てを行います。
          </p>
        </div>
      </div>

      <div className="border rounded-lg p-6 bg-card shadow-sm">
        <UserForm
          editingUser={user}
          availableRoles={availableRoles}
          onSubmit={handleSubmit}
          onCancel={() => navigate({ to: "/permissions/users" })}
          isSubmitting={updateUser.isPending}
          isLoadingRoles={isLoadingRoles}
        />
      </div>

      <div className="border rounded-lg p-6 bg-card shadow-sm">
        <ForcePasswordForm userId={user.id} />
      </div>
    </div>
  );
}
