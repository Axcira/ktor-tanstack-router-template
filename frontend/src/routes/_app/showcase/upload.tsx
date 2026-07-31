import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  File,
  FileText,
  Image,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
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
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_app/showcase/upload")({
  component: UploadPage,
});

interface UploadFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return Image;
  if (type.includes("pdf") || type.includes("document")) return FileText;
  return File;
}

function UploadPage() {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    const newFiles: UploadFile[] = Array.from(fileList).map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: f.name,
      size: f.size,
      type: f.type || "application/octet-stream",
      status: "pending" as const,
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
    toast.info(`${newFiles.length} 件のファイルを追加しました`);
  }, []);

  const simulateUpload = (fileId: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId
          ? { ...f, status: "uploading" as const, progress: 0 }
          : f,
      ),
    );

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 25 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        const shouldFail = Math.random() < 0.15;
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? { ...f, status: shouldFail ? "error" : "done", progress: 100 }
              : f,
          ),
        );
        if (shouldFail) {
          toast.error("アップロードに失敗しました", {
            description:
              "ネットワークエラーが発生しました。再試行してください。",
          });
        } else {
          const file = files.find((f) => f.id === fileId);
          toast.success(`${file?.name ?? "ファイル"} をアップロードしました`);
        }
      } else {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, progress: Math.min(progress, 100) } : f,
          ),
        );
      }
    }, 300);
  };

  const uploadAll = () => {
    const pending = files.filter(
      (f) => f.status === "pending" || f.status === "error",
    );
    if (pending.length === 0) {
      toast.warning("アップロードするファイルがありません");
      return;
    }
    for (const f of pending) {
      simulateUpload(f.id);
    }
  };

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    toast.info("ファイルを削除しました");
  };

  const clearAll = () => {
    setFiles([]);
    toast.info("すべてのファイルをクリアしました");
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const uploadingCount = files.filter((f) => f.status === "uploading").length;
  const doneCount = files.filter((f) => f.status === "done").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          ファイルアップロード
        </h1>
        <p className="text-sm text-muted-foreground">添付ファイルの管理</p>
      </div>

      {/* Drop zone */}
      <Card>
        <CardContent className="p-0">
          <button
            type="button"
            className={`block w-[calc(100%-2rem)] border-2 border-dashed rounded-lg m-4 p-8 text-center transition-colors cursor-pointer ${
              dragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50 bg-transparent"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="size-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium">ファイルをドラッグ＆ドロップ</p>
            <p className="text-xs text-muted-foreground mt-1">
              またはクリックしてファイルを選択
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              PDF, 画像, ドキュメント（最大10MB）
            </p>
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </CardContent>
      </Card>

      {/* File list */}
      {files.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">ファイル一覧</CardTitle>
              <CardDescription>
                {files.length} 件
                {doneCount > 0 && (
                  <>
                    {" "}
                    · <span className="text-green-600">{doneCount} 完了</span>
                  </>
                )}
                {uploadingCount > 0 && (
                  <>
                    {" "}
                    ·{" "}
                    <span className="text-blue-600">
                      {uploadingCount} アップロード中
                    </span>
                  </>
                )}
                {errorCount > 0 && (
                  <>
                    {" "}
                    ·{" "}
                    <span className="text-destructive">
                      {errorCount} エラー
                    </span>
                  </>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearAll}>
                クリア
              </Button>
              <Button
                size="sm"
                onClick={uploadAll}
                disabled={pendingCount === 0 && errorCount === 0}
              >
                {uploadingCount > 0 && (
                  <Loader2 className="size-4 mr-1 animate-spin" />
                )}
                すべてアップロード
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {files.map((file) => {
              const Icon = getFileIcon(file.type);
              return (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                >
                  <Icon className="size-8 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {file.name}
                      </p>
                      {file.status === "done" && (
                        <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                      )}
                      {file.status === "error" && (
                        <AlertCircle className="size-4 text-destructive shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatSize(file.size)}
                    </p>
                    {file.status === "uploading" && (
                      <Progress
                        value={file.progress}
                        className="h-1.5 mt-1.5"
                      />
                    )}
                    {file.status === "error" && (
                      <p className="text-xs text-destructive mt-1">
                        アップロードに失敗しました
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {(file.status === "pending" || file.status === "error") && (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => simulateUpload(file.id)}
                      >
                        {file.status === "error" ? "再試行" : "アップロード"}
                      </Button>
                    )}
                    {file.status === "uploading" && (
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(file.progress)}%
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => removeFile(file.id)}
                      disabled={file.status === "uploading"}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {files.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <File className="size-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              ファイルがありません
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              上のエリアにファイルをドロップして追加してください
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
