import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LeavesPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Leaves</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Leave Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        Leaves module is under construction.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
