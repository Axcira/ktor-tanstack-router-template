import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  FileText,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_app/showcase/detail")({
  component: DetailPage,
});

interface LineItem {
  id: number;
  product: string;
  quantity: number;
  unitPrice: number;
}

type ViewState = "loaded" | "loading" | "error";

// Placeholder slots have no entity IDs; use fixed keys instead of array indexes.
const DETAIL_FORM_SKELETON_KEYS = [
  "detail-form-sk-0",
  "detail-form-sk-1",
  "detail-form-sk-2",
  "detail-form-sk-3",
] as const;
const DETAIL_SIDEBAR_SKELETON_KEYS = [
  "detail-sidebar-sk-0",
  "detail-sidebar-sk-1",
  "detail-sidebar-sk-2",
] as const;

const activityLogs = [
  {
    id: "log-status-in-progress",
    action: "ステータスを「進行中」に変更",
    user: "田中太郎",
    date: "2026-06-28",
  },
  {
    id: "log-items-updated",
    action: "明細を更新",
    user: "佐藤花子",
    date: "2026-06-25",
  },
  {
    id: "log-created",
    action: "案件を作成",
    user: "田中太郎",
    date: "2026-04-01",
  },
] as const;

function DetailPage() {
  const [viewState, setViewState] = useState<ViewState>("loaded");
  const [title, setTitle] = useState("Webシステム刷新プロジェクト");
  const [client, setClient] = useState("株式会社テクノ");
  const [status, setStatus] = useState("in_progress");
  const [assignee, setAssignee] = useState("田中太郎");
  const [startDate, setStartDate] = useState("2026-04-01");
  const [endDate, setEndDate] = useState("2026-09-30");
  const [notes, setNotes] = useState(
    "既存のレガシーシステムをモダンなWebアプリケーションに移行するプロジェクト。\nフェーズ1: 要件定義・設計\nフェーズ2: 開発・テスト\nフェーズ3: 移行・運用開始",
  );
  const [saving, setSaving] = useState(false);

  const [items, setItems] = useState<LineItem[]>([
    { id: 1, product: "要件定義", quantity: 1, unitPrice: 2000000 },
    { id: 2, product: "UI/UXデザイン", quantity: 1, unitPrice: 1500000 },
    { id: 3, product: "フロントエンド開発", quantity: 3, unitPrice: 800000 },
    { id: 4, product: "バックエンド開発", quantity: 2, unitPrice: 900000 },
    { id: 5, product: "テスト・QA", quantity: 1, unitPrice: 600000 },
  ]);

  const total = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("案件情報を保存しました");
    }, 1000);
  };

  const addItem = () => {
    const newId = Math.max(0, ...items.map((i) => i.id)) + 1;
    setItems([...items, { id: newId, product: "", quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (id: number) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const updateItem = (
    id: number,
    field: keyof LineItem,
    value: string | number,
  ) => {
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  if (viewState === "loading") {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <div className="flex gap-1 border rounded-md p-0.5">
            {(["loaded", "loading", "error"] as const).map((s) => (
              <Button
                key={s}
                variant={viewState === s ? "secondary" : "ghost"}
                size="xs"
                onClick={() => setViewState(s)}
              >
                {s === "loaded"
                  ? "通常"
                  : s === "loading"
                    ? "読込中"
                    : "エラー"}
              </Button>
            ))}
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-6 space-y-4">
                {DETAIL_FORM_SKELETON_KEYS.map((key) => (
                  <div key={key} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardContent className="p-6 space-y-4">
              {DETAIL_SIDEBAR_SKELETON_KEYS.map((key) => (
                <div key={key} className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (viewState === "error") {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">案件詳細</h1>
          <div className="flex gap-1 border rounded-md p-0.5">
            {(["loaded", "loading", "error"] as const).map((s) => (
              <Button
                key={s}
                variant={viewState === s ? "secondary" : "ghost"}
                size="xs"
                onClick={() => setViewState(s)}
              >
                {s === "loaded"
                  ? "通常"
                  : s === "loading"
                    ? "読込中"
                    : "エラー"}
              </Button>
            ))}
          </div>
        </div>
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="size-12 text-destructive mb-3" />
            <p className="font-medium text-destructive">
              案件データの取得に失敗しました
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              指定された案件が存在しないか、アクセス権限がありません
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setViewState("loaded")}
            >
              再試行
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">案件詳細</h1>
            <Badge variant="outline">PRJ-2026-042</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Master-Detail 編集画面
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 border rounded-md p-0.5">
            {(["loaded", "loading", "error"] as const).map((s) => (
              <Button
                key={s}
                variant={viewState === s ? "secondary" : "ghost"}
                size="xs"
                onClick={() => setViewState(s)}
              >
                {s === "loaded"
                  ? "通常"
                  : s === "loading"
                    ? "読込中"
                    : "エラー"}
              </Button>
            ))}
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="size-4 mr-1 animate-spin" />
            ) : (
              <Save className="size-4 mr-1" />
            )}
            保存
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Master */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-4" />
                基本情報
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">案件名</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="client">顧客</Label>
                  <Input
                    id="client"
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignee">担当者</Label>
                  <Input
                    id="assignee"
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">備考</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Detail lines */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>明細</CardTitle>
                <CardDescription>作業項目と見積もり</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus className="size-4 mr-1" />
                行追加
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>項目</TableHead>
                    <TableHead className="w-24">数量</TableHead>
                    <TableHead className="w-36">単価</TableHead>
                    <TableHead className="w-36 text-right">小計</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Input
                          value={item.product}
                          onChange={(e) =>
                            updateItem(item.id, "product", e.target.value)
                          }
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "quantity",
                              Number(e.target.value),
                            )
                          }
                          className="h-8"
                          min={1}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "unitPrice",
                              Number(e.target.value),
                            )
                          }
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ¥{(item.quantity * item.unitPrice).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end p-4 border-t">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">合計</p>
                  <p className="text-xl font-bold font-mono">
                    ¥{total.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">ステータス</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">下書き</SelectItem>
                  <SelectItem value="in_progress">進行中</SelectItem>
                  <SelectItem value="review">レビュー中</SelectItem>
                  <SelectItem value="completed">完了</SelectItem>
                  <SelectItem value="cancelled">キャンセル</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">スケジュール</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-xs">
                  開始日
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-xs">
                  終了日
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">更新履歴</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                {activityLogs.map((log) => (
                  <div key={log.id} className="flex flex-col gap-0.5">
                    <p className="text-foreground">{log.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.user} · {log.date}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
