import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

export interface KPICardData {
    title: string;
    value: string | number;
    icon: LucideIcon;
    description?: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
}

interface KPICardsProps {
    cards: KPICardData[];
}

export function KPICards({ cards }: KPICardsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((card, index) => (
                <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {card.title}
                        </CardTitle>
                        <card.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{card.value}</div>
                        {(card.description || card.trendValue) && (
                            <p className="text-xs text-muted-foreground">
                                {card.trendValue && (
                                    <span className={
                                        card.trend === 'up' ? 'text-green-500 mr-1' :
                                            card.trend === 'down' ? 'text-red-500 mr-1' : ''
                                    }>
                                        {card.trendValue}
                                    </span>
                                )}
                                {card.description}
                            </p>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
