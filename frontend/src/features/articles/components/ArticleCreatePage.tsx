import {
  Link,
  useNavigate,
} from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useCreateArticleV1 } from "@/api/generated/default/default.ts";
import { Button } from "@/components/ui/button";
import ArticleForm, { type ArticleFormValues } from "./ArticleForm";
import { useAuthorize } from "@/hooks/useAuthorize.ts";
import NoPermission from "@/components/NoPermission.tsx";
import LoadingSpinner from "@/components/LoadingSpinner.tsx";

export default function ArticleCreatePage() {
  const navigate = useNavigate();
  const createArticle = useCreateArticleV1();
  const {isAllowed, isLoading} = useAuthorize({type: "CreateArticle"})

  if (isLoading) {
    return <LoadingSpinner/>
  }

  if (!isAllowed) {
    return <NoPermission/>
  }

  const handleSubmit = async (values: ArticleFormValues) => {
    try {
      const tagList = values.tagList ? values.tagList.split(",").map((t) => t.trim()).filter(Boolean) : [];

      const response = await createArticle.mutateAsync({
        data: {
          title: values.title, description: values.description, body: values.body, tagList,
        },
      });

      if (response.status === 201 || response.status === 200) {
        await navigate({to: "/articles"});
      }
    } catch (error) {
      console.error("Failed to create article:", error);
    }
  };

  return (<div className="container mx-auto p-6 max-w-2xl space-y-6">
    <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground hover:text-foreground">
      <Link to="/articles">
        <ArrowLeft className="mr-2 h-4 w-4"/>
        一覧に戻る
      </Link>
    </Button>

    <div className="space-y-2">
      <h1 className="text-3xl font-bold tracking-tight">記事の作成</h1>
      <p className="text-muted-foreground">
        新しく素晴らしい記事を共有しましょう。
      </p>
    </div>

    <div className="border rounded-lg p-6 bg-card shadow-sm">
      <ArticleForm
        onSubmit={handleSubmit}
        isSubmitting={createArticle.isPending}
        submitLabel="記事を投稿する"
      />
    </div>
  </div>);
}
