import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import { notificationsService } from '@/services/notifications.service';
import { Notification, ROLE_LABELS } from '@/types';
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

const navItems = [
  {
    title: 'Dashboard',
    url: '/',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'CS_MANAGER', 'CS_AGENT', 'ACC_MANAGER', 'ACC_CLERK', 'HR_MANAGER', 'HR_ASSISTANT', 'WH_MANAGER']
  },
  {
    title: 'Tickets',
    url: '/tickets',
    icon: Ticket,
    roles: ['ADMIN', 'CS_MANAGER', 'CS_AGENT']
  },
  {
    title: 'Orders',
    url: '/orders',
    icon: ShoppingCart,
    roles: ['ADMIN', 'CS_MANAGER', 'CS_AGENT', 'WH_MANAGER', 'WH_AGENT', 'ACC_MANAGER', 'HR_MANAGER']
  },
  {
    title: 'Users',
    url: '/users',
    icon: Users,
    roles: ['ADMIN']
  },
  {
    title: 'Purchases',
    url: '/accounting/purchases',
    icon: DollarSign,
    roles: ['ADMIN', 'ACC_MANAGER', 'ACC_CLERK']
  },
  {
    title: 'Vendors',
    url: '/accounting/vendors',
    icon: Users,
    roles: ['ADMIN', 'ACC_MANAGER', 'ACC_CLERK']
  },
  {
    title: 'Expenses',
    url: '/accounting/expenses',
    icon: CreditCard,
    roles: ['ADMIN', 'ACC_MANAGER', 'ACC_CLERK']
  },
  {
    title: 'Review Deductions',
    url: '/accounting/review-deductions',
    icon: Banknote,
    roles: ['ADMIN', 'ACC_MANAGER']
  },
  {
    title: 'Deposits',
    url: '/accounting/deposits',
    icon: Banknote,
    roles: ['ADMIN', 'ACC_MANAGER']
  },
  {
    title: 'Payroll',
    url: '/accounting/payroll',
    icon: Banknote,
    roles: ['ADMIN', 'ACC_MANAGER']
  },
  {
    title: 'Transfers',
    url: '/accounting/transfers',
    icon: Banknote,
    roles: ['ADMIN', 'ACC_MANAGER']
  },
  {
    title: 'Advances',
    url: '/accounting/advances',
    icon: Banknote,
    roles: ['ADMIN', 'ACC_MANAGER', 'ACC_CLERK']
  },
  {
    title: 'Employees',
    url: '/hr/employees',
    icon: Users,
    roles: ['ADMIN', 'HR_MANAGER', 'HR_ASSISTANT']
  },
  {
    title: 'Adjustments',
    url: '/hr/adjustments',
    icon: List,
    roles: ['ADMIN', 'HR_MANAGER', 'HR_ASSISTANT']
  },
  {
    title: 'Attendance',
    url: '/hr/attendance',
    icon: List,
    roles: ['ADMIN', 'HR_MANAGER', 'HR_ASSISTANT']
  },
  {
    title: 'Leaves',
    url: '/hr/leaves',
    icon: List,
    roles: ['ADMIN', 'HR_MANAGER', 'HR_ASSISTANT']
  },
  {
    title: 'Shipping',
    url: '/shipping',
    icon: Ticket,
    roles: ['ADMIN', 'WH_MANAGER']
  },
  {
    title: 'Reasons',
    url: '/admin/ticket-reasons',
    icon: List,
    roles: ['ADMIN']
  },
  {
    title: 'My KPIs',
    url: '/kpi',
    icon: Target,
    roles: ['ADMIN', 'CS_MANAGER', 'CS_AGENT', 'ACC_MANAGER', 'ACC_CLERK', 'HR_MANAGER', 'HR_ASSISTANT', 'WH_MANAGER', 'WH_AGENT']
  },
  {
    title: 'Team KPIs',
    url: '/team-kpi',
    icon: TrendingUp,
    roles: ['ADMIN', 'CS_MANAGER', 'ACC_MANAGER', 'HR_MANAGER', 'WH_MANAGER']
  },
  {
    title: 'Gamification',
    url: '/gamification',
    icon: Trophy,
    roles: ['ADMIN', 'CS_MANAGER', 'CS_AGENT', 'ACC_MANAGER', 'ACC_CLERK', 'HR_MANAGER', 'HR_ASSISTANT', 'WH_MANAGER', 'WH_AGENT']
  },
];

function AppSidebarContent() {
  const location = useLocation();
  const { user } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const filteredNavItems = navItems.filter(
    item => user && item.roles.includes(user.role)
  );

  return (
    <>
      <SidebarHeader className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary p-1.5">
            <Ticket className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-lg">TMS</span>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url ||
                      (item.url !== '/' && location.pathname.startsWith(item.url))}
                  >
                    <Link to={item.url}>
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

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
            <DropdownMenuItem disabled>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
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
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon">
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
