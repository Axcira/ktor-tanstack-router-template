import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, Inbox, Loader2, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_app/showcase/chat")({
  component: ChatPage,
});

interface Message {
  id: number;
  user: string;
  initials: string;
  text: string;
  timestamp: string;
  isOwn: boolean;
}

const initialMessages: Message[] = [
  {
    id: 1,
    user: "田中太郎",
    initials: "田",
    text: "お疲れ様です。Webシステム刷新プロジェクトの進捗について共有します。",
    timestamp: "10:00",
    isOwn: false,
  },
  {
    id: 2,
    user: "佐藤花子",
    initials: "佐",
    text: "ありがとうございます。フロントエンドの設計は完了しました。来週からコーディングに入ります。",
    timestamp: "10:05",
    isOwn: false,
  },
  {
    id: 3,
    user: "自分",
    initials: "自",
    text: "了解です。バックエンドのAPI設計書を共有しましたので、確認をお願いします。",
    timestamp: "10:12",
    isOwn: true,
  },
  {
    id: 4,
    user: "田中太郎",
    initials: "田",
    text: "確認しました。認証周りのエンドポイントについて質問があります。JWTのリフレッシュトークンの有効期限はどのくらいを想定していますか？",
    timestamp: "10:18",
    isOwn: false,
  },
  {
    id: 5,
    user: "自分",
    initials: "自",
    text: "リフレッシュトークンは30日間を想定しています。セキュリティ要件に応じて調整可能です。",
    timestamp: "10:22",
    isOwn: true,
  },
  {
    id: 6,
    user: "佐藤花子",
    initials: "佐",
    text: "UIモックアップも共有しておきます。フィードバックがあればお願いします。",
    timestamp: "10:30",
    isOwn: false,
  },
];

type ViewState = "loaded" | "loading" | "error" | "empty";

function ChatPage() {
  const [viewState, setViewState] = useState<ViewState>("loaded");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const newMsg: Message = {
      id: Date.now(),
      user: "自分",
      initials: "自",
      text: input.trim(),
      timestamp: new Date().toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isOwn: true,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setSending(true);

    setTimeout(() => {
      setSending(false);
      const replies = [
        "承知しました。確認します。",
        "ありがとうございます。対応します。",
        "了解です。次のミーティングで詳しく話しましょう。",
        "確認しました。問題ありません。",
      ];
      const reply: Message = {
        id: Date.now() + 1,
        user: "田中太郎",
        initials: "田",
        text: replies[Math.floor(Math.random() * replies.length)],
        timestamp: new Date().toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isOwn: false,
      };
      setMessages((prev) => [...prev, reply]);
    }, 1500);
  };

  const displayMessages = viewState === "empty" ? [] : messages;

  return (
    <div className="p-6 h-[calc(100vh-2rem)] flex flex-col gap-4">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">チャット</h1>
          <p className="text-sm text-muted-foreground">担当者コメント・履歴</p>
        </div>
        <div className="flex gap-1 border rounded-md p-0.5">
          {(["loaded", "loading", "error", "empty"] as const).map((s) => (
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
                  : s === "error"
                    ? "エラー"
                    : "空"}
            </Button>
          ))}
        </div>
      </div>

      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="shrink-0 border-b py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              PRJ-2026-042 — Webシステム刷新
            </CardTitle>
            <Badge variant="outline">3名参加中</Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
          {viewState === "loading" ? (
            <div className="flex-1 p-4 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${i % 2 === 0 ? "" : "justify-end"}`}
                >
                  {i % 2 === 0 && (
                    <Skeleton className="size-8 rounded-full shrink-0" />
                  )}
                  <div className="space-y-1.5 max-w-[70%]">
                    {i % 2 === 0 && <Skeleton className="h-3 w-16" />}
                    <Skeleton className="h-12 w-48 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : viewState === "error" ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <AlertCircle className="size-10 text-destructive mb-3" />
              <p className="text-sm font-medium text-destructive">
                メッセージの読み込みに失敗しました
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setViewState("loaded")}
              >
                再試行
              </Button>
            </div>
          ) : displayMessages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <Inbox className="size-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                メッセージはまだありません
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                最初のメッセージを送信してください
              </p>
            </div>
          ) : (
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {displayMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.isOwn ? "justify-end" : ""}`}
                >
                  {!msg.isOwn && (
                    <Avatar className="size-8 shrink-0">
                      <AvatarFallback className="text-xs">
                        {msg.initials}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[70%] ${msg.isOwn ? "text-right" : ""}`}
                  >
                    {!msg.isOwn && (
                      <p className="text-xs text-muted-foreground mb-1">
                        {msg.user}
                      </p>
                    )}
                    <div
                      className={`inline-block rounded-lg px-3 py-2 text-sm ${
                        msg.isOwn
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex gap-3">
                  <Avatar className="size-8 shrink-0">
                    <AvatarFallback className="text-xs">田</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      田中太郎
                    </p>
                    <div className="inline-block rounded-lg px-3 py-2 bg-muted">
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Input */}
          <div className="shrink-0 border-t p-3">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="メッセージを入力..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={viewState === "error"}
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || viewState === "error"}
              >
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
