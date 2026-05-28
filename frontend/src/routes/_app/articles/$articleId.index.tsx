import { createFileRoute } from "@tanstack/react-router";
import ArticleDetailPage from "@/features/articles/components/ArticleDetailPage.tsx";

export const Route = createFileRoute("/_app/articles/$articleId/")({
  component: ArticleDetailPage,
});
