import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ReactNode } from 'react';
import { Loader2, Inbox } from 'lucide-react';

interface Column<T> {
    header: string;
    accessorKey?: keyof T;
    cell?: (item: T) => ReactNode;
    className?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    isLoading?: boolean;
    emptyMessage?: string;
    onRowClick?: (item: T) => void;
}

export function DataTable<T extends { id: string | number }>({
    data,
    columns,
    isLoading,
    emptyMessage = "No data found.",
    onRowClick
}: DataTableProps<T>) {

    if (isLoading) {
        return (
            <div className="rounded-md border p-8 flex justify-center items-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="rounded-md border p-12 flex flex-col justify-center items-center text-muted-foreground space-y-3">
                <Inbox className="h-10 w-10 opacity-50" />
                <p>{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        {columns.map((col, idx) => (
                            <TableHead key={idx} className={col.className}>
                                {col.header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((item) => (
                        <TableRow
                            key={item.id}
                            onClick={() => onRowClick && onRowClick(item)}
                            className={onRowClick ? "cursor-pointer" : ""}
                        >
                            {columns.map((col, idx) => (
                                <TableCell key={idx} className={col.className}>
                                    {col.cell
                                        ? col.cell(item)
                                        : col.accessorKey
                                            ? (item[col.accessorKey] as ReactNode)
                                            : null
                                    }
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
