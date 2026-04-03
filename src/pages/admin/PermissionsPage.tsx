import { useState, useEffect } from 'react';
import { 
  permissionsService, 
  PermissionDetail, 
  UserPermissions 
} from '@/services/permissions.service';
import { usersService } from '@/services/users.service';
import { User, UserRole, ROLE_LABELS } from '@/types';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search, 
  Shield, 
  ShieldCheck, 
  ShieldX,
  Loader2,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/useAuth';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export default function PermissionsPage() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionDetail[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPerms, setUserPerms] = useState<UserPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPermsLoading, setIsPermsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const [usersRes, permsRes] = await Promise.all([
        usersService.findAll(),
        permissionsService.getAll(),
      ]);
      if (usersRes.success && usersRes.data) setUsers(usersRes.data);
      if (permsRes.success && permsRes.data) setAllPermissions(permsRes.data);
      setIsLoading(false);
    };
    init();
  }, []);

  const handleSelectUser = async (user: User) => {
    setSelectedUser(user);
    setIsPermsLoading(true);
    const res = await permissionsService.getUserPermissions(user.id);
    if (res.success && res.data) {
      setUserPerms(res.data);
    }
    setIsPermsLoading(false);
  };

  const handleUpdateOverride = async (key: string, effect: 'ALLOW' | 'DENY' | 'RESET') => {
    if (!selectedUser) return;

    let res;
    if (effect === 'RESET') {
      res = await permissionsService.removeOverride(selectedUser.id, key);
    } else {
      res = await permissionsService.updateOverride(selectedUser.id, key, effect);
    }

    if (res.success) {
      const updatedRes = await permissionsService.getUserPermissions(selectedUser.id);
      if (updatedRes.success && updatedRes.data) {
        setUserPerms(updatedRes.data);
      }
      toast({
        title: "Permission Updated",
        description: `Successfully updated ${key} for ${selectedUser.name}`,
      });
    } else {
      toast({
        title: "Update Failed",
        description: res.error,
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPermissionStatus = (key: string) => {
    if (!userPerms) return { type: 'NONE', label: 'None' };
    
    const override = userPerms.overrides.find(o => o.key === key);
    const isFromRole = userPerms.role_permissions.includes(key);

    if (override?.effect === 'DENY') return { type: 'DENY', label: 'Denied (Override)' };
    if (override?.effect === 'ALLOW') return { type: 'ALLOW', label: 'Allowed (Override)' };
    if (isFromRole) return { type: 'ROLE', label: 'Allowed (Role)' };
    
    return { type: 'NONE', label: 'None' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Permissions Management</h2>
          <p className="text-muted-foreground">Manage granular user permissions and overrides.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-4 flex flex-col max-h-[800px]">
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Select a user to manage</CardDescription>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto">
              <div className="divide-y">
                {filteredUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleSelectUser(u)}
                    className={cn(
                      "w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-center justify-between",
                      selectedUser?.id === u.id && "bg-primary/5 border-l-4 border-primary"
                    )}
                  >
                    <div>
                      <p className="font-medium text-sm">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {ROLE_LABELS[u.role as UserRole]}
                    </Badge>
                  </button>
                ))}
              </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-8 flex flex-col max-h-[800px]">
          <CardHeader className="flex flex-row items-center justify-between shrink-0">
            <div>
              <CardTitle>
                {selectedUser ? `Permissions for ${selectedUser.name}` : 'Select a user'}
              </CardTitle>
              {selectedUser && (
                <CardDescription>
                  Base Role: {ROLE_LABELS[selectedUser.role as UserRole]}
                </CardDescription>
              )}
            </div>
            {isPermsLoading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            {!selectedUser ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4">
                <Shield className="h-12 w-12 opacity-20" />
                <p>Select a user from the list to view and manage permissions.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-4 p-4 bg-muted/30 rounded-lg text-xs">
                  <div className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-green-500" /> From Role</div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-blue-500" /> Allow Override</div>
                  <div className="flex items-center gap-1.5"><XCircle className="h-4 w-4 text-red-500" /> Deny Override</div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Permission</TableHead>
                      <TableHead>Domain</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allPermissions.map((permission) => {
                      const status = getPermissionStatus(permission.key);
                      return (
                        <TableRow key={permission.key}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm font-mono">{permission.key}</span>
                              <span className="text-xs text-muted-foreground">{permission.description}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize">
                              {permission.domain}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {status.type === 'ROLE' && <ShieldCheck className="h-4 w-4 text-green-500" />}
                              {status.type === 'ALLOW' && <CheckCircle2 className="h-4 w-4 text-blue-500" />}
                              {status.type === 'DENY' && <XCircle className="h-4 w-4 text-red-500" />}
                              {status.type === 'NONE' && <ShieldX className="h-4 w-4 text-muted-foreground opacity-30" />}
                              <span className={cn(
                                "text-xs font-medium",
                                status.type === 'ROLE' && "text-green-600",
                                status.type === 'ALLOW' && "text-blue-600",
                                status.type === 'DENY' && "text-red-600",
                              )}>
                                {status.label}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn("h-8 px-2", status.type === 'ALLOW' && "bg-blue-50")}
                                onClick={() => handleUpdateOverride(permission.key, 'ALLOW')}
                                title="Set Allow Override"
                              >
                                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn("h-8 px-2", status.type === 'DENY' && "bg-red-50")}
                                onClick={() => handleUpdateOverride(permission.key, 'DENY')}
                                title="Set Deny Override"
                              >
                                <XCircle className="h-4 w-4 text-red-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2"
                                onClick={() => handleUpdateOverride(permission.key, 'RESET')}
                                title="Reset to Role Default"
                              >
                                <Shield className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
