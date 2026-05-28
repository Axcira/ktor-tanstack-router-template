import {
  createFileRoute,
  type SearchSchemaInput,
} from "@tanstack/react-router";
import ArticlesListPage from "@/features/articles/components/ArticlesListPage.tsx";

const defaultArticlesSearch = {
  page: 1,
  limit: 10,
};

type ArticlesSearch = {
  page: number;
  limit: number;
};

type ArticlesSearchInput = {
  page?: number;
  limit?: number;
} & SearchSchemaInput;

export const Route = createFileRoute("/_app/articles/")({
  component: ArticlesListPage,
  validateSearch: (search: ArticlesSearchInput): ArticlesSearch => ({
    page: Number(search.page ?? defaultArticlesSearch.page),
    limit: Number(search.limit ?? defaultArticlesSearch.limit),
  }),
});
