import WelcomeMessage from "./WelcomeMessage";

export default function DashboardPage() {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-linear-to-b from-background to-muted/40 px-4 py-24 text-center">
      <WelcomeMessage />
    </div>
  );
}
