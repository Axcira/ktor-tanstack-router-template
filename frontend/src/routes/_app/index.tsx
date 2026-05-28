import { createFileRoute } from "@tanstack/react-router"

import DashboardPage from "@/features/dashboard/components/DashboardPage";

export const Route = createFileRoute("/_app/")({
  component: DashboardPage,
})
