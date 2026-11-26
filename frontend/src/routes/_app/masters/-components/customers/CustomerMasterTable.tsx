import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  getListCustomersV1QueryKey,
  useCreateCustomerV1,
  useDeleteCustomerV1,
  useListCustomersV1,
  useReorderCustomerV1,
  useUpdateCustomerV1,
} from "@/api/generated/default/default";
import type { CustomerDTO } from "@/api/generated/schemas/customerDTO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { apiErrorMessage } from "../api-error";
import { DeleteMasterDialog } from "../DeleteMasterDialog";
import { MasterListFrame } from "../MasterListFrame";
import { RowActions } from "../RowActions";
import { SortableRow, SortableRows } from "../SortableRows";
import { movedSortKey, sortKeyBeforeFirst } from "../sort-keys";
import { useMasterFilters } from "../useMasterFilters";

type Draft = { code: string; name: string; isActive: boolean };

const emptyDraft = (): Draft => ({ code: "", name: "", isActive: true });

export function CustomerMasterTable() {
  const filters = useMasterFilters();
  const queryClient = useQueryClient();
  const all = useListCustomersV1();
  const filtered = useListCustomersV1(filters.params, {
    query: { enabled: !filters.reorderEnabled },
  });
  const list = filters.reorderEnabled ? all : filtered;
  const items = list.data?.data.items ?? [];
  const createCustomer = useCreateCustomerV1();
  const updateCustomer = useUpdateCustomerV1();
  const deleteCustomer = useDeleteCustomerV1();
  const reorderCustomer = useReorderCustomerV1();
  const [creating, setCreating] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [deleteTarget, setDeleteTarget] = useState<CustomerDTO | null>(null);
  const pending =
    createCustomer.isPending ||
    updateCustomer.isPending ||
    deleteCustomer.isPending ||
    reorderCustomer.isPending;

  async function refresh() {
    await queryClient.invalidateQueries({
      queryKey: getListCustomersV1QueryKey(),
    });
  }

  function requireDraft(value: Draft): Draft | null {
    const code = value.code.trim();
    const name = value.name.trim();
    if (!code || !name) {
      toast.add({ type: "error", title: "コードと名前を入力してください。" });
      return null;
    }
    return { code, name, isActive: value.isActive };
  }

  async function addRow() {
    const next = requireDraft(creating);
    if (!next) return;
    try {
      await createCustomer.mutateAsync({
        data: {
          ...next,
          sortKey: sortKeyBeforeFirst(all.data?.data.items[0]?.sortKey ?? null),
        },
      });
      setCreating(emptyDraft());
      await refresh();
      toast.add({ type: "success", title: "顧客を追加しました" });
    } catch (error) {
      toast.add({
        type: "error",
        title: apiErrorMessage(error, "顧客を追加できませんでした。"),
      });
    }
  }

  async function saveRow(id: number) {
    const next = requireDraft(draft);
    if (!next) return;
    try {
      await updateCustomer.mutateAsync({ id: String(id), data: next });
      setEditingId(null);
      await refresh();
      toast.add({ type: "success", title: "顧客を保存しました" });
    } catch (error) {
      toast.add({
        type: "error",
        title: apiErrorMessage(error, "顧客を保存できませんでした。"),
      });
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteCustomer.mutateAsync({ id: String(deleteTarget.id) });
      if (editingId === deleteTarget.id) setEditingId(null);
      setDeleteTarget(null);
      await refresh();
      toast.add({ type: "success", title: "顧客を削除しました" });
    } catch (error) {
      toast.add({
        type: "error",
        title: apiErrorMessage(error, "顧客を削除できませんでした。"),
      });
    }
  }

  async function reorder(activeId: number, overId: number) {
    const moved = movedSortKey(items, activeId, overId);
    if (!moved) return;
    try {
      await reorderCustomer.mutateAsync({
        id: String(moved.id),
        data: { sortKey: moved.sortKey },
      });
      await refresh();
    } catch (error) {
      toast.add({
        type: "error",
        title: apiErrorMessage(error, "並び順を更新できませんでした。"),
      });
    }
  }

  const dragDisabled = !filters.reorderEnabled || editingId !== null || pending;

  return (
    <MasterListFrame
      filters={filters}
      totalCount={list.data?.data.totalCount ?? 0}
      isLoading={list.isLoading}
      isError={list.isError}
      errorMessage="顧客の読み込みに失敗しました。"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">並び</TableHead>
            <TableHead>コード</TableHead>
            <TableHead>名前</TableHead>
            <TableHead className="w-24">状態</TableHead>
            <TableHead className="w-40 text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell />
            <TableCell>
              <Input
                aria-label="新しい顧客のコード"
                value={creating.code}
                onChange={(event) =>
                  setCreating((current) => ({
                    ...current,
                    code: event.target.value,
                  }))
                }
                disabled={pending}
              />
            </TableCell>
            <TableCell>
              <Input
                aria-label="新しい顧客の名前"
                value={creating.name}
                onChange={(event) =>
                  setCreating((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                disabled={pending}
              />
            </TableCell>
            <TableCell>
              <Switch
                aria-label="新しい顧客を有効にする"
                checked={creating.isActive}
                onCheckedChange={(checked) =>
                  setCreating((current) => ({ ...current, isActive: checked }))
                }
                disabled={pending}
              />
            </TableCell>
            <TableCell className="text-right">
              <Button
                type="button"
                size="sm"
                onClick={addRow}
                disabled={pending}
              >
                追加
              </Button>
            </TableCell>
          </TableRow>
          <SortableRows
            ids={items.map((item) => item.id)}
            disabled={dragDisabled}
            onReorder={reorder}
          >
            {items.map((item) => {
              const editing = editingId === item.id;
              return (
                <SortableRow key={item.id} id={item.id} disabled={dragDisabled}>
                  <TableCell>
                    {editing ? (
                      <Input
                        aria-label="コード"
                        value={draft.code}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            code: event.target.value,
                          }))
                        }
                        disabled={pending}
                      />
                    ) : (
                      item.code
                    )}
                  </TableCell>
                  <TableCell>
                    {editing ? (
                      <Input
                        aria-label="名前"
                        value={draft.name}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        disabled={pending}
                      />
                    ) : (
                      item.name
                    )}
                  </TableCell>
                  <TableCell>
                    {editing ? (
                      <Switch
                        aria-label="有効"
                        checked={draft.isActive}
                        onCheckedChange={(checked) =>
                          setDraft((current) => ({
                            ...current,
                            isActive: checked,
                          }))
                        }
                        disabled={pending}
                      />
                    ) : (
                      <Badge variant={item.isActive ? "default" : "secondary"}>
                        {item.isActive ? "有効" : "無効"}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <RowActions
                      editing={editing}
                      pending={pending}
                      onEdit={() => {
                        setEditingId(item.id);
                        setDraft({
                          code: item.code,
                          name: item.name,
                          isActive: item.isActive,
                        });
                      }}
                      onSave={() => saveRow(item.id)}
                      onCancel={() => setEditingId(null)}
                      onDelete={() => setDeleteTarget(item)}
                    />
                  </TableCell>
                </SortableRow>
              );
            })}
          </SortableRows>
        </TableBody>
      </Table>
      <DeleteMasterDialog
        open={deleteTarget !== null}
        title="顧客を削除しますか？"
        description="この操作は取り消せません。製品から参照されている顧客は削除できません。無効にする場合は編集から状態を切り替えてください。"
        pending={deleteCustomer.isPending}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
      />
    </MasterListFrame>
  );
}
