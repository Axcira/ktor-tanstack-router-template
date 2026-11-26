import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  getListProductsV1QueryKey,
  useCreateProductV1,
  useDeleteProductV1,
  useListCustomersV1,
  useListProductsV1,
  useReorderProductV1,
  useUpdateProductV1,
} from "@/api/generated/default/default";
import type { ProductDTO } from "@/api/generated/schemas/productDTO";
import { ResponsiveSelect } from "@/components/ResponsiveSelect";
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

type Draft = {
  code: string;
  name: string;
  customerId: string;
  isActive: boolean;
};

const emptyDraft = (): Draft => ({
  code: "",
  name: "",
  customerId: "",
  isActive: true,
});

export function ProductMasterTable() {
  const filters = useMasterFilters();
  const queryClient = useQueryClient();
  const customers = useListCustomersV1();
  const all = useListProductsV1();
  const filtered = useListProductsV1(filters.params, {
    query: { enabled: !filters.reorderEnabled },
  });
  const list = filters.reorderEnabled ? all : filtered;
  const items = list.data?.data.items ?? [];
  const customerOptions = (customers.data?.data.items ?? []).map(
    (customer) => ({
      value: String(customer.id),
      label: `${customer.code} ${customer.name}`,
    }),
  );
  const createProduct = useCreateProductV1();
  const updateProduct = useUpdateProductV1();
  const deleteProduct = useDeleteProductV1();
  const reorderProduct = useReorderProductV1();
  const [creating, setCreating] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [deleteTarget, setDeleteTarget] = useState<ProductDTO | null>(null);
  const pending =
    createProduct.isPending ||
    updateProduct.isPending ||
    deleteProduct.isPending ||
    reorderProduct.isPending;

  function customerLabel(customerId: number) {
    const customer = customers.data?.data.items.find(
      (item) => item.id === customerId,
    );
    return customer
      ? `${customer.code} ${customer.name}`
      : `顧客 #${customerId}`;
  }

  function requireDraft(value: Draft): Draft | null {
    const code = value.code.trim();
    const name = value.name.trim();
    if (!code || !name) {
      toast.add({ type: "error", title: "コードと名前を入力してください。" });
      return null;
    }
    if (!value.customerId) {
      toast.add({ type: "error", title: "顧客を選択してください。" });
      return null;
    }
    return {
      code,
      name,
      customerId: value.customerId,
      isActive: value.isActive,
    };
  }

  async function refresh() {
    await queryClient.invalidateQueries({
      queryKey: getListProductsV1QueryKey(),
    });
  }

  async function addRow() {
    const next = requireDraft(creating);
    if (!next) return;
    try {
      await createProduct.mutateAsync({
        data: {
          code: next.code,
          name: next.name,
          customerId: Number(next.customerId),
          isActive: next.isActive,
          sortKey: sortKeyBeforeFirst(all.data?.data.items[0]?.sortKey ?? null),
        },
      });
      setCreating(emptyDraft());
      await refresh();
      toast.add({ type: "success", title: "製品を追加しました" });
    } catch (error) {
      toast.add({
        type: "error",
        title: apiErrorMessage(error, "製品を追加できませんでした。"),
      });
    }
  }

  async function saveRow(id: number) {
    const next = requireDraft(draft);
    if (!next) return;
    try {
      await updateProduct.mutateAsync({
        id: String(id),
        data: {
          code: next.code,
          name: next.name,
          customerId: Number(next.customerId),
          isActive: next.isActive,
        },
      });
      setEditingId(null);
      await refresh();
      toast.add({ type: "success", title: "製品を保存しました" });
    } catch (error) {
      toast.add({
        type: "error",
        title: apiErrorMessage(error, "製品を保存できませんでした。"),
      });
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteProduct.mutateAsync({ id: String(deleteTarget.id) });
      if (editingId === deleteTarget.id) setEditingId(null);
      setDeleteTarget(null);
      await refresh();
      toast.add({ type: "success", title: "製品を削除しました" });
    } catch (error) {
      toast.add({
        type: "error",
        title: apiErrorMessage(error, "製品を削除できませんでした。"),
      });
    }
  }

  async function reorder(activeId: number, overId: number) {
    const moved = movedSortKey(items, activeId, overId);
    if (!moved) return;
    try {
      await reorderProduct.mutateAsync({
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
      isLoading={list.isLoading || customers.isLoading}
      isError={list.isError || customers.isError}
      errorMessage="製品の読み込みに失敗しました。"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">並び</TableHead>
            <TableHead>コード</TableHead>
            <TableHead>名前</TableHead>
            <TableHead>顧客</TableHead>
            <TableHead className="w-24">状態</TableHead>
            <TableHead className="w-40 text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell />
            <TableCell>
              <Input
                aria-label="新しい製品のコード"
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
                aria-label="新しい製品の名前"
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
              <ResponsiveSelect
                aria-label="新しい製品の顧客"
                value={creating.customerId}
                onValueChange={(value) =>
                  setCreating((current) => ({
                    ...current,
                    customerId: value ?? "",
                  }))
                }
                options={customerOptions}
                placeholder="顧客"
                disabled={pending}
              />
            </TableCell>
            <TableCell>
              <Switch
                aria-label="新しい製品を有効にする"
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
                      <ResponsiveSelect
                        aria-label="顧客"
                        value={draft.customerId}
                        onValueChange={(value) =>
                          setDraft((current) => ({
                            ...current,
                            customerId: value ?? "",
                          }))
                        }
                        options={customerOptions}
                        placeholder="顧客"
                        disabled={pending}
                      />
                    ) : (
                      customerLabel(item.customerId)
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
                          customerId: String(item.customerId),
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
        title="製品を削除しますか？"
        description="この操作は取り消せません。無効にする場合は編集から状態を切り替えてください。"
        pending={deleteProduct.isPending}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
      />
    </MasterListFrame>
  );
}
