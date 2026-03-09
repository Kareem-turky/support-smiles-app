import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
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
import { useTranslation } from 'react-i18next';
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
  const { user, canEditTicket, canAssignTicket, canDeleteTicket, hasRole } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

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
        description: ticketResult.error || t('ticket_details.messages.fetch_error'),
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
  }, [id, navigate, toast, t]);

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
      toast({ title: t('ticket_details.messages.sent') });
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
      toast({ title: t('ticket_details.messages.status_changed', { status: STATUS_LABELS[newStatus] }) });
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
      toast({ title: t('ticket_details.messages.assigned') });
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
      toast({ title: t('ticket_details.messages.resolved') });
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
      toast({ title: t('ticket_details.messages.reopened') });
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
      toast({ title: t('ticket_details.messages.deleted') });
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
    return u?.name || t('ticket_details.unknown_user');
  };

  const getEventDescription = (event: TicketEvent): string => {
    const actorName = getUserName(event.actor_id);
    switch (event.event_type) {
      case 'TICKET_CREATED':
        return t('ticket_details.events.created', { actor: actorName });
      case 'TICKET_ASSIGNED':
        return t('ticket_details.events.assigned', { actor: actorName, target: event.meta.assigned_to_name || 'someone' });
      case 'STATUS_CHANGED':
        return t('ticket_details.events.changed_status', { actor: actorName, from: event.meta.from, to: event.meta.to });
      case 'MESSAGE_SENT':
        return t('ticket_details.events.sent_message', { actor: actorName });
      case 'TICKET_RESOLVED':
        return t('ticket_details.events.resolved', { actor: actorName });
      case 'TICKET_REOPENED':
        return t('ticket_details.events.reopened', { actor: actorName });
      case 'TICKET_UPDATED':
        return t('ticket_details.events.updated', { actor: actorName });
      default:
        return t('ticket_details.events.action', { actor: actorName });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('ticket_details.not_found')}</p>
      </div>
    );
  }

  const isResolved = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';
  const canChangeStatus = hasRole(['ADMIN']) ||
    (hasRole(['CS_MANAGER', 'CS_AGENT']) && ticket.assigned_to === user?.id) ||
    hasRole(['ACC_MANAGER', 'ACC_AGENT']);

  // Status options based on role
  const getStatusOptions = (): TicketStatus[] => {
    if (hasRole(['CS_MANAGER', 'CS_AGENT'])) {
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
                {ticket.courier_company} • {ISSUE_TYPE_LABELS[ticket.issue_type]} {ticket.reason ? `• ${ticket.reason.name}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canAssignTicket() && (
              <Button variant="outline" onClick={() => setShowAssignDialog(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                {ticket.assigned_to ? t('ticket_details.buttons.reassign') : t('ticket_details.buttons.assign')}
              </Button>
            )}
            {canChangeStatus && !isResolved && (
              <Button variant="default" onClick={handleResolve}>
                <CheckCircle className="mr-2 h-4 w-4" />
                {t('ticket_details.buttons.resolve')}
              </Button>
            )}
            {canChangeStatus && isResolved && ticket.status !== 'CLOSED' && (
              <Button variant="outline" onClick={handleReopen}>
                <RotateCcw className="mr-2 h-4 w-4" />
                {t('ticket_details.buttons.reopen')}
              </Button>
            )}
            {canDeleteTicket() && (
              <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                {t('ticket_details.buttons.delete')}
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
                <CardTitle className="text-lg">{t('ticket_details.cards.description')}</CardTitle>
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
                  {t('ticket_details.messages_count', { count: messages.length })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Defensive check for messages array */}
                {(!messages || !Array.isArray(messages) || messages.length === 0) ? (
                  <p className="text-muted-foreground text-sm">{t('ticket_details.no_messages')}</p>
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
                    placeholder={t('ticket_details.type_message')}
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
                <CardTitle className="text-lg">{t('ticket_details.cards.details')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('ticket_details.cards.assigned_to')}</p>
                  <p className="font-medium">
                    {ticket.assigned_to ? getUserName(ticket.assigned_to) : t('ticket_details.unassigned')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('ticket_details.cards.created_by')}</p>
                  <p className="font-medium">{getUserName(ticket.created_by)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('ticket_details.cards.created')}</p>
                  <p className="font-medium">
                    {new Date(ticket.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('ticket_details.cards.last_updated')}</p>
                  <p className="font-medium">
                    {new Date(ticket.updated_at).toLocaleString()}
                  </p>
                </div>
                {ticket.resolved_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t('ticket_details.cards.resolved_at')}</p>
                    <p className="font-medium">
                      {new Date(ticket.resolved_at).toLocaleString()}
                    </p>
                  </div>
                )}

                {ticket.integration_inbox && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">{t('ticket_details.cards.source_system')}</p>
                      <Badge variant="outline" className="mt-1">
                        {ticket.integration_inbox.source}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('ticket_details.cards.external_id')}</p>
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
                      <p className="text-sm text-muted-foreground mb-2">{t('ticket_details.cards.change_status')}</p>
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
                  {t('ticket_details.cards.timeline')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {events.length === 0 ? (
                    <p className="text-muted-foreground text-sm">{t('ticket_details.cards.no_events')}</p>
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
            <AlertDialogTitle>{t('ticket_details.dialogs.assign_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('ticket_details.dialogs.assign_desc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
            <SelectTrigger>
              <SelectValue placeholder={t('ticket_details.dialogs.select_assignee')} />
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
            <AlertDialogCancel>{t('ticket_details.dialogs.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleAssign} disabled={!selectedAssignee}>
              {t('ticket_details.buttons.assign')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('ticket_details.dialogs.delete_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('ticket_details.dialogs.delete_desc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('ticket_details.dialogs.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {t('ticket_details.buttons.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
