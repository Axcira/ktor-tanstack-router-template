import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  getListTagsV1QueryKey,
  useCreateTagV1,
  useDeleteTagV1,
  useListTagsV1,
  useReorderTagV1,
  useUpdateTagV1,
} from "@/api/generated/default/default";
import type { TagMasterDTO } from "@/api/generated/schemas/tagMasterDTO";
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
import { useSaveLock } from "../useSaveLock";

type Draft = { name: string; isActive: boolean };

const emptyDraft = (): Draft => ({ name: "", isActive: true });

export function TagMasterTable() {
  const filters = useMasterFilters();
  const queryClient = useQueryClient();
  const all = useListTagsV1();
  const filtered = useListTagsV1(filters.params, {
    query: { enabled: !filters.reorderEnabled },
  });
  const list = filters.reorderEnabled ? all : filtered;
  const items = list.data?.data.items ?? [];
  const createTag = useCreateTagV1();
  const updateTag = useUpdateTagV1();
  const deleteTag = useDeleteTagV1();
  const reorderTag = useReorderTagV1();
  const [creating, setCreating] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [deleteTarget, setDeleteTarget] = useState<TagMasterDTO | null>(null);
  const saveLock = useSaveLock();
  const pending =
    saveLock.locked ||
    createTag.isPending ||
    updateTag.isPending ||
    deleteTag.isPending ||
    reorderTag.isPending;

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: getListTagsV1QueryKey() });
  }

  async function addRow() {
    await saveLock.runLocked(async () => {
      const name = creating.name.trim();
      if (!name) {
        toast.add({ type: "error", title: "名前を入力してください。" });
        return;
      }
      try {
        await createTag.mutateAsync({
          data: {
            name,
            isActive: creating.isActive,
            sortKey: sortKeyBeforeFirst(
              all.data?.data.items[0]?.sortKey ?? null,
            ),
          },
        });
        setCreating(emptyDraft());
        await refresh();
        toast.add({ type: "success", title: "タグを追加しました" });
      } catch (error) {
        toast.add({
          type: "error",
          title: apiErrorMessage(error, "タグを追加できませんでした。"),
        });
      }
    });
  }

  async function saveRow(id: number) {
    await saveLock.runLocked(async () => {
      const name = draft.name.trim();
      if (!name) {
        toast.add({ type: "error", title: "名前を入力してください。" });
        return;
      }
      try {
        await updateTag.mutateAsync({
          id: String(id),
          data: { name, isActive: draft.isActive },
        });
        setEditingId(null);
        await refresh();
        toast.add({ type: "success", title: "タグを保存しました" });
      } catch (error) {
        toast.add({
          type: "error",
          title: apiErrorMessage(error, "タグを保存できませんでした。"),
        });
      }
    });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    await saveLock.runLocked(async () => {
      try {
        await deleteTag.mutateAsync({ id: String(target.id) });
        if (editingId === target.id) setEditingId(null);
        setDeleteTarget(null);
        await refresh();
        toast.add({ type: "success", title: "タグを削除しました" });
      } catch (error) {
        toast.add({
          type: "error",
          title: apiErrorMessage(error, "タグを削除できませんでした。"),
        });
      }
    });
  }

  async function reorder(activeId: number, overId: number) {
    await saveLock.runLocked(async () => {
      const moved = movedSortKey(items, activeId, overId);
      if (!moved) return;
      try {
        await reorderTag.mutateAsync({
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
    });
  }

  return (
    <MasterListFrame
      filters={filters}
      totalCount={list.data?.data.totalCount ?? 0}
      isLoading={list.isLoading}
      isError={list.isError}
      errorMessage="タグの読み込みに失敗しました。"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">並び</TableHead>
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
                aria-label="新しいタグの名前"
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
                aria-label="新しいタグを有効にする"
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
            disabled={!filters.reorderEnabled || editingId !== null || pending}
            onReorder={reorder}
          >
            {items.map((item) => {
              const editing = editingId === item.id;
              return (
                <SortableRow
                  key={item.id}
                  id={item.id}
                  disabled={
                    !filters.reorderEnabled || editingId !== null || pending
                  }
                >
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
                        setDraft({ name: item.name, isActive: item.isActive });
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
        title="タグを削除しますか？"
        description="この操作は取り消せません。記事で使われているタグは削除できません。無効にする場合は編集から状態を切り替えてください。"
        pending={deleteTag.isPending}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
      />
    </MasterListFrame>
  );
}
