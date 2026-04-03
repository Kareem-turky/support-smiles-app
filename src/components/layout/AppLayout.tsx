import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import { notificationsService } from '@/services/notifications.service';
import { Notification, ROLE_LABELS } from '@/types';
import { useTranslation } from 'react-i18next';
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
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Ticket,
  LayoutDashboard,
  Users,
  Bell,
  Search,
  ChevronDown,
  LogOut,
  User,
  Menu,
  CheckCheck,
  DollarSign,
  CreditCard,
  Banknote,
  List,
  ShoppingCart,
  TrendingUp,
  Trophy,
  Target,
  Award,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const mainNavItems = [
  { titleKey: 'nav.dashboard', url: '/', icon: LayoutDashboard, permission: 'dashboard:view' },
  { titleKey: 'nav.tickets', url: '/tickets', icon: Ticket, permission: 'tickets:tickets:read' },
  { titleKey: 'accounting.purchases', url: '/accounting/purchases', icon: DollarSign, permission: 'accounting:purchases:read' },
  { titleKey: 'accounting.vendors', url: '/accounting/vendors', icon: Users, permission: 'accounting:vendors:read' },
  { titleKey: 'accounting.expenses', url: '/accounting/expenses', icon: CreditCard, permission: 'accounting:expenses:read' },
  { titleKey: 'accounting.deductions', url: '/accounting/review-deductions', icon: Banknote, permission: 'accounting:deductions:read' },
  { titleKey: 'accounting.deposits', url: '/accounting/deposits', icon: Banknote, permission: 'accounting:deposits:read' },
  { titleKey: 'accounting.payroll', url: '/accounting/payroll', icon: Banknote, permission: 'accounting:payroll:read' },
  { titleKey: 'accounting.transfers', url: '/accounting/transfers', icon: Banknote, permission: 'accounting:transfers:read' },
  { titleKey: 'accounting.advances', url: '/accounting/advances', icon: Banknote, permission: 'accounting:advances:read' },
  { titleKey: 'hr.employees', url: '/hr/employees', icon: Users, permission: 'hr:employees:read' },
  { titleKey: 'hr.adjustments', url: '/hr/adjustments', icon: List, permission: 'hr:adjustments:read' },
  { titleKey: 'hr.leaves', url: '/hr/leaves', icon: Target, permission: 'hr:leaves:read' },
  { titleKey: 'nav.kpi', url: '/kpi', icon: Target, permission: 'kpi:metrics:read' },
  { titleKey: 'nav.team', url: '/team-kpi', icon: TrendingUp, permission: 'kpi:metrics:read' },
  { titleKey: 'nav.gamification', url: '/gamification', icon: Trophy, permission: 'dashboard:view' },
];


const settingsNavItems = [
  { titleKey: 'nav.admin.shipping_companies', url: '/shipping', icon: ShoppingCart, permission: 'shipping:companies:manage' },
  { titleKey: 'nav.admin.ticket_reasons', url: '/admin/ticket-reasons', icon: List, permission: 'tickets:reasons:manage' },
  { titleKey: 'nav.admin.kpi_types', url: '/admin/kpi-types', icon: Target, permission: 'kpi:metrics:manage' },
];

const securityNavItems = [
  { titleKey: 'nav.admin.permissions', url: '/admin/permissions', icon: CheckCheck, permission: 'security:permissions:manage' },
];


function AppSidebarContent() {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, can } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const filteredMainNavItems = mainNavItems.filter(
    item => user && can(item.permission)
  );
  const filteredSettingsNavItems = settingsNavItems.filter(
    item => user && can(item.permission)
  );
  const filteredSecurityNavItems = securityNavItems.filter(
    item => user && can(item.permission)
  );


  return (
    <>
      <SidebarHeader className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary p-1.5">
            <Ticket className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-lg">Fulfly ticket System</span>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMainNavItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url ||
                      (item.url !== '/' && location.pathname.startsWith(item.url))}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.titleKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {filteredSettingsNavItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Settings & Configuration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredSettingsNavItems.map((item) => (
                  <SidebarMenuItem key={item.titleKey}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.url ||
                        (item.url !== '/' && location.pathname.startsWith(item.url))}
                    >
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{t(item.titleKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {filteredSecurityNavItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Security & Access</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredSecurityNavItems.map((item) => (
                  <SidebarMenuItem key={item.titleKey}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.url ||
                        (item.url !== '/' && location.pathname.startsWith(item.url))}
                    >
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{t(item.titleKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

    </>
  );
}

function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    const [notifResult, countResult] = await Promise.all([
      notificationsService.getAll(),
      notificationsService.getUnreadCount(),
    ]);
    if (notifResult.success && notifResult.data) {
      setNotifications(notifResult.data.slice(0, 10));
    }
    if (countResult.success && countResult.data !== undefined) {
      setUnreadCount(countResult.data);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await notificationsService.markAsRead(notification.id);
      fetchNotifications();
    }
    setIsOpen(false);
    navigate(notification.link);
  };

  const handleMarkAllRead = async () => {
    await notificationsService.markAllAsRead();
    fetchNotifications();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="h-auto py-1 px-2 text-xs"
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    'w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors',
                    !notification.is_read && 'bg-primary/5'
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!notification.is_read && (
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                    )}
                    <div className={cn(!notification.is_read ? '' : 'ml-4')}>
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.body}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function TopBar({ onSearch }: { onSearch?: (query: string) => void }) {
  const { t, i18n } = useTranslation();
  const { user, logout, can } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'ar' : 'en');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      navigate(`/tickets?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4">
      <SidebarTrigger>
        <Menu className="h-5 w-5" />
      </SidebarTrigger>

      <div className={cn("px-2 py-0.5 rounded text-xs font-bold border", import.meta.env.VITE_USE_MOCK_API === 'true' ? "bg-yellow-100 text-yellow-800 border-yellow-200" : "bg-green-100 text-green-800 border-green-200")}>
        {import.meta.env.VITE_USE_MOCK_API === 'true' ? 'MOCK' : 'REAL'}
      </div>

      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by order number..."
            className="pl-8 h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </form>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={toggleLanguage} className="font-semibold text-sm">
          {i18n.language === 'en' ? 'عربي' : 'EN'}
        </Button>
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {user?.role && ROLE_LABELS[user.role]}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {can('profile:self:update') && (
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

interface AppLayoutProps {
  children?: React.ReactNode;
  onSearch?: (query: string) => void;
}

export function AppLayout({ children, onSearch }: AppLayoutProps) {
  const { i18n } = useTranslation();
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        <Sidebar collapsible="icon" side={i18n.language === 'ar' ? 'right' : 'left'}>
          <AppSidebarContent />
        </Sidebar>
        <div className="flex-1 flex flex-col">
          <TopBar onSearch={onSearch} />
          <main className="flex-1 overflow-auto p-6">
            {children || <Outlet />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
