import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Search, Trash2, ChevronLeft, Shield, Activity } from "lucide-react";
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

interface Challenge {
  id: string;
  apiKeyId: string;
  type: string;
  challengeData: any;
  secretAnswer: string;
  isUsed: boolean;
  createdAt: string;
}

interface Verification {
  id: string;
  challengeId: string;
  apiKeyId: string;
  success: boolean;
  userSolution: string;
  ipAddress: string;
  userAgent: string;
  verifiedAt: string;
}

export default function DatabaseOperations() {
  const { toast } = useToast();
  const [challengeSearch, setChallengeSearch] = useState("");
  const [verificationSearch, setVerificationSearch] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'challenge' | 'verification'>('challenge');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: challenges, isLoading: challengesLoading } = useQuery<Challenge[]>({
    queryKey: ["/api/founder/challenges"],
  });

  const { data: verifications, isLoading: verificationsLoading } = useQuery<Verification[]>({
    queryKey: ["/api/founder/verifications"],
  });

  const deleteChallengeMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      return apiRequest("DELETE", `/api/founder/challenges/${challengeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/founder/challenges"] });
      toast({
        title: "Success",
        description: "Challenge deleted successfully",
      });
      setDeleteDialogOpen(false);
      setSelectedId(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete challenge",
      });
    },
  });

  const deleteVerificationMutation = useMutation({
    mutationFn: async (verificationId: string) => {
      return apiRequest("DELETE", `/api/founder/verifications/${verificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/founder/verifications"] });
      toast({
        title: "Success",
        description: "Verification deleted successfully",
      });
      setDeleteDialogOpen(false);
      setSelectedId(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete verification",
      });
    },
  });

  const filteredChallenges = challenges?.filter(challenge =>
    challenge.id.toLowerCase().includes(challengeSearch.toLowerCase()) ||
    challenge.type.toLowerCase().includes(challengeSearch.toLowerCase())
  ) || [];

  const filteredVerifications = verifications?.filter(verification =>
    verification.id.toLowerCase().includes(verificationSearch.toLowerCase()) ||
    verification.ipAddress.toLowerCase().includes(verificationSearch.toLowerCase())
  ) || [];

  const handleDeleteClick = (id: string, type: 'challenge' | 'verification') => {
    setSelectedId(id);
    setDeleteType(type);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedId) {
      if (deleteType === 'challenge') {
        deleteChallengeMutation.mutate(selectedId);
      } else {
        deleteVerificationMutation.mutate(selectedId);
      }
    }
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
          <h2 className="text-3xl font-bold tracking-tight" data-testid="text-database-operations-title">
            Database Operations
          </h2>
          <p className="text-muted-foreground" data-testid="text-database-operations-subtitle">
            Manage challenges and verifications
          </p>
        </div>
      </div>

      <Tabs defaultValue="challenges" className="space-y-4">
        <TabsList>
          <TabsTrigger value="challenges" data-testid="tab-challenges">
            <Shield className="w-4 h-4 mr-2" />
            Challenges
          </TabsTrigger>
          <TabsTrigger value="verifications" data-testid="tab-verifications">
            <Activity className="w-4 h-4 mr-2" />
            Verifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="challenges" className="space-y-4">
          <Card data-testid="card-challenges-list">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle>All Challenges</CardTitle>
                  <CardDescription>
                    {filteredChallenges.length} challenge{filteredChallenges.length !== 1 ? 's' : ''} found
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search challenges..."
                      value={challengeSearch}
                      onChange={(e) => setChallengeSearch(e.target.value)}
                      className="pl-9 w-[200px] md:w-[300px]"
                      data-testid="input-search-challenges"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {challengesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredChallenges.length === 0 ? (
                <div className="text-center py-8" data-testid="text-no-challenges">
                  <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    {challengeSearch ? "No challenges found matching your search" : "No challenges yet"}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredChallenges.map((challenge) => (
                        <TableRow key={challenge.id} data-testid={`row-challenge-${challenge.id}`}>
                          <TableCell className="font-mono text-xs" data-testid={`text-challenge-id-${challenge.id}`}>
                            {challenge.id.substring(0, 8)}...
                          </TableCell>
                          <TableCell data-testid={`text-challenge-type-${challenge.id}`}>
                            <Badge variant="outline">{challenge.type}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={challenge.isUsed ? "default" : "secondary"}
                              data-testid={`badge-challenge-status-${challenge.id}`}
                            >
                              {challenge.isUsed ? "Used" : "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell data-testid={`text-challenge-created-${challenge.id}`}>
                            {new Date(challenge.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(challenge.id, 'challenge')}
                              disabled={deleteChallengeMutation.isPending}
                              data-testid={`button-delete-challenge-${challenge.id}`}
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
        </TabsContent>

        <TabsContent value="verifications" className="space-y-4">
          <Card data-testid="card-verifications-list">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle>All Verifications</CardTitle>
                  <CardDescription>
                    {filteredVerifications.length} verification{filteredVerifications.length !== 1 ? 's' : ''} found
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search verifications..."
                      value={verificationSearch}
                      onChange={(e) => setVerificationSearch(e.target.value)}
                      className="pl-9 w-[200px] md:w-[300px]"
                      data-testid="input-search-verifications"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {verificationsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredVerifications.length === 0 ? (
                <div className="text-center py-8" data-testid="text-no-verifications">
                  <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    {verificationSearch ? "No verifications found matching your search" : "No verifications yet"}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Verified At</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVerifications.map((verification) => (
                        <TableRow key={verification.id} data-testid={`row-verification-${verification.id}`}>
                          <TableCell className="font-mono text-xs" data-testid={`text-verification-id-${verification.id}`}>
                            {verification.id.substring(0, 8)}...
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={verification.success ? "default" : "destructive"}
                              data-testid={`badge-verification-status-${verification.id}`}
                            >
                              {verification.success ? "Success" : "Failed"}
                            </Badge>
                          </TableCell>
                          <TableCell data-testid={`text-verification-ip-${verification.id}`}>
                            {verification.ipAddress}
                          </TableCell>
                          <TableCell data-testid={`text-verification-verified-${verification.id}`}>
                            {new Date(verification.verifiedAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(verification.id, 'verification')}
                              disabled={deleteVerificationMutation.isPending}
                              data-testid={`button-delete-verification-${verification.id}`}
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
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-confirmation">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteType === 'challenge' ? 'Challenge' : 'Verification'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {deleteType}? This action cannot be undone.
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
