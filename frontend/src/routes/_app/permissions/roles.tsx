import {
  createFileRoute,
  Outlet,
  redirect,
  type SearchSchemaInput,
} from "@tanstack/react-router";
import { checkPermission } from "@/lib/permissions";

const defaultRoleSearch = {
  page: 1,
  limit: 10,
};

type RoleSearch = {
  page: number;
  limit: number;
};

type RoleSearchInput = {
  page?: number;
  limit?: number;
} & SearchSchemaInput;

export const Route = createFileRoute("/_app/permissions/roles")({
  beforeLoad: async ({ context }) => {
    if (
      !context.session ||
      !(await checkPermission(context.session, { type: "ManageUsers" }))
    ) {
      throw redirect({
        to: "/",
      });
    }
  },
  component: () => <Outlet />,
  validateSearch: (search: RoleSearchInput): RoleSearch => ({
    page: Number(search.page ?? defaultRoleSearch.page),
    limit: Number(search.limit ?? defaultRoleSearch.limit),
  }),
});
