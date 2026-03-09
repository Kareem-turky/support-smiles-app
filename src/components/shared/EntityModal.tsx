import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import React from 'react';

interface EntityModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    footer?: React.ReactNode; // Custom footer if needed
    onSubmit?: (e: React.FormEvent) => Promise<void>;
    loading?: boolean;
    submitLabel?: string;
    width?: string;
}

export function EntityModal({
    open,
    onOpenChange,
    title,
    description,
    children,
    footer,
    onSubmit,
    loading = false,
    submitLabel = 'Save',
    width = 'sm:max-w-[425px]',
}: EntityModalProps) {
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (onSubmit) {
            await onSubmit(e);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={width}>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        {description && <DialogDescription>{description}</DialogDescription>}
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {children}
                    </div>

                    <DialogFooter>
                        {footer ? (
                            footer
                        ) : (
                            <div className="flex justify-end gap-2 w-full">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {submitLabel}
                                </Button>
                            </div>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
