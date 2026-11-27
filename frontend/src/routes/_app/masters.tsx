import { createFileRoute, Outlet } from "@tanstack/react-router";
import { MasterTabs } from "./masters/-components/MasterTabs";

export const Route = createFileRoute("/_app/masters")({
  component: MastersLayout,
});

function MastersLayout() {
  return (
    <div className="container mx-auto p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">マスタ</h1>
        <p className="text-sm text-muted-foreground">
          行の中で追加・編集します。ドラッグで並べ替え、参照中の行は削除せず無効にします。
        </p>
      </div>
      <MasterTabs />
      <Outlet />
    </div>
  );
}
