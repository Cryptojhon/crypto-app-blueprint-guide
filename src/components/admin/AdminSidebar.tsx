
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Activity, Settings } from 'lucide-react';

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/admin/dashboard"
  },
  {
    title: "Users",
    icon: Users,
    path: "/admin/users"
  },
  {
    title: "Transactions",
    icon: Activity,
    path: "/admin/transactions"
  },
  {
    title: "Reports",
    icon: FileText,
    path: "/admin/reports"
  },
  {
    title: "Settings",
    icon: Settings,
    path: "/admin/settings"
  }
];

export function AdminSidebar() {
  const navigate = useNavigate();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin Panel</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton onClick={() => navigate(item.path)}>
                    <item.icon className="w-4 h-4 mr-2" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
