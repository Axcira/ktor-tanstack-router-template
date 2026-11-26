import { createFileRoute, redirect } from "@tanstack/react-router";
import { checkPermission } from "@/lib/permissions";
import { CustomerMasterTable } from "./-components/customers/CustomerMasterTable";

export const Route = createFileRoute("/_app/masters/customers")({
  beforeLoad: async ({ context }) => {
    if (
      !context.session ||
      !(await checkPermission(context.session, {
        type: "ManageMasters",
        masterId: "customers",
      }))
    ) {
      throw redirect({ to: "/masters" });
    }
  },
  component: CustomerMasterTable,
});
