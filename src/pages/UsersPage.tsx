import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/useAuth';
import { usersService } from '@/services/users.service';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, UserCheck, UserX, MoreHorizontal, KeyRound, LogIn, Edit } from 'lucide-react';
import { User, ROLE_LABELS, UserRole } from '@/types';
import { authService } from '@/services/auth.service';
import { useTranslation } from 'react-i18next';

const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'CS_MANAGER', 'CS_AGENT', 'ACC_MANAGER', 'ACC_AGENT', 'ACC_AGENT', 'HR_MANAGER', 'HR_AGENT', 'HR_AGENT', 'WH_MANAGER', 'WH_AGENT'] as const),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password Reset State
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Edit User State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const { toast } = useToast();
  const { t } = useTranslation();

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'CS_AGENT',
    },
  });

  const fetchUsers = async () => {
    const result = await usersService.getAll();
    if (result.success && result.data) {
      setUsers(result.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleActive = async (userId: string, currentIsActive: boolean) => {
    const result = await usersService.toggleActive(userId, currentIsActive);
    if (result.success) {
      fetchUsers();
      toast({ title: t('users_page.messages.status_updated') });
    } else {
      toast({
        variant: 'destructive',
        title: t('users_page.messages.error'),
        description: result.error,
      });
    }
  };

  const handleImpersonate = async (userId: string) => {
    if (!window.confirm(t('users_page.messages.confirm_login'))) return;
    const result = await authService.impersonate(userId);
    if (!result.success) {
      toast({
        variant: 'destructive',
        title: t('users_page.messages.error'),
        description: result.error,
      });
    }
  };

  const handleResetPassword = async () => {
    if (!resettingUserId || newPassword.length < 6) {
      toast({ variant: 'destructive', title: t('users_page.messages.password_length') });
      return;
    }
    setIsResetting(true);
    const result = await usersService.updatePassword(resettingUserId, newPassword);
    if (result.success) {
      toast({ title: t('users_page.messages.success'), description: t('users_page.messages.password_reset_success') });
      setResetModalOpen(false);
      setNewPassword('');
    } else {
      toast({ variant: 'destructive', title: t('users_page.messages.error'), description: result.error });
    }
    setIsResetting(false);
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsEditing(true);
    const result = await usersService.update(editingUser.id, { name: editName, email: editEmail });
    if (result.success) {
      toast({ title: 'Success', description: 'User updated successfully' });
      setEditModalOpen(false);
      setEditingUser(null);
      fetchUsers();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setIsEditing(false);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditModalOpen(true);
  };

  const onSubmit = async (data: CreateUserForm) => {
    setIsSubmitting(true);
    const result = await usersService.create({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role as UserRole,
    });

    if (result.success) {
      toast({
        title: t('users_page.messages.user_created'),
        description: t('users_page.messages.user_created_desc', { name: data.name }),
      });
      form.reset();
      setShowCreateDialog(false);
      fetchUsers();
    } else {
      toast({
        variant: 'destructive',
        title: t('users_page.messages.error'),
        description: result.error,
      });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('users_page.title')}</h1>
          <p className="text-muted-foreground">
            {t('users_page.subtitle')}
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('users_page.new_user')}
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('users_page.table.name')}</TableHead>
              <TableHead>{t('users_page.table.email')}</TableHead>
              <TableHead>{t('users_page.table.role')}</TableHead>
              <TableHead>{t('users_page.table.status')}</TableHead>
              <TableHead>{t('users_page.table.created')}</TableHead>
              <TableHead className="text-right">{t('users_page.table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {t('users_page.table.no_users')}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{ROLE_LABELS[user.role]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? 'default' : 'secondary'}>
                      {user.is_active ? t('users_page.status.active') : t('users_page.status.inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {user.id !== currentUser?.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditModal(user)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(user.id, user.is_active)}>
                            {user.is_active ? <><UserX className="mr-2 h-4 w-4" /> {t('users_page.actions.deactivate')}</> : <><UserCheck className="mr-2 h-4 w-4" /> {t('users_page.actions.activate')}</>}
                          </DropdownMenuItem>
                          {user.is_active && (
                            <DropdownMenuItem onClick={() => handleImpersonate(user.id)}>
                              <LogIn className="mr-2 h-4 w-4" /> {t('users_page.actions.login_as')}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => {
                            setResettingUserId(user.id);
                            setResetModalOpen(true);
                          }}>
                            <KeyRound className="mr-2 h-4 w-4" /> {t('users_page.actions.reset_password')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('users_page.dialogs.create.title')}</DialogTitle>
            <DialogDescription>
              {t('users_page.dialogs.create.desc')}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('users_page.dialogs.create.name')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('users_page.dialogs.create.name_placeholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('users_page.dialogs.create.email')}</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder={t('users_page.dialogs.create.email_placeholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('users_page.dialogs.create.password')}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder={t('users_page.dialogs.create.password_placeholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('users_page.dialogs.create.role')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('users_page.dialogs.create.select_role')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(ROLE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  {t('users_page.dialogs.create.cancel')}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t('users_page.dialogs.create.submitting') : t('users_page.dialogs.create.submit')}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={resetModalOpen} onOpenChange={setResetModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t('users_page.dialogs.reset.title')}</DialogTitle>
            <DialogDescription>
              {t('users_page.dialogs.reset.desc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('users_page.dialogs.reset.new_password')}</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setResetModalOpen(false)}>{t('users_page.dialogs.reset.cancel')}</Button>
            <Button onClick={handleResetPassword} disabled={isResetting || newPassword.length < 6}>
              {isResetting ? t('users_page.dialogs.reset.submitting') : t('users_page.dialogs.reset.submit')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
            <DialogDescription>Update the name and email of this user.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUserSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                minLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isEditing}>
                {isEditing ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
