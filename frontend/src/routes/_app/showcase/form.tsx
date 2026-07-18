import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_app/showcase/form")({
  component: FormPage,
});

interface FormErrors {
  companyName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  industry?: string;
  budget?: string;
  description?: string;
  agree?: string;
}

function FormPage() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [industry, setIndustry] = useState("");
  const [budget, setBudget] = useState("");
  const [description, setDescription] = useState("");
  const [agree, setAgree] = useState(false);

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!companyName.trim()) e.companyName = "会社名は必須です";
    if (!contactName.trim()) e.contactName = "担当者名は必須です";
    if (!email.trim()) {
      e.email = "メールアドレスは必須です";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = "有効なメールアドレスを入力してください";
    }
    if (phone && !/^[\d\-+()]+$/.test(phone)) {
      e.phone = "有効な電話番号を入力してください";
    }
    if (!industry) e.industry = "業種を選択してください";
    if (!budget) e.budget = "予算規模を選択してください";
    if (!description.trim()) {
      e.description = "お問い合わせ内容は必須です";
    } else if (description.trim().length < 10) {
      e.description = "10文字以上で入力してください";
    }
    if (!agree) e.agree = "利用規約への同意が必要です";
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast.error("入力内容に誤りがあります", {
        description: `${Object.keys(validationErrors).length} 件のエラーを修正してください`,
      });
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      toast.success("登録が完了しました", {
        description: `${companyName} の案件を登録しました`,
      });
    }, 1500);
  };

  const handleReset = () => {
    setCompanyName("");
    setContactName("");
    setEmail("");
    setPhone("");
    setIndustry("");
    setBudget("");
    setDescription("");
    setAgree(false);
    setErrors({});
    setSubmitted(false);
    toast.info("フォームをリセットしました");
  };

  if (submitted) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full text-center">
          <CardContent className="py-12">
            <CheckCircle2 className="size-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">登録が完了しました</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {companyName}{" "}
              様の案件を受け付けました。担当者より折り返しご連絡いたします。
            </p>
            <Button onClick={handleReset}>新規登録に戻る</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">新規案件登録</h1>
          <p className="text-sm text-muted-foreground">
            バリデーション付きフォーム
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>顧客情報</CardTitle>
            <CardDescription>案件の基本情報を入力してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">
                会社名 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="株式会社○○"
                aria-invalid={!!errors.companyName}
              />
              {errors.companyName && (
                <p className="text-xs text-destructive">{errors.companyName}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactName">
                  担当者名 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contactName"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="山田太郎"
                  aria-invalid={!!errors.contactName}
                />
                {errors.contactName && (
                  <p className="text-xs text-destructive">
                    {errors.contactName}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">電話番号</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="03-1234-5678"
                  aria-invalid={!!errors.phone}
                />
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                メールアドレス <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yamada@example.com"
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  業種 <span className="text-destructive">*</span>
                </Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger aria-invalid={!!errors.industry}>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="it">IT・通信</SelectItem>
                    <SelectItem value="manufacturing">製造業</SelectItem>
                    <SelectItem value="retail">小売・流通</SelectItem>
                    <SelectItem value="finance">金融・保険</SelectItem>
                    <SelectItem value="healthcare">医療・福祉</SelectItem>
                    <SelectItem value="education">教育</SelectItem>
                    <SelectItem value="other">その他</SelectItem>
                  </SelectContent>
                </Select>
                {errors.industry && (
                  <p className="text-xs text-destructive">{errors.industry}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>
                  予算規模 <span className="text-destructive">*</span>
                </Label>
                <Select value={budget} onValueChange={setBudget}>
                  <SelectTrigger aria-invalid={!!errors.budget}>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">〜100万円</SelectItem>
                    <SelectItem value="medium">100万〜500万円</SelectItem>
                    <SelectItem value="large">500万〜1000万円</SelectItem>
                    <SelectItem value="enterprise">1000万円〜</SelectItem>
                  </SelectContent>
                </Select>
                {errors.budget && (
                  <p className="text-xs text-destructive">{errors.budget}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                お問い合わせ内容 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="案件の概要や要望をご記入ください（10文字以上）"
                rows={4}
                aria-invalid={!!errors.description}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description}</p>
              )}
              <p className="text-xs text-muted-foreground text-right">
                {description.length} 文字
              </p>
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="agree"
                checked={agree}
                onCheckedChange={(v) => setAgree(v === true)}
                aria-invalid={!!errors.agree}
              />
              <div className="space-y-1">
                <Label
                  htmlFor="agree"
                  className="text-sm font-normal cursor-pointer"
                >
                  利用規約とプライバシーポリシーに同意する{" "}
                  <span className="text-destructive">*</span>
                </Label>
                {errors.agree && (
                  <p className="text-xs text-destructive">{errors.agree}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between mt-6">
          <Button type="button" variant="ghost" onClick={handleReset}>
            リセット
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="size-4 mr-1 animate-spin" />}
            登録する
          </Button>
        </div>
      </form>
    </div>
  );
}
