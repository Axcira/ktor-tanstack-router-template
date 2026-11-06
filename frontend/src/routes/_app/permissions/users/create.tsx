import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Users } from "lucide-react";
import {
  getGetUsersV1QueryKey,
  useCreateUserV1,
  useGetRolesV1,
} from "@/api/generated/default/default.ts";
import { Button, ButtonLink } from "@/components/ui/button";
import UserForm from "./-components/UserForm";

export const Route = createFileRoute("/_app/permissions/users/create")({
  component: UserCreatePage,
});

function UserCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createUser = useCreateUserV1();

  const {
    data: rolesResponse,
    isLoading: isLoadingRoles,
    isError: isErrorRoles,
    refetch: refetchRoles,
  } = useGetRolesV1();

  const availableRoles = rolesResponse?.data || [];

  const handleSubmit = async (values: {
    email: string;
    password?: string;
    roleId: number;
  }) => {
    await createUser.mutateAsync({
      data: {
        email: values.email,
        password: values.password || "",
        roleId: values.roleId,
      },
    });
    await queryClient.invalidateQueries({
      queryKey: getGetUsersV1QueryKey(),
    });
    await navigate({ to: "/permissions/users" });
  };

  if (isLoadingRoles) {
    return (
      <div className="flex justify-center items-center py-20 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isErrorRoles) {
    return (
      <div className="space-y-4 p-6 text-center">
        <p className="text-destructive">ロール一覧の取得に失敗しました。</p>
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={() => refetchRoles()}>
            再試行
          </Button>
          <ButtonLink variant="ghost" to="/permissions/users">
            ユーザー一覧に戻る
          </ButtonLink>
        </div>
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
            新規ユーザー登録
          </h1>
          <p className="text-muted-foreground">
            システム利用ユーザーのアカウント設定および、ロールの割り当てを行います。
          </p>
        </div>
      </div>

      <div className="border rounded-lg p-6 bg-card shadow-sm">
        <UserForm
          availableRoles={availableRoles}
          onSubmit={handleSubmit}
          onCancel={() => navigate({ to: "/permissions/users" })}
          isSubmitting={createUser.isPending}
          isLoadingRoles={isLoadingRoles}
        />
      </div>
    </div>
  );
}
