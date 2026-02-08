import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ReactNode } from 'react';

interface ContentCardProps {
    title?: string;
    description?: string;
    children: ReactNode;
    className?: string;
    action?: ReactNode;
}

export function ContentCard({ title, description, children, className, action }: ContentCardProps) {
    return (
        <Card className={className}>
            {(title || description || action) && (
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                        {title && <CardTitle>{title}</CardTitle>}
                        {description && <CardDescription>{description}</CardDescription>}
                    </div>
                    {action && <div>{action}</div>}
                </CardHeader>
            )}
            <CardContent className="pt-6">
                {children}
            </CardContent>
        </Card>
    );
}
