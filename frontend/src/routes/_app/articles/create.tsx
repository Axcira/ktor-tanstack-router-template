import { createFileRoute } from "@tanstack/react-router";
import ArticleCreatePage from "@/features/articles/components/ArticleCreatePage.tsx";

export const Route = createFileRoute("/_app/articles/create")({
  component: ArticleCreatePage,
});
