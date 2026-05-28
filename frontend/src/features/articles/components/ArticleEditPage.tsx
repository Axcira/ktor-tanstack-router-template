import { useGetArticle, useUpdateArticle } from "@/api/generated/default/default.ts";
import { Route } from "@/routes/_app/articles/$articleId.edit.tsx";
import { useNavigate, Link, useRouteContext } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import ArticleForm, { type ArticleFormValues } from "./ArticleForm";

export default function ArticleEditPage() {
  const { articleId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useRouteContext({ from: "/_app" });
  const updateArticle = useUpdateArticle();

  const { data, isLoading, isError } = useGetArticle(articleId);
  const article = data?.data;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-100">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !article) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-destructive">記事の読み込みに失敗しました。</p>
        <Button asChild variant="outline">
          <Link to="/articles">一覧に戻る</Link>
        </Button>
      </div>
    );
  }

  // Author Check
  if (user?.id !== article.userId) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-destructive">この記事を編集する権限がありません。</p>
        <Button asChild variant="outline">
          <Link to="/articles/$articleId" params={{ articleId }}>
            詳細に戻る
          </Link>
        </Button>
      </div>
    );
  }

  const initialValues: ArticleFormValues = {
    title: article.title,
    description: article.description,
    body: article.body,
    tagList: article.tagList.map((t) => t.name).join(", "),
  };

  const handleSubmit = async (values: ArticleFormValues) => {
    try {
      const tagList = values.tagList
        ? values.tagList.split(",").map((t) => t.trim()).filter(Boolean)
        : [];

      await updateArticle.mutateAsync({
        id: article.id.toString(),
        data: {
          title: values.title,
          description: values.description,
          body: values.body,
          tagList,
        },
      });

      await navigate({
        to: "/articles/$articleId", params: {articleId: article.id.toString()},
      });
    } catch (error) {
      console.error("Failed to update article:", error);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground hover:text-foreground">
        <Link to="/articles/$articleId" params={{ articleId }}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          詳細に戻る
        </Link>
      </Button>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">記事の編集</h1>
        <p className="text-muted-foreground">
          記事の内容を更新して、最新の状態に保ちましょう。
        </p>
      </div>

      <div className="border rounded-lg p-6 bg-card shadow-sm">
        <ArticleForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          isSubmitting={updateArticle.isPending}
          submitLabel="更新を保存する"
        />
      </div>
    </div>
  );
}
