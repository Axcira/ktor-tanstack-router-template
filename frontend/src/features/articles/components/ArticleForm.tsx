import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export interface ArticleFormValues {
  title: string;
  description: string;
  body: string;
  tagList: string;
}

interface ArticleFormProps {
  initialValues?: ArticleFormValues;
  onSubmit: (values: ArticleFormValues) => Promise<void>;
  isSubmitting: boolean;
  submitLabel: string;
}

export default function ArticleForm({
  initialValues,
  onSubmit,
  isSubmitting,
  submitLabel,
}: ArticleFormProps) {
  const [values, setValues] = useState<ArticleFormValues>(
    initialValues || {
      title: "",
      description: "",
      body: "",
      tagList: "",
    }
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">タイトル</Label>
        <Input
          id="title"
          name="title"
          value={values.title}
          onChange={handleChange}
          placeholder="記事のタイトル"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">概要</Label>
        <Input
          id="description"
          name="description"
          value={values.description}
          onChange={handleChange}
          placeholder="記事の短い概要"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="body">本文</Label>
        <textarea
          id="body"
          name="body"
          value={values.body}
          onChange={handleChange}
          placeholder="記事の本文を入力してください..."
          className="flex min-h-75 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tagList">タグ (カンマ区切り)</Label>
        <Input
          id="tagList"
          name="tagList"
          value={values.tagList}
          onChange={handleChange}
          placeholder="react, typescript, ktor"
        />
      </div>
      <div className="pt-4">
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
