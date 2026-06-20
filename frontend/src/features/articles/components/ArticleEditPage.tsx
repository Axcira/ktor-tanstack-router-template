import {
  Link,
  useNavigate,
  useRouteContext,
} from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import {
  useGetArticleV1,
  useUpdateArticleV1,
} from "@/api/generated/default/default.ts";
import type { ArticleDTO } from "@/api/generated/schemas";
import LoadingSpinner from "@/components/LoadingSpinner.tsx";
import { Button } from "@/components/ui/button";
import { useAuthorize } from "@/hooks/useAuthorize.ts";
import { Route } from "@/routes/_app/articles/$articleId.edit.tsx";
import ArticleForm, { type ArticleFormValues } from "./ArticleForm";
import NoPermission from "@/components/NoPermission.tsx";

export default function ArticleEditPage() {
  const {articleId} = Route.useParams();

  const {data, isLoading, isError} = useGetArticleV1(articleId);
  const article = data?.data;

  if (isLoading) {
    return (<LoadingSpinner/>);
  }

  if (isError || !article) {
    return (<div className="p-6 text-center space-y-4">
      <p className="text-destructive">記事の読み込みに失敗しました。</p>
      <Button asChild variant="outline">
        <Link to="/articles">一覧に戻る</Link>
      </Button>
    </div>);
  }

  return (<ArticleEditForm article={article}/>)
}

function ArticleEditForm({article}: { article: ArticleDTO }) {
  const {session} = useRouteContext({from: "/_app"});
  const updateArticle = useUpdateArticleV1();
  const navigate = useNavigate();
  const articleId = article.id.toString();
  const {isAllowed, isLoading: isLoadingPermission} = useAuthorize({
    type: "UpdateArticle", allowOthers: article.userId !== session.user.id,
  })

  const initialValues: ArticleFormValues = {
    title: article.title, description: article.description, body: article.body, tagList: article.tagList.map((t) => t.name).join(", "),
  };

  const handleSubmit = async (values: ArticleFormValues) => {
    try {
      const tagList = values.tagList ? values.tagList.split(",").map((t) => t.trim()).filter(Boolean) : [];

      await updateArticle.mutateAsync({
        id: article.id.toString(), data: {
          title: values.title, description: values.description, body: values.body, tagList,
        },
      });

      await navigate({
        to: "/articles/$articleId", params: {articleId: article.id.toString()},
      });
    } catch (error) {
      console.error("Failed to update article:", error);
    }
  };

  if (isLoadingPermission) {
    return (<LoadingSpinner/>);
  }

  if (!isAllowed) {
    const isEditSelfAllowed = session.permissions.some(p => p.type === "UpdateArticle" && !p.allowOthers)
    return (<NoPermission className={"rounded-none"}
                          errorMessage={isEditSelfAllowed ? "自分の記事のみ編集できます。" : "編集権限がありません。"}/>);
  }

  return (<div className="container mx-auto p-6 max-w-2xl space-y-6">
    <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground hover:text-foreground">
      <Link to="/articles/$articleId" params={{articleId}}>
        <ArrowLeft className="mr-2 h-4 w-4"/>
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
  </div>);
}
