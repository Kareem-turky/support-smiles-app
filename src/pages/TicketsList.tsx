import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import { ticketsService } from '@/services/tickets.service';
import { usersService } from '@/services/users.service';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Card } from '@/components/ui/card';
import { Plus, Filter, X } from 'lucide-react';
import {
  Ticket,
  User,
  TicketStatus,
  Priority,
  IssueType,
  STATUS_LABELS,
  PRIORITY_LABELS,
  ISSUE_TYPE_LABELS,
  STATUS_COLORS,
  PRIORITY_COLORS,
  TicketFilters,
} from '@/types';
import { CreateTicketDialog } from '@/components/tickets/CreateTicketDialog';

export default function TicketsList() {
  const { user, hasRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<IssueType | 'all'>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

  const fetchUsers = useCallback(async () => {
    const result = await usersService.getCSUsers();
    if (result.success && result.data) {
      setUsers(result.data);
    }
  }, []);

  const fetchTickets = useCallback(async (searchQuery?: string) => {
    setIsLoading(true);

    const filters: TicketFilters = {};
    if (statusFilter !== 'all') filters.status = [statusFilter];
    if (priorityFilter !== 'all') filters.priority = [priorityFilter];
    if (typeFilter !== 'all') filters.issue_type = [typeFilter];
    if (assigneeFilter !== 'all') filters.assigned_to = assigneeFilter;
    if (searchQuery) filters.search = searchQuery;

    const result = await ticketsService.getAll(filters, page, 10);

    if (result.success && result.data) {
      setTickets(result.data.data);
      setTotalPages(result.data.totalPages);
      setTotal(result.data.total);
    }
    setIsLoading(false);
  }, [page, statusFilter, priorityFilter, typeFilter, assigneeFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const search = searchParams.get('search') || '';
    fetchTickets(search);
  }, [fetchTickets, searchParams]);

  const handleSearch = (query: string) => {
    setSearchParams(query ? { search: query } : {});
    setPage(1);
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setPriorityFilter('all');
    setTypeFilter('all');
    setAssigneeFilter('all');
    setSearchParams({});
    setPage(1);
  };

  const hasActiveFilters = statusFilter !== 'all' || priorityFilter !== 'all' ||
    typeFilter !== 'all' || assigneeFilter !== 'all' || searchParams.get('search');

  const getUserName = (userId: string | null) => {
    if (!userId) return 'Unassigned';
    const u = users.find(usr => usr.id === userId);
    return u?.name || 'Unknown';
  };

  const handleTicketCreated = () => {
    setShowCreateDialog(false);
    fetchTickets(searchParams.get('search') || '');
  };

  return (
    <AppLayout onSearch={handleSearch}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tickets</h1>
            <p className="text-muted-foreground">
              {total} ticket{total !== 1 ? 's' : ''} found
            </p>
          </div>
          {hasRole(['ADMIN', 'ACCOUNTING']) && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Ticket
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="h-4 w-4 text-muted-foreground" />

            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as TicketStatus | 'all'); setPage(1); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v as Priority | 'all'); setPage(1); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v as IssueType | 'all'); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(ISSUE_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasRole(['ADMIN', 'ACCOUNTING']) && (
              <Select value={assigneeFilter} onValueChange={(v) => { setAssigneeFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-1 h-3 w-3" />
                Clear
              </Button>
            )}
          </div>
        </Card>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Courier</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No tickets found
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <Link
                        to={`/tickets/${ticket.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {ticket.order_number}
                      </Link>
                    </TableCell>
                    <TableCell>{ticket.courier_company}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {ISSUE_TYPE_LABELS[ticket.issue_type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={PRIORITY_COLORS[ticket.priority]}>
                        {PRIORITY_LABELS[ticket.priority]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[ticket.status]}>
                        {STATUS_LABELS[ticket.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{getUserName(ticket.assigned_to)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(ticket.updated_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <PaginationItem key={p}>
                  <PaginationLink
                    onClick={() => setPage(p)}
                    isActive={page === p}
                    className="cursor-pointer"
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      <CreateTicketDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreated={handleTicketCreated}
      />
    </AppLayout>
  );
}
