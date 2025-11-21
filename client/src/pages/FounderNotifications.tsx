import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Send, Users } from "lucide-react";

const notificationSchema = z.object({
  developerId: z.string().min(1, "Developer is required"),
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  message: z.string().min(1, "Message is required"),
  type: z.enum(['info', 'warning', 'success', 'error']).default('info'),
});

const broadcastSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  message: z.string().min(1, "Message is required"),
  type: z.enum(['info', 'warning', 'success', 'error']).default('info'),
});

type NotificationFormData = z.infer<typeof notificationSchema>;
type BroadcastFormData = z.infer<typeof broadcastSchema>;

type DeveloperType = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export default function FounderNotifications() {
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [isBroadcastDialogOpen, setIsBroadcastDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: developers } = useQuery<DeveloperType[]>({
    queryKey: ['/api/founder/developers'],
  });

  const sendForm = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      developerId: "",
      title: "",
      message: "",
      type: "info",
    },
  });

  const broadcastForm = useForm<BroadcastFormData>({
    resolver: zodResolver(broadcastSchema),
    defaultValues: {
      title: "",
      message: "",
      type: "info",
    },
  });

  const sendNotificationMutation = useMutation({
    mutationFn: async (data: NotificationFormData) => {
      return await apiRequest('/api/founder/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      setIsSendDialogOpen(false);
      sendForm.reset();
      toast({
        title: "Notification sent",
        description: "Your notification has been sent successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send notification",
      });
    },
  });

  const broadcastNotificationMutation = useMutation({
    mutationFn: async (data: BroadcastFormData) => {
      return await apiRequest('/api/founder/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      setIsBroadcastDialogOpen(false);
      broadcastForm.reset();
      toast({
        title: "Notification broadcast",
        description: "Your notification has been sent to all developers.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to broadcast notification",
      });
    },
  });

  const onSubmitSend = (data: NotificationFormData) => {
    sendNotificationMutation.mutate(data);
  };

  const onSubmitBroadcast = (data: BroadcastFormData) => {
    broadcastNotificationMutation.mutate(data);
  };

  const regularDevelopers = developers?.filter(d => d.role !== 'founder') || [];

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Send Notifications</h1>
        <p className="text-muted-foreground mt-1">
          Send notifications to developers individually or broadcast to all
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Send to Developer</CardTitle>
            <CardDescription>
              Send a notification to a specific developer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" data-testid="button-send-notification">
                  <Send className="h-4 w-4 mr-2" />
                  Send Notification
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Send Notification</DialogTitle>
                  <DialogDescription>
                    Send a notification to a specific developer
                  </DialogDescription>
                </DialogHeader>
                <Form {...sendForm}>
                  <form onSubmit={sendForm.handleSubmit(onSubmitSend)} className="space-y-4">
                    <FormField
                      control={sendForm.control}
                      name="developerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Developer</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-developer">
                                <SelectValue placeholder="Select a developer" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {regularDevelopers.map((dev) => (
                                <SelectItem key={dev.id} value={dev.id}>
                                  {dev.name} ({dev.email})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={sendForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Notification title" {...field} data-testid="input-title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={sendForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-type">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="info">Info</SelectItem>
                              <SelectItem value="warning">Warning</SelectItem>
                              <SelectItem value="success">Success</SelectItem>
                              <SelectItem value="error">Error</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={sendForm.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Type your message here..."
                              className="min-h-[120px]"
                              {...field}
                              data-testid="textarea-message"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-3">
                      <Button type="button" variant="outline" onClick={() => setIsSendDialogOpen(false)} data-testid="button-cancel">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={sendNotificationMutation.isPending} data-testid="button-submit">
                        {sendNotificationMutation.isPending ? "Sending..." : "Send"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Broadcast to All</CardTitle>
            <CardDescription>
              Send a notification to all developers ({regularDevelopers.length} developers)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isBroadcastDialogOpen} onOpenChange={setIsBroadcastDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" data-testid="button-broadcast-notification">
                  <Users className="h-4 w-4 mr-2" />
                  Broadcast Notification
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Broadcast Notification</DialogTitle>
                  <DialogDescription>
                    This will send a notification to all {regularDevelopers.length} developers
                  </DialogDescription>
                </DialogHeader>
                <Form {...broadcastForm}>
                  <form onSubmit={broadcastForm.handleSubmit(onSubmitBroadcast)} className="space-y-4">
                    <FormField
                      control={broadcastForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Notification title" {...field} data-testid="input-broadcast-title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={broadcastForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-broadcast-type">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="info">Info</SelectItem>
                              <SelectItem value="warning">Warning</SelectItem>
                              <SelectItem value="success">Success</SelectItem>
                              <SelectItem value="error">Error</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={broadcastForm.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Type your message here..."
                              className="min-h-[120px]"
                              {...field}
                              data-testid="textarea-broadcast-message"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-3">
                      <Button type="button" variant="outline" onClick={() => setIsBroadcastDialogOpen(false)} data-testid="button-broadcast-cancel">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={broadcastNotificationMutation.isPending} data-testid="button-broadcast-submit">
                        {broadcastNotificationMutation.isPending ? "Sending..." : "Broadcast"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
