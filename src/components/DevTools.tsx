import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/useAuth';
import { UserRole } from '@/types';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ShieldAlert } from 'lucide-react';

const USERS = [
    { role: 'ADMIN', email: 'admin@company.com', pass: 'admin123', name: 'Admin' },
    { role: 'CS_MANAGER', email: 'mike@company.com', pass: 'cs123', name: 'CS Mgr' },
    { role: 'CS_AGENT', email: 'agent@company.com', pass: 'password123', name: 'CS Agent' },
    { role: 'ACC_MANAGER', email: 'sarah@company.com', pass: 'accounting123', name: 'Acc Mgr' },
    { role: 'ACC_AGENT', email: 'clerk@company.com', pass: 'password123', name: 'Acc Clerk' },
    { role: 'HR_MANAGER', email: 'hr@company.com', pass: 'password123', name: 'HR Mgr' },
    { role: 'HR_AGENT', email: 'assist@company.com', pass: 'password123', name: 'HR Assist' },
    { role: 'WH_MANAGER', email: 'warehouse@company.com', pass: 'password123', name: 'WH Mgr' },
];

export function DevTools() {
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    if (!import.meta.env.DEV) return null;

    const handleSwitchUser = async (email: string, pass: string) => {
        setIsLoading(true);
        try {
            await login({ email, password: pass });
            window.location.reload(); // Force reload to clear any stale state guarantees
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="destructive" size="sm" className="shadow-lg gap-2">
                        <ShieldAlert className="h-4 w-4" />
                        {isLoading ? 'Switching...' : 'Dev Tools'}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Switch User Role</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {USERS.map((u) => (
                        <DropdownMenuItem key={u.role} onClick={() => handleSwitchUser(u.email, u.pass)}>
                            <div className="flex flex-col">
                                <span className="font-medium">{u.name}</span>
                                <span className="text-xs text-muted-foreground">{u.role}</span>
                            </div>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
