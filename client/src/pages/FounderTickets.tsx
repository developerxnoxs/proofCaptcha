import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Ticket, MessageSquare, AlertCircle, CheckCircle2, Clock, Plus, Send } from "lucide-react";
import { format } from "date-fns";

const responseSchema = z.object({
  response: z.string().min(1, "Response is required"),
});

type ResponseFormData = z.infer<typeof responseSchema>;

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

export default function FounderTickets() {
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: tickets, isLoading } = useQuery<TicketType[]>({
    queryKey: ['/api/founder/tickets'],
  });

  const form = useForm<ResponseFormData>({
    resolver: zodResolver(responseSchema),
    defaultValues: {
      response: "",
    },
  });

  const respondMutation = useMutation({
    mutationFn: async ({ id, response }: { id: string; response: string }) => {
      return await apiRequest(`/api/founder/tickets/${id}/respond`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/founder/tickets'] });
      setIsResponseDialogOpen(false);
      setSelectedTicket(null);
      form.reset();
      toast({
        title: "Response sent",
        description: "Your response has been sent to the developer.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send response",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest(`/api/founder/tickets/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/founder/tickets'] });
      toast({
        title: "Status updated",
        description: "Ticket status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update status",
      });
    },
  });

  const deleteTicketMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/founder/tickets/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/founder/tickets'] });
      toast({
        title: "Ticket deleted",
        description: "The ticket has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete ticket",
      });
    },
  });

  const onSubmitResponse = (data: ResponseFormData) => {
    if (selectedTicket) {
      respondMutation.mutate({ id: selectedTicket.id, response: data.response });
    }
  };

  const handleRespond = (ticket: TicketType) => {
    setSelectedTicket(ticket);
    form.setValue("response", ticket.response || "");
    setIsResponseDialogOpen(true);
  };

  const handleStatusChange = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
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

  const filterTickets = (status: string) => {
    if (!tickets) return [];
    if (status === 'all') return tickets;
    return tickets.filter(t => t.status === status);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading tickets...</p>
      </div>
    );
  }

  const allTickets = tickets || [];
  const openTickets = filterTickets('open');
  const inProgressTickets = filterTickets('in_progress');
  const resolvedTickets = filterTickets('resolved');
  const closedTickets = filterTickets('closed');

  const renderTickets = (ticketList: TicketType[]) => {
    if (ticketList.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Ticket className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No tickets in this category.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid gap-4">
        {ticketList.map((ticket) => {
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
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{ticket.title}</CardTitle>
                      </div>
                      <CardDescription className="mb-2">
                        From: {ticket.developerName} ({ticket.developerEmail})
                      </CardDescription>
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
                        Your Response
                      </div>
                      <p className="text-sm">{ticket.response}</p>
                      {ticket.respondedAt && (
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(ticket.respondedAt), 'MMM d, yyyy h:mm a')}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleRespond(ticket)}
                      data-testid={`button-respond-${ticket.id}`}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {ticket.response ? 'Update Response' : 'Respond'}
                    </Button>
                    <Select
                      value={ticket.status}
                      onValueChange={(value) => handleStatusChange(ticket.id, value)}
                    >
                      <SelectTrigger className="w-40" data-testid={`select-status-${ticket.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteTicketMutation.mutate(ticket.id)}
                      data-testid={`button-delete-${ticket.id}`}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Support Tickets</h1>
        <p className="text-muted-foreground mt-1">
          Manage and respond to developer support requests
        </p>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">
            All ({allTickets.length})
          </TabsTrigger>
          <TabsTrigger value="open" data-testid="tab-open">
            Open ({openTickets.length})
          </TabsTrigger>
          <TabsTrigger value="in_progress" data-testid="tab-in-progress">
            In Progress ({inProgressTickets.length})
          </TabsTrigger>
          <TabsTrigger value="resolved" data-testid="tab-resolved">
            Resolved ({resolvedTickets.length})
          </TabsTrigger>
          <TabsTrigger value="closed" data-testid="tab-closed">
            Closed ({closedTickets.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">{renderTickets(allTickets)}</TabsContent>
        <TabsContent value="open">{renderTickets(openTickets)}</TabsContent>
        <TabsContent value="in_progress">{renderTickets(inProgressTickets)}</TabsContent>
        <TabsContent value="resolved">{renderTickets(resolvedTickets)}</TabsContent>
        <TabsContent value="closed">{renderTickets(closedTickets)}</TabsContent>
      </Tabs>

      <Dialog open={isResponseDialogOpen} onOpenChange={setIsResponseDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Respond to Ticket</DialogTitle>
            <DialogDescription>
              Send a response to {selectedTicket?.developerName}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitResponse)} className="space-y-4">
              <div className="bg-muted p-4 rounded-md space-y-2">
                <p className="font-medium">{selectedTicket?.title}</p>
                <p className="text-sm text-muted-foreground">{selectedTicket?.description}</p>
              </div>
              <FormField
                control={form.control}
                name="response"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Response</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Type your response here..."
                        className="min-h-[150px]"
                        {...field}
                        data-testid="textarea-response"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsResponseDialogOpen(false)} data-testid="button-cancel">
                  Cancel
                </Button>
                <Button type="submit" disabled={respondMutation.isPending} data-testid="button-send-response">
                  {respondMutation.isPending ? "Sending..." : "Send Response"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
