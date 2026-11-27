import type { Permission } from "@/api/generated/schemas";

export const MASTER_TABS = [
  {
    id: "tags",
    label: "タグ",
    to: "/masters/tags",
    permission: { type: "ManageMasters", masterId: "tags" },
  },
  {
    id: "customers",
    label: "顧客",
    to: "/masters/customers",
    permission: { type: "ManageMasters", masterId: "customers" },
  },
  {
    id: "products",
    label: "製品",
    to: "/masters/products",
    permission: { type: "ManageMasters", masterId: "products" },
  },
] as const satisfies readonly {
  id: string;
  label: string;
  to: "/masters/tags" | "/masters/customers" | "/masters/products";
  permission: Permission;
}[];

export type MasterTab = (typeof MASTER_TABS)[number];
