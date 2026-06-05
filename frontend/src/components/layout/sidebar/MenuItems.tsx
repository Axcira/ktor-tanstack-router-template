import { BookOpen, FileText, LayoutDashboard, Settings2 } from "lucide-react";
import type * as React from "react";
import type { Permission } from "@/api/generated/schemas";

export interface MenuItem {
  text: string;
  icon?: React.ReactNode;
  children?: MenuItem[];
  to?: string;
  requiredPermission?: Permission;
}

const menuItems: MenuItem[] = [
  {
    text: "Dashboard",
    icon: <LayoutDashboard />,
    to: "/",
  },
  {
    text: "Articles",
    icon: <FileText />,
    children: [
      {
        text: "List",
        to: "/articles",
      },
      {
        text: "Create",
        to: "/articles/create",
        requiredPermission: { type: "CreateArticle" },
      },
    ],
  },
  {
    text: "Settings",
    to: "/settings",
    icon: <Settings2 />,
  },
  {
    text: "Documentation",
    to: "/documentation",
    icon: <BookOpen />,
  },
  {
    text:"Administration",
    icon: <Settings2 />,
    requiredPermission: { type: "Administrator" },
    children: [
      {
        text: "Users",
        to: "/permissions/users",

      },
      {
        text: "Roles",
        to: "/permissions/roles",
      }
    ]
  }
];

export default menuItems;
