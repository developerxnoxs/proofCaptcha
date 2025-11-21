import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Key, Search, Trash2, Power, ChevronLeft, Globe, Eye, EyeOff } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ApiKeyOverview {
  id: string;
  name: string;
  sitekey: string;
  secretkey: string;
  domain: string | null;
  isActive: boolean;
  theme: string;
  developer: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  } | null;
  stats: {
    totalVerifications: number;
    successfulVerifications: number;
    successRate: number;
    last24hVerifications: number;
  };
  createdAt: string;
}

export default function ServiceManagement() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedApiKey, setSelectedApiKey] = useState<ApiKeyOverview | null>(null);
  const [showSecretKeys, setShowSecretKeys] = useState<Record<string, boolean>>({});

  const { data: apiKeys, isLoading } = useQuery<ApiKeyOverview[]>({
    queryKey: ["/api/founder/api-keys-overview"],
    queryFn: async () => {
      const response = await fetch("/api/founder/api-keys-overview?limit=10000");
      if (!response.ok) throw new Error("Failed to fetch API keys");
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (apiKeyId: string) => {
      return apiRequest("DELETE", `/api/founder/api-keys/${apiKeyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/founder/api-keys-overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/founder/stats"] });
      toast({
        title: "Success",
        description: "API Key deleted successfully",
      });
      setDeleteDialogOpen(false);
      setSelectedApiKey(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete API key",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ apiKeyId, isActive }: { apiKeyId: string; isActive: boolean }) => {
      return apiRequest("PATCH", `/api/founder/api-keys/${apiKeyId}/status`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/founder/api-keys-overview"] });
      toast({
        title: "Success",
        description: "API Key status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update API key status",
      });
    },
  });

  const filteredApiKeys = apiKeys?.filter(apiKey => {
    const matchesSearch = 
      apiKey.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apiKey.sitekey.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (apiKey.domain && apiKey.domain.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (apiKey.developer && apiKey.developer.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "active" && apiKey.isActive) ||
      (statusFilter === "inactive" && !apiKey.isActive);
    
    return matchesSearch && matchesStatus;
  }) || [];

  const handleDeleteClick = (apiKey: ApiKeyOverview) => {
    setSelectedApiKey(apiKey);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedApiKey) {
      deleteMutation.mutate(selectedApiKey.id);
    }
  };

  const handleToggleActive = (apiKeyId: string, currentStatus: boolean) => {
    toggleActiveMutation.mutate({ apiKeyId, isActive: !currentStatus });
  };

  const toggleSecretKey = (apiKeyId: string) => {
    setShowSecretKeys(prev => ({
      ...prev,
      [apiKeyId]: !prev[apiKeyId]
    }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const stats = {
    total: apiKeys?.length || 0,
    active: apiKeys?.filter(k => k.isActive).length || 0,
    inactive: apiKeys?.filter(k => !k.isActive).length || 0,
    totalVerifications: apiKeys?.reduce((sum, k) => sum + k.stats.totalVerifications, 0) || 0,
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Link href="/founder/dashboard">
              <Button variant="ghost" size="sm" data-testid="button-back-to-dashboard">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            </Link>
          </div>
          <h2 className="text-3xl font-bold tracking-tight" data-testid="text-service-management-title">
            Service Management
          </h2>
          <p className="text-muted-foreground" data-testid="text-service-management-subtitle">
            Manage all API keys across the system
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-services">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-services">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              API keys registered
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-active-services">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Services</CardTitle>
            <Power className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-active-services">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-inactive-services">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Services</CardTitle>
            <Power className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground" data-testid="text-inactive-services">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground">
              Disabled services
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-verifications">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Verifications</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-verifications">{stats.totalVerifications}</div>
            <p className="text-xs text-muted-foreground">
              Across all services
            </p>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-service-list">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>All API Keys</CardTitle>
              <CardDescription>
                {filteredApiKeys.length} service{filteredApiKeys.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-[130px]" data-testid="select-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px] md:w-[300px]"
                  data-testid="input-search-services"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredApiKeys.length === 0 ? (
            <div className="text-center py-8" data-testid="text-no-services">
              <Key className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">
                {searchQuery || statusFilter !== "all" ? "No services found matching your criteria" : "No API keys yet"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Developer</TableHead>
                    <TableHead>Service Name</TableHead>
                    <TableHead>Site Key</TableHead>
                    <TableHead>Secret Key</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verifications</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApiKeys.map((apiKey) => (
                    <TableRow key={apiKey.id} data-testid={`row-service-${apiKey.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={apiKey.developer?.avatar || undefined} />
                            <AvatarFallback>{apiKey.developer?.name?.charAt(0) || "?"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm" data-testid={`text-developer-name-${apiKey.id}`}>
                              {apiKey.developer?.name || "Unknown"}
                            </div>
                            <div className="text-xs text-muted-foreground" data-testid={`text-developer-email-${apiKey.id}`}>
                              {apiKey.developer?.email || "N/A"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium" data-testid={`text-service-name-${apiKey.id}`}>
                        {apiKey.name}
                      </TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="font-mono text-xs"
                              onClick={() => copyToClipboard(apiKey.sitekey, "Site key")}
                              data-testid={`button-copy-sitekey-${apiKey.id}`}
                            >
                              {apiKey.sitekey.substring(0, 12)}...
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Click to copy full key</TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs">
                            {showSecretKeys[apiKey.id] ? apiKey.secretkey : '••••••••••••'}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleSecretKey(apiKey.id)}
                            data-testid={`button-toggle-secretkey-${apiKey.id}`}
                          >
                            {showSecretKeys[apiKey.id] ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-domain-${apiKey.id}`}>
                        {apiKey.domain || <span className="text-muted-foreground">Any</span>}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={apiKey.isActive ? "default" : "secondary"}
                          data-testid={`badge-status-${apiKey.id}`}
                        >
                          {apiKey.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`text-verifications-${apiKey.id}`}>
                        <div className="text-sm">{apiKey.stats.totalVerifications}</div>
                        <div className="text-xs text-muted-foreground">
                          {apiKey.stats.last24hVerifications} in 24h
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-success-rate-${apiKey.id}`}>
                        <div className="text-sm font-medium">
                          {apiKey.stats.successRate.toFixed(1)}%
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleActive(apiKey.id, apiKey.isActive)}
                                disabled={toggleActiveMutation.isPending}
                                data-testid={`button-toggle-status-${apiKey.id}`}
                              >
                                <Power className={`w-4 h-4 ${apiKey.isActive ? 'text-green-600' : 'text-muted-foreground'}`} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {apiKey.isActive ? "Deactivate" : "Activate"} service
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(apiKey)}
                                disabled={deleteMutation.isPending}
                                data-testid={`button-delete-service-${apiKey.id}`}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete service</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-service">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedApiKey?.name}</strong>?
              This will permanently delete the API key and all associated analytics data. 
              Developer <strong>{selectedApiKey?.developer?.name}</strong> will lose access to this service.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
