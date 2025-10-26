import { ReactNode, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Building2, LayoutDashboard, Users, Home, FileText, LogOut, User, AlertTriangle, UserCog, ClipboardCheck, ClipboardList, Menu } from 'lucide-react';

export function AppLayout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b bg-card">
        <div className="flex items-center justify-between px-4 md:px-6 py-3">
          <div className="flex items-center gap-4 md:gap-6">
            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden"
                  data-testid="button-mobile-menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2 text-left">
                    <Building2 className="h-5 w-5 text-primary" />
                    AccomPro
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-2 mt-6">
                  {navigation.map((item) => {
                    const isActive = location === item.href || 
                      (item.href !== '/' && location.startsWith(item.href));
                    return (
                      <Button
                        key={item.name}
                        variant={isActive ? 'secondary' : 'ghost'}
                        className="justify-start gap-3"
                        onClick={() => {
                          setLocation(item.href);
                          setMobileMenuOpen(false);
                        }}
                        data-testid={`nav-mobile-${item.name.toLowerCase()}`}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.name}
                      </Button>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>

            <div
              className="flex items-center gap-2 text-lg md:text-xl font-bold hover-elevate active-elevate-2 px-2 py-1 rounded-md cursor-pointer"
              onClick={() => setLocation('/')}
            >
              <Building2 className="h-5 w-6 text-primary" />
              <span>AccomPro</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex gap-1">
              {navigation.map((item) => {
                const isActive = location === item.href || 
                  (item.href !== '/' && location.startsWith(item.href));
                return (
                  <Button
                    key={item.name}
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="sm"
                    className="gap-2"
                    onClick={() => setLocation(item.href)}
                    data-testid={`nav-${item.name.toLowerCase()}`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Button>
                );
              })}
            </nav>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2" data-testid="button-user-menu">
                <User className="h-4 w-4" />
                <span className="hidden md:inline">{user?.firstName} {user?.lastName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  <p className="text-xs text-muted-foreground">Role: {user?.role}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} data-testid="button-logout">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>
    </div>
  );
}
