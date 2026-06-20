import { Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button";
import { useGetSelfV1 } from "@/api/generated/default/default.ts";


export default function AuthButtons() {
  const {data} = useGetSelfV1()

  return (<div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
    {data?.status !== 200 ? (<>
      <Button asChild size="lg"
              className="h-12 px-8 text-base bg-primary text-primary-foreground rounded hover:opacity-90 shadow-md transition-all">
        <Link to="/login">
          ログイン
        </Link>
      </Button>

      <Button asChild size="lg" variant="secondary" className="h-12 px-8 text-base rounded shadow-sm transition-all">
        <Link to="/register">
          アカウント登録
        </Link>
      </Button>
    </>) : (<div className="mt-8">
      <p className="mb-4 text-lg text-muted-foreground">
        Logged in as <span className="font-semibold text-foreground">{data.data.user.email}</span>
      </p>
    </div>)}
  </div>)
}
