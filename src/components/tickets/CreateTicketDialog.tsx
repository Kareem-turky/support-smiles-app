import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ticketsService } from '@/services/tickets.service';
import { HRService, Department, Employee } from '@/services/hr';
import { reasonsService, TicketReason } from '@/services/reasons.service';
import { IssueType, Priority, ISSUE_TYPE_LABELS, PRIORITY_LABELS } from '@/types';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const createTicketSchema = z.object({
  order_number: z.string().min(1, 'Order number is required').max(50),
  courier_company: z.string().min(1, 'Courier company is required').max(100),
  issue_type: z.enum(['ACCOUNTING', 'DELIVERY', 'COD', 'RETURNS', 'ADDRESS', 'DUPLICATE', 'OTHER'] as const),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  department_id: z.string().optional(),
  assigned_to: z.string().optional(),
  reason_id: z.string().optional(),
});

type CreateTicketForm = z.infer<typeof createTicketSchema>;

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateTicketDialog({ open, onOpenChange, onCreated }: CreateTicketDialogProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [reasons, setReasons] = useState<TicketReason[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

  const form = useForm<CreateTicketForm>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      order_number: '',
      courier_company: '',
      issue_type: 'OTHER',
      priority: 'MEDIUM',
      description: '',
      department_id: 'all',
      assigned_to: 'unassigned',
      reason_id: 'none',
    },
  });

  const selectedDepartment = form.watch('department_id');

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [deptRes, empRes, reasonsRes] = await Promise.all([
          HRService.getDepartments(),
          HRService.getEmployees(),
          reasonsService.getAll(true)
        ]);
        setDepartments(deptRes || []);
        setEmployees(empRes || []);
        setReasons(reasonsRes || []);
        setFilteredEmployees(empRes || []);
      } catch (error) {
        console.error("Failed to load metadata", error);
      }
    };
    if (open) {
      fetchMetadata();
    }
  }, [open]);

  useEffect(() => {
    if (selectedDepartment && selectedDepartment !== 'all') {
      setFilteredEmployees(employees.filter(e => e.department_id === selectedDepartment));
    } else {
      setFilteredEmployees(employees);
    }
    // Reset assignee when department changes
    form.setValue('assigned_to', 'unassigned');
  }, [selectedDepartment, employees, form]);

  const onSubmit = async (data: CreateTicketForm) => {
    setIsSubmitting(true);

    // Map reason_id if selected
    const reasonId = data.reason_id === 'none' ? undefined : data.reason_id;
    const assignedTo = data.assigned_to === 'unassigned' ? undefined : data.assigned_to;

    const result = await ticketsService.create({
      order_number: data.order_number,
      courier_company: data.courier_company,
      issue_type: data.issue_type as IssueType,
      priority: data.priority as Priority,
      description: data.description,
      assigned_to: assignedTo,
      reason_id: reasonId,
    });

    if (result.success) {
      toast({
        title: 'Ticket created',
        description: `Ticket ${data.order_number} has been created successfully.`,
      });
      form.reset();
      onCreated();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error || 'Failed to create ticket',
      });
    }

    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Ticket</DialogTitle>
          <DialogDescription>
            Create a new ticket to track an order issue.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="order_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order Number</FormLabel>
                    <FormControl>
                      <Input placeholder="ORD-2025-0001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="courier_company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Courier Company</FormLabel>
                    <FormControl>
                      <Input placeholder="FedEx" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="issue_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(ISSUE_TYPE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || 'none'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {reasons.map((reason) => (
                        <SelectItem key={reason.id} value={reason.id}>{reason.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="department_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department Filter</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || 'all'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by Department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assigned_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign To (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || 'unassigned'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {filteredEmployees.map((user) => (
                          <SelectItem key={user.id} value={user.id}>{user.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the issue in detail..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Ticket'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
