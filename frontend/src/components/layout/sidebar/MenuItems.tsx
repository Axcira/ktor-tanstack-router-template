import {
    BookOpen,
    FileText,
    LayoutDashboard,
    Settings2,
} from "lucide-react";
import type * as React from "react";

export interface MenuItem {
  text: string;
  icon?: React.ReactNode;
  children?: MenuItem[];
  to?: string;
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
      }
    ]
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
];

export default menuItems;
