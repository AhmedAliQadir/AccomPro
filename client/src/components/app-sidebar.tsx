import { Building2, LayoutDashboard, Users, Home, FileText, AlertTriangle, UserCog, ClipboardCheck, ClipboardList, Settings } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';
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
} from '@/components/ui/sidebar';

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Tenants', href: '/tenants', icon: Users },
    { name: 'Properties', href: '/properties', icon: Building2 },
    { name: 'Rooms', href: '/rooms', icon: Home },
    { name: 'Staff', href: '/staff', icon: UserCog },
    { name: 'Support Notes', href: '/support-notes', icon: ClipboardList },
    { name: 'Incidents', href: '/incidents', icon: AlertTriangle },
    { name: 'Compliance', href: '/compliance', icon: ClipboardCheck },
    { name: 'Reports', href: '/reports', icon: FileText },
  ];

  const adminNavigation = [
    { name: 'Organization Settings', href: '/organization-settings', icon: Settings, roles: ['ADMIN', 'OPS'] },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <div
          className="flex items-center gap-2 text-lg font-bold cursor-pointer hover-elevate active-elevate-2 px-2 py-1 rounded-md"
          onClick={() => setLocation('/')}
          data-testid="sidebar-logo"
        >
          <Building2 className="h-5 w-5 text-primary" />
          <span>AccommodateME</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive = location === item.href || 
                  (item.href !== '/' && location.startsWith(item.href));
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild
                      isActive={isActive}
                      data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <button onClick={() => setLocation(item.href)} className="w-full">
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {user && (user.role === 'ADMIN' || user.role === 'OPS') && (
          <SidebarGroup>
            <SidebarGroupLabel>Settings</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavigation.map((item) => {
                  const isActive = location === item.href;
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton 
                        asChild
                        isActive={isActive}
                        data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <button onClick={() => setLocation(item.href)} className="w-full">
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
