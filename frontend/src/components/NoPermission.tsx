import ErrorCard from "@/components/ErrorCard.tsx";

export default function NoPermission({
  errorMessage = "権限がありません。",
  className,
}: {
  errorMessage?: string;
  className?: string;
}) {
  return <ErrorCard errorMessage={errorMessage} className={className} />;
}
