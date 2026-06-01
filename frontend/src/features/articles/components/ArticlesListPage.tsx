import { useListArticles } from "@/api/generated/default/default.ts";
import { Route } from "@/routes/_app/articles/index.tsx";
import {
  Link,
  useNavigate,
} from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuthorize } from "@/hooks/useAuthorize.ts";

export default function ArticlesListPage() {
  const {page, limit} = Route.useSearch();
  const navigate = useNavigate({from: Route.fullPath});
  const {isAllowed: isAllowedCreation} = useAuthorize("CreateArticle")
  console.log("isAllowedCreation", isAllowedCreation)

  const {data, isLoading, isError} = useListArticles({
    limit: limit.toString(), offset: ((page - 1) * limit).toString(),
  });

  const articles = data?.data ?? [];

  if (isLoading) {
    return (<div className="flex justify-center items-center min-h-100">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
      </div>);
  }

  if (isError) {
    return <div className="p-4 text-destructive">記事の読み込みに失敗しました。</div>;
  }

  const hasNextPage = articles.length === limit;

  return (<div className="container mx-auto p-6 space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">記事一覧</h1>
        {isAllowedCreation && <Button asChild disabled={!isAllowedCreation}>
          <Link to="/articles/create">
            <Plus className="mr-2 h-4 w-4"/>
            記事を書く
          </Link>
        </Button>}
      </div>

      <div className="grid gap-4">
        {articles.length === 0 ? (
          <p className="text-muted-foreground text-center py-10">記事がありません。</p>) : (articles.map((article) => (
            <Link
              key={article.id}
              to="/articles/$articleId"
              params={{articleId: article.id.toString()}}
              className="block group"
            >
              <div
                className="border rounded-lg p-4 hover:border-primary transition-colors bg-card text-card-foreground shadow-sm">
                <h2 className="text-xl font-semibold group-hover:text-primary transition-colors">
                  {article.title}
                </h2>
                <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
                  {article.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {article.tagList.map((tag) => (<span
                      key={tag.id}
                      className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-[10px] font-medium"
                    >
                      #{tag.name}
                    </span>))}
                </div>
              </div>
            </Link>)))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate({search: (prev) => ({...prev, page: Math.max(1, page - 1)})})}
          disabled={page === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2"/>
          前へ
        </Button>
        <span className="text-sm font-medium">ページ {page}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate({search: (prev) => ({...prev, page: page + 1})})}
          disabled={!hasNextPage}
        >
          次へ
          <ChevronRight className="h-4 w-4 ml-2"/>
        </Button>
      </div>
    </div>);
}
