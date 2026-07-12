import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Shield } from "lucide-react";
import {
  useGetRoleByIdV1,
  useUpdateRoleV1,
} from "@/api/generated/default/default.ts";
import type { Permission } from "@/api/generated/schemas/permission";
import { Button } from "@/components/ui/button";
import { Route } from "@/routes/_app/permissions/roles/$roleId.edit.tsx";
import RoleForm from "./RoleForm";

export default function RoleEditPage() {
  const { roleId } = Route.useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useGetRoleByIdV1(roleId);
  const role = data?.data;

  const updateRole = useUpdateRoleV1();

  const handleSubmit = async (values: {
    name: string;
    description: string;
    permissions: Permission[];
  }) => {
    if (!role) return;
    await updateRole.mutateAsync({
      id: String(role.id),
      data: {
        name: values.name,
        description: values.description,
        permissions: values.permissions,
      },
    });
    await navigate({ to: "/permissions/roles" });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError || !role) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-destructive">ロールの読み込みに失敗しました。</p>
        <Button asChild variant="outline">
          <Link to="/permissions/roles">ロール一覧に戻る</Link>
        </Button>
      </div>
    );
  }

  const initialValues = {
    name: role.name,
    description: role.description,
    permissions: role.permissions,
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-6">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="-ml-2 text-muted-foreground hover:text-foreground"
      >
        <Link to="/permissions/roles">
          <ArrowLeft className="mr-2 h-4 w-4" />
          ロール一覧に戻る
        </Link>
      </Button>

      <div className="flex items-center gap-3 border-b border-border pb-5">
        <Shield className="h-8 w-8 text-primary" />
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight">ロールの編集</h1>
          <p className="text-muted-foreground">
            ロール名、説明文、および適用する権限の詳細を編集します。
          </p>
        </div>
      </div>

      <div className="border rounded-xl p-6 bg-card shadow-sm">
        <RoleForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          onCancel={() => navigate({ to: "/permissions/roles" })}
          isSubmitting={updateRole.isPending}
          submitLabel="更新を保存する"
        />
      </div>
    </div>
  );
}
