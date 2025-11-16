import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Key } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ApiKeyCard from "@/components/ApiKeyCard";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ApiKey } from "@shared/schema";
import { useTranslation } from "react-i18next";

export default function ApiKeys() {
  const { t } = useTranslation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyDomain, setNewKeyDomain] = useState("");
  const [newKeyTheme, setNewKeyTheme] = useState("light");
  const { toast } = useToast();

  const { data: apiKeys, isLoading } = useQuery<ApiKey[]>({
    queryKey: ["/api/keys"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; domain?: string; theme?: string }) => {
      const res = await apiRequest("POST", "/api/keys", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keys"] });
      setIsCreateOpen(false);
      setNewKeyName("");
      setNewKeyDomain("");
      setNewKeyTheme("light");
      toast({
        title: t('toast.success'),
        description: t('toast.apiKeyCreated'),
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/keys/${id}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keys"] });
      toast({
        title: t('toast.success'),
        description: t('toast.apiKeyUpdated'),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/keys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keys"] });
      toast({
        title: t('toast.success'),
        description: t('toast.apiKeyDeleted'),
      });
    },
  });

  const handleCreate = () => {
    if (!newKeyName.trim()) {
      toast({
        title: t('toast.error'),
        description: t('apiKeys.errors.nameRequired'),
        variant: "destructive",
      });
      return;
    }

    if (!newKeyDomain.trim()) {
      toast({
        title: t('toast.error'),
        description: t('apiKeys.errors.domainRequired'),
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      name: newKeyName,
      domain: newKeyDomain,
      theme: newKeyTheme,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-purple-500 border-t-transparent" />
          <p className="text-muted-foreground text-sm">{t('apiKeys.loading')}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="relative z-10 px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8" data-testid="page-api-keys">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4"
        >
          <div className="space-y-1 sm:space-y-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg shadow-lg shadow-purple-500/30">
                <Key className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold" data-testid="text-title">
                {t('apiKeys.title')}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground ml-9 sm:ml-11" data-testid="text-subtitle">
              {t('apiKeys.subtitle')}
            </p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="shadow-md hover:shadow-lg transition-shadow" data-testid="button-create-key">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">{t('apiKeys.dialog.createButton')}</span>
                  <span className="sm:hidden">{t('common.create')}</span>
                </Button>
              </motion.div>
            </DialogTrigger>
          <DialogContent data-testid="dialog-create-key">
            <DialogHeader>
              <DialogTitle>{t('apiKeys.dialog.title')}</DialogTitle>
              <DialogDescription>
                {t('apiKeys.dialog.description')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('apiKeys.dialog.nameLabel')}</Label>
                <Input
                  id="name"
                  placeholder={t('apiKeys.dialog.namePlaceholder')}
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  data-testid="input-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain">{t('apiKeys.dialog.domainRequired')}</Label>
                <Input
                  id="domain"
                  placeholder={t('apiKeys.dialog.domainPlaceholder')}
                  value={newKeyDomain}
                  onChange={(e) => setNewKeyDomain(e.target.value)}
                  data-testid="input-domain"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {t('apiKeys.dialog.domainHelpText')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme">{t('apiKeys.dialog.themeLabel')}</Label>
                <Select value={newKeyTheme} onValueChange={setNewKeyTheme}>
                  <SelectTrigger id="theme" data-testid="select-theme">
                    <SelectValue placeholder={t('apiKeys.dialog.themePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light" data-testid="theme-light">{t('apiKeys.dialog.lightTheme')}</SelectItem>
                    <SelectItem value="dark" data-testid="theme-dark">{t('apiKeys.dialog.darkTheme')}</SelectItem>
                    <SelectItem value="auto" data-testid="theme-auto">{t('apiKeys.dialog.autoTheme')}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t('apiKeys.dialog.themeHelpText')}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                data-testid="button-cancel"
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                data-testid="button-submit"
              >
                {createMutation.isPending ? t('apiKeys.dialog.creating') : t('apiKeys.dialog.create')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid gap-3 sm:gap-4 md:gap-5 lg:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
      >
        {!apiKeys || apiKeys.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="col-span-full text-center py-12 sm:py-16"
          >
            <p className="text-sm sm:text-base text-muted-foreground">{t('apiKeys.empty.title')}</p>
          </motion.div>
        ) : (
          apiKeys.map((apiKey, index) => (
            <motion.div
              key={apiKey.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8, rotateX: 5, rotateY: 5, scale: 1.02 }}
              style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
              className="card-3d"
            >
              <ApiKeyCard
                apiKey={apiKey}
                onToggleStatus={(id) => toggleStatusMutation.mutate(id)}
                onDelete={(id) => {
                  if (confirm(t('apiKeys.card.confirmDelete'))) {
                    deleteMutation.mutate(id);
                  }
                }}
              />
            </motion.div>
          ))
        )}
      </motion.div>
      </div>
    </div>
  );
}
