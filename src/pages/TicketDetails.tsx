import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ticketsService } from '@/services/tickets.service';
import { usersService } from '@/services/users.service';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Send,
  UserPlus,
  CheckCircle,
  RotateCcw,
  Trash2,
  Clock,
  MessageSquare,
  History,
} from 'lucide-react';
import {
  Ticket,
  TicketMessage,
  TicketEvent,
  User,
  TicketStatus,
  STATUS_LABELS,
  PRIORITY_LABELS,
  ISSUE_TYPE_LABELS,
  STATUS_COLORS,
  PRIORITY_COLORS,
} from '@/types';

export default function TicketDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, canEditTicket, canAssignTicket, canDeleteTicket } = useAuth();
  const { toast } = useToast();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [events, setEvents] = useState<TicketEvent[]>([]);
  const [csUsers, setCsUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');

  const fetchTicketData = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    const [ticketResult, messagesResult, eventsResult, csResult] = await Promise.all([
      ticketsService.getById(id),
      ticketsService.getMessages(id),
      ticketsService.getEvents(id),
      usersService.getCSUsers(),
    ]);

    if (ticketResult.success && ticketResult.data) {
      setTicket(ticketResult.data);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: ticketResult.error || 'Failed to load ticket',
      });
      navigate('/tickets');
      return;
    }

    if (messagesResult.success && messagesResult.data) {
      setMessages(messagesResult.data);
    }
    if (eventsResult.success && eventsResult.data) {
      setEvents(eventsResult.data);
    }
    if (csResult.success && csResult.data) {
      setCsUsers(csResult.data);
      setAllUsers(csResult.data);
    }

    setIsLoading(false);
  }, [id, navigate, toast]);

  useEffect(() => {
    fetchTicketData();
  }, [fetchTicketData]);

  const handleSendMessage = async () => {
    if (!id || !newMessage.trim()) return;

    setIsSending(true);
    const result = await ticketsService.addMessage(id, newMessage.trim());

    if (result.success) {
      setNewMessage('');
      fetchTicketData();
      toast({ title: 'Message sent' });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    }
    setIsSending(false);
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!id) return;

    const result = await ticketsService.changeStatus(id, newStatus);
    if (result.success) {
      fetchTicketData();
      toast({ title: `Status changed to ${STATUS_LABELS[newStatus]}` });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    }
  };

  const handleAssign = async () => {
    if (!id || !selectedAssignee) return;

    const result = await ticketsService.assign(id, selectedAssignee);
    if (result.success) {
      setShowAssignDialog(false);
      setSelectedAssignee('');
      fetchTicketData();
      toast({ title: 'Ticket assigned successfully' });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    }
  };

  const handleResolve = async () => {
    if (!id) return;

    const result = await ticketsService.resolve(id);
    if (result.success) {
      fetchTicketData();
      toast({ title: 'Ticket resolved' });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    }
  };

  const handleReopen = async () => {
    if (!id) return;

    const result = await ticketsService.reopen(id);
    if (result.success) {
      fetchTicketData();
      toast({ title: 'Ticket reopened' });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    const result = await ticketsService.delete(id);
    if (result.success) {
      toast({ title: 'Ticket deleted' });
      navigate('/tickets');
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    }
  };

  const getUserName = (userId: string) => {
    const u = allUsers.find(usr => usr.id === userId);
    return u?.name || 'Unknown User';
  };

  const getEventDescription = (event: TicketEvent): string => {
    const actorName = getUserName(event.actor_id);
    switch (event.event_type) {
      case 'TICKET_CREATED':
        return `${actorName} created this ticket`;
      case 'TICKET_ASSIGNED':
        return `${actorName} assigned ticket to ${event.meta.assigned_to_name || 'someone'}`;
      case 'STATUS_CHANGED':
        return `${actorName} changed status from ${event.meta.from} to ${event.meta.to}`;
      case 'MESSAGE_SENT':
        return `${actorName} sent a message`;
      case 'TICKET_RESOLVED':
        return `${actorName} resolved this ticket`;
      case 'TICKET_REOPENED':
        return `${actorName} reopened this ticket`;
      case 'TICKET_UPDATED':
        return `${actorName} updated ticket details`;
      default:
        return `${actorName} performed an action`;
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!ticket) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Ticket not found</p>
        </div>
      </AppLayout>
    );
  }

  const isResolved = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';
  const canChangeStatus = user?.role === 'ADMIN' ||
    (user?.role === 'CS' && ticket.assigned_to === user.id) ||
    user?.role === 'ACCOUNTING';

  // Status options based on role
  const getStatusOptions = (): TicketStatus[] => {
    if (user?.role === 'CS') {
      return ['IN_PROGRESS', 'WAITING', 'RESOLVED'];
    }
    return ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED', 'REOPENED'];
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/tickets')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{ticket.order_number}</h1>
                <Badge className={STATUS_COLORS[ticket.status]}>
                  {STATUS_LABELS[ticket.status]}
                </Badge>
                <Badge className={PRIORITY_COLORS[ticket.priority]}>
                  {PRIORITY_LABELS[ticket.priority]}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">
                {ticket.courier_company} • {ISSUE_TYPE_LABELS[ticket.issue_type]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canAssignTicket() && (
              <Button variant="outline" onClick={() => setShowAssignDialog(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                {ticket.assigned_to ? 'Reassign' : 'Assign'}
              </Button>
            )}
            {canChangeStatus && !isResolved && (
              <Button variant="default" onClick={handleResolve}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Resolve
              </Button>
            )}
            {canChangeStatus && isResolved && ticket.status !== 'CLOSED' && (
              <Button variant="outline" onClick={handleReopen}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reopen
              </Button>
            )}
            {canDeleteTicket() && (
              <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{ticket.description}</p>
              </CardContent>
            </Card>

            {/* Messages */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Messages ({messages.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Defensive check for messages array */}
                {(!messages || !Array.isArray(messages) || messages.length === 0) ? (
                  <p className="text-muted-foreground text-sm">No messages yet</p>
                ) : (
                  (Array.isArray(messages) ? messages : []).map((msg) => (
                    <div key={msg.id} className="rounded-lg bg-muted/50 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{getUserName(msg.sender_id)}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  ))
                )}

                <Separator />

                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isSending || !newMessage.trim()}
                    className="self-end"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Assigned To</p>
                  <p className="font-medium">
                    {ticket.assigned_to ? getUserName(ticket.assigned_to) : 'Unassigned'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created By</p>
                  <p className="font-medium">{getUserName(ticket.created_by)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {new Date(ticket.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="font-medium">
                    {new Date(ticket.updated_at).toLocaleString()}
                  </p>
                </div>
                {ticket.resolved_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">Resolved At</p>
                    <p className="font-medium">
                      {new Date(ticket.resolved_at).toLocaleString()}
                    </p>
                  </div>
                )}

                {ticket.integration_inbox && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">Source System</p>
                      <Badge variant="outline" className="mt-1">
                        {ticket.integration_inbox.source}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">External ID</p>
                      <p className="font-medium text-xs font-mono mt-1">
                        {ticket.integration_inbox.external_id}
                      </p>
                    </div>
                  </>
                )}

                {canChangeStatus && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Change Status</p>
                      <Select value={ticket.status} onValueChange={(v) => handleStatusChange(v as TicketStatus)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getStatusOptions().map((status) => (
                            <SelectItem key={status} value={status}>
                              {STATUS_LABELS[status]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {events.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No events</p>
                  ) : (
                    events.map((event) => (
                      <div key={event.id} className="flex gap-3 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <p>{getEventDescription(event)}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Assign Dialog */}
      <AlertDialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Assign Ticket</AlertDialogTitle>
            <AlertDialogDescription>
              Select a customer service representative to assign this ticket to.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
            <SelectTrigger>
              <SelectValue placeholder="Select assignee" />
            </SelectTrigger>
            <SelectContent>
              {csUsers.map((csUser) => (
                <SelectItem key={csUser.id} value={csUser.id}>
                  {csUser.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAssign} disabled={!selectedAssignee}>
              Assign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ticket</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this ticket? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
