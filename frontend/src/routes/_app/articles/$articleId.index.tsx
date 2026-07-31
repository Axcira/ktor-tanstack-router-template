import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { ArrowLeft, Edit, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useGetArticleV1 } from "@/api/generated/default/default.ts";
import type { ArticleDTO } from "@/api/generated/schemas";
import { Button } from "@/components/ui/button";
import { useAuthorize } from "@/hooks/useAuthorize.ts";
import DeleteArticleDialog from "./-components/DeleteArticleDialog";

export const Route = createFileRoute("/_app/articles/$articleId/")({
  component: ArticleDetailPage,
});

function ArticleDetail({ article }: { article: ArticleDTO }) {
  const { session } = useRouteContext({ from: "/_app" });

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { isAllowed: isEditAllowed } = useAuthorize({
    type: "UpdateArticle",
    allowOthers: article.userId !== session?.user.id,
  });
  const { isAllowed: isDeleteAllowed } = useAuthorize({
    type: "DeleteArticle",
    allowOthers: article.userId !== session?.user.id,
  });

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-8">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="-ml-2 text-muted-foreground hover:text-foreground"
      >
        <Link to="/articles">
          <ArrowLeft className="mr-2 h-4 w-4" />
          一覧に戻る
        </Link>
      </Button>

      <article className="space-y-6">
        <header className="space-y-4 border-b pb-6">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            {article.title}
          </h1>
          <p className="text-xl text-muted-foreground">{article.description}</p>
          <div className="flex flex-wrap gap-2">
            {article.tagList.map((tag) => (
              <span
                key={tag.id}
                className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs font-medium"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        </header>

        <div className="flex gap-2">
          {isEditAllowed && (
            <Button asChild variant="outline" size="sm">
              <Link
                to="/articles/$articleId/edit"
                params={{ articleId: article.id.toString() }}
              >
                <Edit className="mr-2 h-4 w-4" />
                編集する
              </Link>
            </Button>
          )}
          {isDeleteAllowed && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              削除する
            </Button>
          )}
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none py-4 text-foreground leading-7 whitespace-pre-wrap">
          {article.body}
        </div>
      </article>

      <DeleteArticleDialog
        articleId={article.id}
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      />
    </div>
  );
}

function ArticleDetailPage() {
  const { articleId } = Route.useParams();

  const { data, isLoading, isError } = useGetArticleV1(articleId);
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
        <p className="text-destructive">記事が見つかりませんでした。</p>
        <Button asChild variant="outline">
          <Link to="/articles">一覧に戻る</Link>
        </Button>
      </div>
    );
  }

  return <ArticleDetail article={article} />;
}
