import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Ticket, MessageSquare, AlertCircle, CheckCircle2, Clock, Plus } from "lucide-react";
import { format } from "date-fns";

const ticketSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().min(1, "Description is required"),
  category: z.enum(['bug', 'feature', 'question', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
});

type TicketFormData = z.infer<typeof ticketSchema>;

type TicketType = {
  id: string;
  developerId: string;
  developerName: string;
  developerEmail: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  response: string | null;
  respondedBy: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function Tickets() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const { toast } = useToast();

  const { data: tickets, isLoading } = useQuery<TicketType[]>({
    queryKey: ['/api/tickets'],
  });

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "question",
      priority: "medium",
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: TicketFormData) => {
      return await apiRequest('POST', '/api/tickets', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Ticket created",
        description: "Your support ticket has been submitted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create ticket",
      });
    },
  });

  const onSubmit = (data: TicketFormData) => {
    createTicketMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      open: "default",
      in_progress: "secondary",
      resolved: "secondary",
      closed: "outline",
    };

    const icons: Record<string, any> = {
      open: AlertCircle,
      in_progress: Clock,
      resolved: CheckCircle2,
      closed: CheckCircle2,
    };

    const Icon = icons[status] || AlertCircle;

    return (
      <Badge variant={variants[status] || "default"} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-green-500/10 text-green-700 dark:text-green-400",
      medium: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
      high: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
      urgent: "bg-red-500/10 text-red-700 dark:text-red-400",
    };

    return (
      <Badge className={colors[priority]} variant="outline">
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      bug: AlertCircle,
      feature: Plus,
      question: MessageSquare,
      other: Ticket,
    };
    return icons[category] || Ticket;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading tickets...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Support Tickets</h1>
          <p className="text-muted-foreground mt-1">
            Submit and track your support requests
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-ticket">
              <Plus className="h-4 w-4 mr-2" />
              Create Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
              <DialogDescription>
                Describe your issue or request and we'll get back to you as soon as possible.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief description of your issue" {...field} data-testid="input-ticket-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bug">Bug Report</SelectItem>
                          <SelectItem value="feature">Feature Request</SelectItem>
                          <SelectItem value="question">Question</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
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
                          <SelectTrigger data-testid="select-priority">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide detailed information about your request..."
                          className="min-h-[120px]"
                          {...field}
                          data-testid="textarea-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} data-testid="button-cancel">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createTicketMutation.isPending} data-testid="button-submit-ticket">
                    {createTicketMutation.isPending ? "Creating..." : "Create Ticket"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {tickets && tickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Ticket className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No tickets yet. Create your first support ticket to get help.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tickets?.map((ticket) => {
            const CategoryIcon = getCategoryIcon(ticket.category);
            return (
              <Card key={ticket.id} className="hover-elevate" data-testid={`card-ticket-${ticket.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 bg-muted rounded-md">
                        <CategoryIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg mb-2">{ticket.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {ticket.description}
                        </CardDescription>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {getStatusBadge(ticket.status)}
                          {getPriorityBadge(ticket.priority)}
                          <Badge variant="outline" className="capitalize">
                            {ticket.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Created {format(new Date(ticket.createdAt), 'MMM d, yyyy')}</span>
                      {ticket.updatedAt !== ticket.createdAt && (
                        <span>Updated {format(new Date(ticket.updatedAt), 'MMM d, yyyy')}</span>
                      )}
                    </div>
                    {ticket.response && (
                      <div className="bg-muted p-4 rounded-md space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <MessageSquare className="h-4 w-4" />
                          Response from Support
                        </div>
                        <p className="text-sm">{ticket.response}</p>
                        {ticket.respondedAt && (
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(ticket.respondedAt), 'MMM d, yyyy h:mm a')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
