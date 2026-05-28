import AppearanceForm from "@/components/settings/AppearanceForm";

export default function SettingsPage() {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-linear-to-b from-background to-muted/40 px-4 py-24 text-center">
      <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
        Settings
      </h1>
      <AppearanceForm />
    </div>
  );
}
