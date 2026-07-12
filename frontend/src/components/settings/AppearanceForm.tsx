import { useAtom } from "jotai";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { themeAtom } from "@/store/theme";

export default function AppearanceForm() {
  const [theme, setTheme] = useAtom(themeAtom);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-foreground">テーマ設定</h3>
        <p className="text-sm text-muted-foreground">
          アプリケーションの外観を選択してください。単一のテーマを選択するか、システムと同期して昼夜のテーマを自動的に切り替えます。
        </p>
      </div>

      <RadioGroup
        value={theme}
        onValueChange={(v) => {
          if (v === "light" || v === "dark" || v === "system") {
            setTheme(v);
          }
        }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4"
      >
        <Label className="cursor-pointer group relative flex flex-col rounded-xl border-2 border-border bg-card transition-all hover:border-primary/50 [&:has([data-state=checked])]:border-primary">
          <RadioGroupItem value="light" className="sr-only" />

          <div className="h-[140px] rounded-t-[10px] bg-zinc-100 border-b border-border p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-2">
                <div className="h-2 w-10 rounded-full bg-zinc-300" />
                <div className="h-2 w-10 rounded-full bg-zinc-300" />
              </div>
              <div className="flex gap-1.5">
                <div className="h-2 w-2 rounded-sm bg-destructive/80" />
                <div className="h-2 w-2 rounded-sm bg-primary/80" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-2 w-16 rounded-full bg-zinc-300" />
              <div className="flex h-3 w-full overflow-hidden rounded-sm bg-zinc-300/60">
                <div className="h-full w-[40%] bg-primary/90" />
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col p-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-border group-[&:has([data-state=checked])]:border-primary transition-colors">
                <div className="h-2 w-2 rounded-full bg-primary opacity-0 transition-opacity group-[&:has([data-state=checked])]:opacity-100" />
              </div>
              <span className="font-semibold text-sm text-card-foreground">
                ライト
              </span>
            </div>
            <div className="ml-7 text-xs text-muted-foreground leading-relaxed">
              十分なコントラストと明るさを持つ標準的なライトテーマです。
            </div>
          </div>
        </Label>

        <Label className="cursor-pointer group relative flex flex-col rounded-xl border-2 border-border bg-card transition-all hover:border-primary/50 [&:has([data-state=checked])]:border-primary">
          <RadioGroupItem value="dark" className="sr-only" />

          <div className="h-[140px] rounded-t-[10px] bg-zinc-950 border-b border-border p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-2">
                <div className="h-2 w-10 rounded-full bg-zinc-800" />
                <div className="h-2 w-10 rounded-full bg-zinc-800" />
              </div>
              <div className="flex gap-1.5">
                <div className="h-2 w-2 rounded-sm bg-destructive" />
                <div className="h-2 w-2 rounded-sm bg-primary" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-2 w-16 rounded-full bg-zinc-800" />
              <div className="flex h-3 w-full overflow-hidden rounded-sm bg-zinc-800">
                <div className="h-full w-[40%] bg-primary" />
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col p-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-border group-[&:has([data-state=checked])]:border-primary transition-colors">
                <div className="h-2 w-2 rounded-full bg-primary opacity-0 transition-opacity group-[&:has([data-state=checked])]:opacity-100" />
              </div>
              <span className="font-semibold text-sm text-card-foreground">
                ダーク
              </span>
            </div>
            <div className="ml-7 text-xs text-muted-foreground leading-relaxed">
              暗い場所での眼精疲労を軽減するように設計されたダークテーマです。
            </div>
          </div>
        </Label>

        <Label className="cursor-pointer group relative flex flex-col rounded-xl border-2 border-border bg-card transition-all hover:border-primary/50 [&:has([data-state=checked])]:border-primary">
          <RadioGroupItem value="system" className="sr-only" />

          <div className="flex h-[140px] rounded-t-[10px] border-b border-border overflow-hidden">
            <div className="flex-1 bg-zinc-100 p-4 border-r border-border">
              <div className="flex items-center mb-6">
                <div className="h-2 w-8 rounded-full bg-zinc-300" />
              </div>
              <div className="space-y-3">
                <div className="h-2 w-12 rounded-full bg-zinc-300" />
                <div className="flex h-3 w-full overflow-hidden rounded-sm bg-zinc-300/60">
                  <div className="h-full w-[60%] bg-primary/80" />
                </div>
              </div>
            </div>
            <div className="flex-1 bg-zinc-950 p-4">
              <div className="flex items-center justify-end mb-6">
                <div className="flex gap-1.5">
                  <div className="h-2 w-2 rounded-sm bg-destructive" />
                  <div className="h-2 w-2 rounded-sm bg-primary" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-2 w-12 rounded-full bg-zinc-800" />
                <div className="flex h-3 w-full overflow-hidden rounded-sm bg-zinc-800">
                  <div className="h-full w-[60%] bg-primary" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col p-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-border group-[&:has([data-state=checked])]:border-primary transition-colors">
                <div className="h-2 w-2 rounded-full bg-primary opacity-0 transition-opacity group-[&:has([data-state=checked])]:opacity-100" />
              </div>
              <span className="font-semibold text-sm text-card-foreground">
                システム同期
              </span>
            </div>
            <div className="ml-7 text-xs text-muted-foreground leading-relaxed">
              システムの設定に基づいて、昼夜のテーマを自動的に切り替えます。
            </div>
          </div>
        </Label>
      </RadioGroup>
    </div>
  );
}
