import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Shield } from "lucide-react";
import { useCreateRoleV1 } from "@/api/generated/default/default.ts";
import { Button } from "@/components/ui/button";
import RoleForm from "./RoleForm";
import type { Permission } from "@/api/generated/schemas/permission";

export default function RoleCreatePage() {
  const navigate = useNavigate();
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
    await navigate({ to: "/permissions/roles" });
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
          <h1 className="text-2xl font-bold tracking-tight">新規ロール作成</h1>
          <p className="text-muted-foreground">
            システムに適用されるセキュリティロールとその権限を設定・定義します。
          </p>
        </div>
      </div>

      <div className="border rounded-xl p-6 bg-card shadow-sm">
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
