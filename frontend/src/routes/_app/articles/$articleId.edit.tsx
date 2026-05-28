import { createFileRoute } from "@tanstack/react-router";
import ArticleEditPage from "@/features/articles/components/ArticleEditPage.tsx";

export const Route = createFileRoute("/_app/articles/$articleId/edit")({
  component: ArticleEditPage,
});
