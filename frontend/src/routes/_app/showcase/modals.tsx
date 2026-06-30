import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { Trash2, Pencil, Info, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

export const Route = createFileRoute("/_app/showcase/modals")({
  component: ModalsPage,
})

function ModalsPage() {
  const [editName, setEditName] = useState("田中太郎")
  const [editEmail, setEditEmail] = useState("tanaka@example.com")
  const [sheetNote, setSheetNote] = useState("")
  const [drawerStatus, setDrawerStatus] = useState("in_progress")

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">モーダル・ドロワー・ダイアログ</h1>
        <p className="text-sm text-muted-foreground">確認・簡易編集のUIパターン</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Dialog - Edit */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ダイアログ（編集）</CardTitle>
            <CardDescription>モーダルダイアログでの簡易編集</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Pencil className="size-4 mr-2" />
                  顧客情報を編集
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>顧客情報の編集</DialogTitle>
                  <DialogDescription>変更後「保存」を押してください</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="editName">名前</Label>
                    <Input id="editName" value={editName} onChange={(e) => setEditName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editEmail">メールアドレス</Label>
                    <Input id="editEmail" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => {
                      toast.success("顧客情報を更新しました", {
                        description: `${editName} (${editEmail})`,
                      })
                    }}
                  >
                    保存
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Alert Dialog - Delete Confirmation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">確認ダイアログ（削除）</CardTitle>
            <CardDescription>破壊的操作の確認</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="size-4 mr-2" />
                  案件を削除
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>案件を削除しますか？</AlertDialogTitle>
                  <AlertDialogDescription>
                    「PRJ-2026-042 Webシステム刷新」を削除します。この操作は取り消せません。関連するすべてのデータが完全に削除されます。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => toast.success("案件を削除しました", { description: "PRJ-2026-042" })}
                  >
                    削除する
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* Sheet - Side Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">シート（サイドパネル）</CardTitle>
            <CardDescription>右からスライドするパネル</CardDescription>
          </CardHeader>
          <CardContent>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <Info className="size-4 mr-2" />
                  詳細パネルを開く
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>案件メモ</SheetTitle>
                  <SheetDescription>案件に関するメモを追加できます</SheetDescription>
                </SheetHeader>
                <div className="space-y-4 py-6">
                  <div className="space-y-2">
                    <Label>案件</Label>
                    <p className="text-sm text-muted-foreground">PRJ-2026-042 Webシステム刷新</p>
                  </div>
                  <div className="space-y-2">
                    <Label>担当者</Label>
                    <p className="text-sm text-muted-foreground">田中太郎</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sheetNote">メモ</Label>
                    <Textarea
                      id="sheetNote"
                      value={sheetNote}
                      onChange={(e) => setSheetNote(e.target.value)}
                      placeholder="メモを入力..."
                      rows={6}
                    />
                  </div>
                </div>
                <SheetFooter>
                  <Button
                    onClick={() => {
                      toast.success("メモを保存しました")
                    }}
                  >
                    保存
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </CardContent>
        </Card>

        {/* Drawer - Bottom */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ドロワー（ボトム）</CardTitle>
            <CardDescription>下からスライドするパネル</CardDescription>
          </CardHeader>
          <CardContent>
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="outline">
                  <AlertTriangle className="size-4 mr-2" />
                  ステータス変更
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader className="text-left">
                  <DrawerTitle>ステータスの変更</DrawerTitle>
                  <DrawerDescription>PRJ-2026-042 のステータスを変更します</DrawerDescription>
                </DrawerHeader>
                <div className="px-4 pb-4">
                  <div className="space-y-4 max-w-sm mx-auto">
                    <div className="space-y-2">
                      <Label>現在のステータス</Label>
                      <Select value={drawerStatus} onValueChange={setDrawerStatus}>
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
                    </div>
                  </div>
                </div>
                <DrawerFooter>
                  <Button
                    onClick={() => {
                      const labels: Record<string, string> = {
                        draft: "下書き", in_progress: "進行中", review: "レビュー中",
                        completed: "完了", cancelled: "キャンセル",
                      }
                      toast.success("ステータスを変更しました", {
                        description: `新しいステータス: ${labels[drawerStatus]}`,
                      })
                    }}
                  >
                    変更を適用
                  </Button>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </CardContent>
        </Card>

        {/* Dialog - Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">情報ダイアログ</CardTitle>
            <CardDescription>読み取り専用の情報表示</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary">
                  <Info className="size-4 mr-2" />
                  システム情報
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>システム情報</DialogTitle>
                  <DialogDescription>現在のシステム状態</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-4 text-sm">
                  {[
                    { label: "バージョン", value: "2.4.1" },
                    { label: "環境", value: "Production" },
                    { label: "最終デプロイ", value: "2026-06-30 09:15" },
                    { label: "稼働時間", value: "45日 12時間" },
                    { label: "アクティブユーザー", value: "128" },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Alert Dialog - Warning */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">警告ダイアログ</CardTitle>
            <CardDescription>注意が必要な操作の確認</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                  <AlertTriangle className="size-4 mr-2" />
                  データをエクスポート
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>データをエクスポートしますか？</AlertDialogTitle>
                  <AlertDialogDescription>
                    全顧客データ（48件）をCSV形式でエクスポートします。個人情報が含まれるため、取り扱いにご注意ください。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => toast.success("エクスポートを開始しました", { description: "完了後に通知します" })}
                  >
                    エクスポート
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
