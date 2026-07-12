import { createFileRoute } from "@tanstack/react-router"
import { useState, useMemo } from "react"
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertCircle,
  Inbox,
  MoreHorizontal,
  Trash2,
  Pencil,
  Eye,
  Save,
  Loader2,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

export const Route = createFileRoute("/_app/showcase/table")({
  component: TablePage,
})

type Status = "active" | "inactive" | "pending"

interface Customer {
  id: string
  name: string
  email: string
  company: string
  status: Status
  revenue: number
  lastContact: string
  phone: string
  address: string
  notes: string
}

const mockCustomers: Customer[] = Array.from({ length: 48 }, (_, i) => ({
  id: `C-${String(i + 1).padStart(4, "0")}`,
  name: [
    "田中太郎", "佐藤花子", "鈴木一郎", "高橋美咲", "伊藤健太",
    "渡辺由美", "山本大輔", "中村あかり", "小林誠", "加藤さくら",
    "吉田拓也", "山田恵子",
  ][i % 12],
  email: `user${i + 1}@example.com`,
  company: [
    "株式会社テクノ", "ABC商事", "グローバルシステムズ", "未来工業",
    "サンライズ", "デジタルワークス",
  ][i % 6],
  status: (["active", "inactive", "pending"] as const)[i % 3],
  revenue: Math.floor(Math.random() * 5000000) + 500000,
  lastContact: `2026-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
  phone: `03-${String(1000 + i).slice(0, 4)}-${String(5000 + i).slice(0, 4)}`,
  address: ["東京都千代田区", "大阪府大阪市", "愛知県名古屋市", "福岡県福岡市", "北海道札幌市", "神奈川県横浜市"][i % 6],
  notes: ["主要顧客。定期的なフォローが必要。", "新規開拓中。次回提案予定あり。", "契約更新時期が近い。"][i % 3],
}))

const statusLabel: Record<Status, string> = {
  active: "有効",
  inactive: "無効",
  pending: "保留",
}

const statusVariant: Record<Status, "default" | "secondary" | "outline"> = {
  active: "default",
  inactive: "secondary",
  pending: "outline",
}

type ViewState = "loaded" | "loading" | "error" | "empty"

function TablePage() {
  const [viewState, setViewState] = useState<ViewState>("loaded")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const pageSize = 10

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogTab, setDialogTab] = useState<"detail" | "edit">("detail")

  // Edit form state
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editCompany, setEditCompany] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editAddress, setEditAddress] = useState("")
  const [editStatus, setEditStatus] = useState<Status>("active")
  const [editNotes, setEditNotes] = useState("")
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() => {
    if (viewState === "empty") return []
    return mockCustomers.filter((c) => {
      const matchSearch =
        !search ||
        c.name.includes(search) ||
        c.email.includes(search) ||
        c.company.includes(search) ||
        c.id.includes(search)
      const matchStatus = statusFilter === "all" || c.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [search, statusFilter, viewState])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const openDialog = (customer: Customer, tab: "detail" | "edit") => {
    setSelectedCustomer(customer)
    setDialogTab(tab)
    setEditName(customer.name)
    setEditEmail(customer.email)
    setEditCompany(customer.company)
    setEditPhone(customer.phone)
    setEditAddress(customer.address)
    setEditStatus(customer.status)
    setEditNotes(customer.notes)
    setDialogOpen(true)
  }

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      toast.success("顧客情報を保存しました", {
        description: `${editName} の情報を更新しました`,
      })
      setDialogOpen(false)
    }, 1000)
  }

  const handleDelete = (customer: Customer) => {
    toast.success(`${customer.name} を削除しました`, {
      description: `ID: ${customer.id}`,
    })
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">顧客一覧</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} 件の顧客
          </p>
        </div>
        <div className="flex gap-1 border rounded-md p-0.5">
          {(["loaded", "loading", "error", "empty"] as const).map((s) => (
            <Button
              key={s}
              variant={viewState === s ? "secondary" : "ghost"}
              size="xs"
              onClick={() => { setViewState(s); setPage(1) }}
            >
              {s === "loaded" ? "通常" : s === "loading" ? "読込中" : s === "error" ? "エラー" : "空"}
            </Button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="名前・メール・会社名で検索..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="ステータス" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="active">有効</SelectItem>
            <SelectItem value="inactive">無効</SelectItem>
            <SelectItem value="pending">保留</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {viewState === "loading" ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-40 flex-1" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : viewState === "error" ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="size-10 text-destructive mb-3" />
              <p className="text-sm font-medium text-destructive">データの取得に失敗しました</p>
              <p className="text-xs text-muted-foreground mt-1">ネットワーク接続を確認してください</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setViewState("loading")
                  setTimeout(() => {
                    setViewState("loaded")
                    toast.success("データを再読み込みしました")
                  }, 1000)
                }}
              >
                再試行
              </Button>
            </div>
          ) : paged.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Inbox className="size-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">顧客が見つかりません</p>
              <p className="text-xs text-muted-foreground mt-1">
                {search || statusFilter !== "all"
                  ? "検索条件を変更してください"
                  : "顧客を登録してください"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">ID</TableHead>
                  <TableHead>名前</TableHead>
                  <TableHead>メール</TableHead>
                  <TableHead>会社名</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead className="text-right">売上</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer"
                    onClick={() => openDialog(c, "detail")}
                  >
                    <TableCell className="font-mono text-xs">{c.id}</TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground">{c.email}</TableCell>
                    <TableCell>{c.company}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[c.status]}>{statusLabel[c.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ¥{c.revenue.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openDialog(c, "detail") }}>
                            <Eye className="size-4 mr-2" />
                            詳細
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openDialog(c, "edit") }}>
                            <Pencil className="size-4 mr-2" />
                            編集
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => { e.stopPropagation(); handleDelete(c) }}
                          >
                            <Trash2 className="size-4 mr-2" />
                            削除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {viewState === "loaded" && filtered.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} / {filtered.length} 件
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon-sm" disabled={currentPage <= 1} onClick={() => setPage(1)}>
              <ChevronsLeft className="size-4" />
            </Button>
            <Button variant="outline" size="icon-sm" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <span className="px-3 text-sm">
              {currentPage} / {totalPages}
            </span>
            <Button variant="outline" size="icon-sm" disabled={currentPage >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="size-4" />
            </Button>
            <Button variant="outline" size="icon-sm" disabled={currentPage >= totalPages} onClick={() => setPage(totalPages)}>
              <ChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedCustomer && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedCustomer.name}
                  <Badge variant={statusVariant[selectedCustomer.status]} className="ml-1">
                    {statusLabel[selectedCustomer.status]}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {selectedCustomer.id} — {selectedCustomer.company}
                </DialogDescription>
              </DialogHeader>

              <Tabs value={dialogTab} onValueChange={(v) => setDialogTab(v as "detail" | "edit")}>
                <TabsList>
                  <TabsTrigger value="detail">
                    <Eye className="size-3.5 mr-1.5" />
                    詳細
                  </TabsTrigger>
                  <TabsTrigger value="edit">
                    <Pencil className="size-3.5 mr-1.5" />
                    編集
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="detail" className="mt-4 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">名前</p>
                      <p className="text-sm font-medium">{selectedCustomer.name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">会社名</p>
                      <p className="text-sm font-medium">{selectedCustomer.company}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">メールアドレス</p>
                      <p className="text-sm font-medium">{selectedCustomer.email}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">電話番号</p>
                      <p className="text-sm font-medium">{selectedCustomer.phone}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">住所</p>
                      <p className="text-sm font-medium">{selectedCustomer.address}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">ステータス</p>
                      <Badge variant={statusVariant[selectedCustomer.status]}>
                        {statusLabel[selectedCustomer.status]}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">売上</p>
                      <p className="text-sm font-medium font-mono">¥{selectedCustomer.revenue.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">最終連絡日</p>
                      <p className="text-sm font-medium">{selectedCustomer.lastContact}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">備考</p>
                    <p className="text-sm">{selectedCustomer.notes}</p>
                  </div>
                </TabsContent>

                <TabsContent value="edit" className="mt-4 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">名前</Label>
                      <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-company">会社名</Label>
                      <Input id="edit-company" value={editCompany} onChange={(e) => setEditCompany(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-email">メールアドレス</Label>
                      <Input id="edit-email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-phone">電話番号</Label>
                      <Input id="edit-phone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="edit-address">住所</Label>
                      <Input id="edit-address" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>ステータス</Label>
                      <Select value={editStatus} onValueChange={(v) => setEditStatus(v as Status)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">有効</SelectItem>
                          <SelectItem value="inactive">無効</SelectItem>
                          <SelectItem value="pending">保留</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-notes">備考</Label>
                    <Textarea id="edit-notes" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      キャンセル
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Save className="size-4 mr-1" />}
                      保存
                    </Button>
                  </DialogFooter>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
