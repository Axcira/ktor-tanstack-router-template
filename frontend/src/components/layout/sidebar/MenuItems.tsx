import {
    BookOpen,
    Bot,
    Settings2,
} from "lucide-react";
import type * as React from "react";

export interface MenuItem {
  text: string;
  icon?: React.ReactNode;
  children?: MenuItem[];
  to?: string;
}

const menuItems: MenuItem[] = [{
  text: "Articles", icon: <Bot/>, children: [{
    text: "Some Item 1",
    to: "/playground/nav1-1",
    children: [{text: "Sub Item 1-1", to: "/playground/nav1-1-1"}, {text: "Sub Item 1-2", to: "/playground/nav1-1-2"}],
  }, {text: "Some Item 2", to: "/playground/nav1-2"}],
}, {text: "Settings", to: "/settings", icon: <Settings2/>}, {text: "Documentation", to: "/documentation", icon: <BookOpen/>}]

export default menuItems
