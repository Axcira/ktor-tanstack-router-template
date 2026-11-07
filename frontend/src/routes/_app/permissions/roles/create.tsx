import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Shield } from "lucide-react";
import {
  getGetRolesV1QueryKey,
  useCreateRoleV1,
} from "@/api/generated/default/default";
import type { Permission } from "@/api/generated/schemas/permission";
import { ButtonLink } from "@/components/ui/button";
import RoleForm from "./-components/RoleForm";

export const Route = createFileRoute("/_app/permissions/roles/create")({
  component: RoleCreatePage,
});

function RoleCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createRole = useCreateRoleV1();

  const handleSubmit = async (values: {
    name: string;
    description: string;
    permissions: Permission[];
  }) => {
    await createRole.mutateAsync({
      data: {
        name: values.name,
        description: values.description,
        permissions: values.permissions,
      },
    });
    await queryClient.invalidateQueries({
      queryKey: getGetRolesV1QueryKey(),
    });
    await navigate({ to: "/permissions/roles" });
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-6">
      <ButtonLink
        variant="ghost"
        size="sm"
        className="-ml-2 text-muted-foreground hover:text-foreground"
        to="/permissions/roles"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        ロール一覧に戻る
      </ButtonLink>

      <div className="flex items-center gap-3 border-b border-border pb-5">
        <Shield className="h-8 w-8 text-primary" />
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight">新規ロール作成</h1>
          <p className="text-muted-foreground">
            システムに適用されるセキュリティロールとその権限を設定・定義します。
          </p>
        </div>
      </div>

      <div className="border rounded-lg p-6 bg-card shadow-sm">
        <RoleForm
          onSubmit={handleSubmit}
          onCancel={() => navigate({ to: "/permissions/roles" })}
          isSubmitting={createRole.isPending}
          submitLabel="ロールを作成する"
        />
      </div>
    </div>
  );
}
