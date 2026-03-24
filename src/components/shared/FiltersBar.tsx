import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Search } from 'lucide-react';
import { ReactNode } from 'react';

interface FiltersBarProps {
    onSearch?: (query: string) => void;
    searchValue?: string;
    searchPlaceholder?: string;
    children?: ReactNode; // For additional filters (selects, dates)
    onReset?: () => void;
    className?: string;
}

export function FiltersBar({
    onSearch,
    searchValue,
    searchPlaceholder = "Search...",
    children,
    onReset,
    className
}: FiltersBarProps) {
    return (
        <div className={`flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between ${className}`}>
            <div className="flex flex-1 items-center gap-2 w-full">
                {onSearch && (
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchValue || ''}
                            onChange={(e) => onSearch(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                )}
                {children}
                {onReset && (
                    <Button variant="ghost" size="sm" onClick={onReset} className="h-8 lg:flex">
                        <X className="mr-2 h-4 w-4" />
                        Reset
                    </Button>
                )}
            </div>
        </div>
    );
}
