import { createFileRoute } from "@tanstack/react-router"

import ArticlesPage from "@/features/articles/components/ArticlesPage";

export const Route = createFileRoute("/_app/articles")({
  component: ArticlesPage,
})
