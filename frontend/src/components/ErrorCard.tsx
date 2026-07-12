import { CircleX } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils.ts";

export default function ErrorCard({
  errorMessage,
  className,
}: {
  errorMessage?: string;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "bg-destructive/20 text-left flex flex-col gap-2",
        className,
      )}
    >
      <CardHeader>
        <CardTitle className={"text-destructive inline-flex gap-1"}>
          <CircleX /> Error
        </CardTitle>
        <CardDescription>
          このページを表示中に予期しないエラーが発生しました。
        </CardDescription>
      </CardHeader>
      {errorMessage && (
        <>
          <hr />
          <CardContent>{errorMessage}</CardContent>
        </>
      )}
    </Card>
  );
}
