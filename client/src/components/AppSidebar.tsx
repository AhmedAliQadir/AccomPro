import {
  Home,
  Users,
  Building2,
  FileText,
  Wrench,
  ClipboardCheck,
  DollarSign,
  BarChart3,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Tenants", url: "/tenants", icon: Users },
  { title: "Properties", url: "/properties", icon: Building2 },
  { title: "Cases", url: "/cases", icon: FileText },
  { title: "Maintenance", url: "/maintenance", icon: Wrench },
  { title: "Visits", url: "/visits", icon: ClipboardCheck },
  { title: "Finances", url: "/finances", icon: DollarSign },
  { title: "Reports", url: "/reports", icon: BarChart3 },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">AccomPro</h2>
            <p className="text-xs text-muted-foreground">
              Accommodation Management
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase()}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
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
