import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Users, Loader2 } from "lucide-react";
import {
  useGetApiUsers,
  useGetApiRoles,
  usePatchApiUsersUpdateId,
} from "@/api/generated/default/default.ts";
import { Button } from "@/components/ui/button";
import { Route } from "@/routes/_app/permissions/users/$userId.edit.tsx";
import UserForm from "./UserForm";

export default function UserEditPage() {
  const { userId } = Route.useParams();
  const navigate = useNavigate();

  const { data: usersResponse, isLoading: isLoadingUsers, isError: isErrorUsers } = useGetApiUsers();
  const { data: rolesResponse, isLoading: isLoadingRoles } = useGetApiRoles();

  const updateUser = usePatchApiUsersUpdateId();

  const availableRoles = rolesResponse?.data || [];
  const user = usersResponse?.data?.find((u) => String(u.id) === userId);

  const handleSubmit = async (values: {
    email: string;
    roleId: number;
  }) => {
    if (!user) return;
    await updateUser.mutateAsync({
      id: String(user.id),
      data: {
        email: values.email,
        roleId: values.roleId,
      },
    });
    await navigate({ to: "/permissions/users" });
  };

  const isLoading = isLoadingUsers || isLoadingRoles;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isErrorUsers || !user) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-destructive">ユーザーの読み込みに失敗しました。</p>
        <Button asChild variant="outline">
          <Link to="/permissions/users">ユーザー一覧に戻る</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-6">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="-ml-2 text-muted-foreground hover:text-foreground"
      >
        <Link to="/permissions/users">
          <ArrowLeft className="mr-2 h-4 w-4" />
          ユーザー一覧に戻る
        </Link>
      </Button>

      <div className="flex items-center gap-3 border-b border-border pb-5">
        <Users className="h-8 w-8 text-primary" />
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight">ユーザー情報の編集</h1>
          <p className="text-muted-foreground">
            システム利用ユーザーのアカウント設定および、ロールの割り当てを行います。
          </p>
        </div>
      </div>

      <div className="border rounded-xl p-6 bg-card shadow-sm">
        <UserForm
          editingUser={user}
          availableRoles={availableRoles}
          onSubmit={handleSubmit}
          onCancel={() => navigate({ to: "/permissions/users" })}
          isSubmitting={updateUser.isPending}
          isLoadingRoles={isLoadingRoles}
        />
      </div>
    </div>
  );
}
