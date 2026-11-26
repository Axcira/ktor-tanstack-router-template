import { createFileRoute, redirect } from "@tanstack/react-router";
import { checkPermission } from "@/lib/permissions";
import { ProductMasterTable } from "./-components/products/ProductMasterTable";

export const Route = createFileRoute("/_app/masters/products")({
  beforeLoad: async ({ context }) => {
    if (
      !context.session ||
      !(await checkPermission(context.session, {
        type: "ManageMasters",
        masterId: "products",
      }))
    ) {
      throw redirect({ to: "/masters" });
    }
  },
  component: ProductMasterTable,
});
