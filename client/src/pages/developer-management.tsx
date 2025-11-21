import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Trash2, UserCog, ChevronLeft } from "lucide-react";
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

interface Developer {
  id: string;
  email: string;
  name: string;
  role: string;
  isEmailVerified: boolean;
  createdAt: string;
}

export default function DeveloperManagement() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDeveloper, setSelectedDeveloper] = useState<Developer | null>(null);

  const { data: developers, isLoading } = useQuery<Developer[]>({
    queryKey: ["/api/founder/developers"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (developerId: string) => {
      return apiRequest("DELETE", `/api/founder/developers/${developerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/founder/developers"] });
      toast({
        title: "Success",
        description: "Developer deleted successfully",
      });
      setDeleteDialogOpen(false);
      setSelectedDeveloper(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete developer",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ developerId, role }: { developerId: string; role: string }) => {
      return apiRequest("PATCH", `/api/founder/developers/${developerId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/founder/developers"] });
      toast({
        title: "Success",
        description: "Developer role updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update developer role",
      });
    },
  });

  const filteredDevelopers = developers?.filter(dev =>
    dev.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dev.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleDeleteClick = (developer: Developer) => {
    setSelectedDeveloper(developer);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedDeveloper) {
      deleteMutation.mutate(selectedDeveloper.id);
    }
  };

  const handleRoleChange = (developerId: string, newRole: string) => {
    updateRoleMutation.mutate({ developerId, role: newRole });
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
          <h2 className="text-3xl font-bold tracking-tight" data-testid="text-developer-management-title">
            Developer Management
          </h2>
          <p className="text-muted-foreground" data-testid="text-developer-management-subtitle">
            Manage all developers in the system
          </p>
        </div>
      </div>

      <Card data-testid="card-developer-list">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>All Developers</CardTitle>
              <CardDescription>
                {filteredDevelopers.length} developer{filteredDevelopers.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search developers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px] md:w-[300px]"
                  data-testid="input-search-developers"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredDevelopers.length === 0 ? (
            <div className="text-center py-8" data-testid="text-no-developers">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">
                {searchQuery ? "No developers found matching your search" : "No developers yet"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Email Verified</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDevelopers.map((developer) => (
                    <TableRow key={developer.id} data-testid={`row-developer-${developer.id}`}>
                      <TableCell className="font-medium" data-testid={`text-developer-name-${developer.id}`}>
                        {developer.name}
                      </TableCell>
                      <TableCell data-testid={`text-developer-email-${developer.id}`}>
                        {developer.email}
                      </TableCell>
                      <TableCell data-testid={`select-developer-role-${developer.id}`}>
                        <Select
                          value={developer.role}
                          onValueChange={(value) => handleRoleChange(developer.id, value)}
                          disabled={updateRoleMutation.isPending}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="developer">Developer</SelectItem>
                            <SelectItem value="founder">Founder</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={developer.isEmailVerified ? "default" : "secondary"}
                          data-testid={`badge-email-verified-${developer.id}`}
                        >
                          {developer.isEmailVerified ? "Verified" : "Not Verified"}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`text-developer-created-${developer.id}`}>
                        {new Date(developer.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(developer)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-developer-${developer.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
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
        <AlertDialogContent data-testid="dialog-delete-developer">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Developer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete developer <strong>{selectedDeveloper?.name}</strong> ({selectedDeveloper?.email})?
              This action cannot be undone and will delete all their API keys, challenges, and analytics data.
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
