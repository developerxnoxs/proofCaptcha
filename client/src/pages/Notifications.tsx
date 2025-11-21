import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Bell, Check, Info, AlertCircle, CheckCircle2, XCircle, Trash } from "lucide-react";
import { format } from "date-fns";

type NotificationType = {
  id: string;
  developerId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  relatedTicketId: string | null;
  sentBy: string | null;
  createdAt: string;
};

export default function Notifications() {
  const { toast } = useToast();

  const { data: allNotifications, isLoading } = useQuery<NotificationType[]>({
    queryKey: ['/api/notifications'],
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/notifications/${id}/read`, {
        method: 'PATCH',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/notifications/read-all', {
        method: 'PATCH',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
      toast({
        title: "All notifications marked as read",
      });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/notifications/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
      toast({
        title: "Notification deleted",
      });
    },
  });

  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      info: Info,
      warning: AlertCircle,
      success: CheckCircle2,
      error: XCircle,
    };
    return icons[type] || Bell;
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      info: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
      warning: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
      success: "bg-green-500/10 text-green-700 dark:text-green-400",
      error: "bg-red-500/10 text-red-700 dark:text-red-400",
    };

    return (
      <Badge className={colors[type] || colors.info} variant="outline">
        {type.toUpperCase()}
      </Badge>
    );
  };

  const renderNotifications = (notifications: NotificationType[]) => {
    if (notifications.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No notifications to display.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid gap-3">
        {notifications.map((notification) => {
          const TypeIcon = getTypeIcon(notification.type);
          return (
            <Card
              key={notification.id}
              className={`hover-elevate ${!notification.isRead ? 'border-l-4 border-l-primary' : ''}`}
              data-testid={`card-notification-${notification.id}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 bg-muted rounded-md">
                      <TypeIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-base">{notification.title}</CardTitle>
                        {!notification.isRead && (
                          <Badge variant="default" className="text-xs">New</Badge>
                        )}
                      </div>
                      <CardDescription>{notification.message}</CardDescription>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        {getTypeBadge(notification.type)}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(notification.createdAt), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!notification.isRead && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markAsReadMutation.mutate(notification.id)}
                        data-testid={`button-mark-read-${notification.id}`}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteNotificationMutation.mutate(notification.id)}
                      data-testid={`button-delete-${notification.id}`}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading notifications...</p>
      </div>
    );
  }

  const notifications = allNotifications || [];
  const unreadNotifications = notifications.filter(n => !n.isRead);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            Stay updated with important messages and updates
          </p>
        </div>
        {unreadNotifications.length > 0 && (
          <Button onClick={() => markAllAsReadMutation.mutate()} data-testid="button-mark-all-read">
            <Check className="h-4 w-4 mr-2" />
            Mark All as Read
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">
            All ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread" data-testid="tab-unread">
            Unread ({unreadNotifications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">{renderNotifications(notifications)}</TabsContent>
        <TabsContent value="unread">{renderNotifications(unreadNotifications)}</TabsContent>
      </Tabs>
    </div>
  );
}
