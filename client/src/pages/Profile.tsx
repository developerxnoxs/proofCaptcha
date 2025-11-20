import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, Building2, Globe, MapPin, Edit2, Camera, Upload } from "lucide-react";

// Schema validation is separate from translations
const createProfileSchema = (t: any) => z.object({
  name: z.string().min(1, t('profile.validation.nameRequired')),
  bio: z.string().max(500, t('profile.validation.bioMaxLength')).optional().or(z.literal("")),
  company: z.string().max(100, t('profile.validation.companyMaxLength')).optional().or(z.literal("")),
  website: z.string().url(t('profile.validation.websiteInvalid')).optional().or(z.literal("")),
  location: z.string().max(100, t('profile.validation.locationMaxLength')).optional().or(z.literal("")),
});

type ProfileFormData = {
  name: string;
  bio?: string;
  company?: string;
  website?: string;
  location?: string;
};

interface ProfileData {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  company: string | null;
  website: string | null;
  location: string | null;
  isEmailVerified: boolean;
  createdAt: string;
}

interface AvatarsData {
  avatars: string[];
}

export default function Profile() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ["/api/profile"],
  });

  const { data: avatarsData } = useQuery<AvatarsData>({
    queryKey: ["/api/avatars"],
  });

  const profileSchema = createProfileSchema(t);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: profile ? {
      name: profile.name || "",
      bio: profile.bio || "",
      company: profile.company || "",
      website: profile.website || "",
      location: profile.location || "",
    } : undefined,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      return await apiRequest("PUT", "/api/profile", data).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: t('toast.success'),
        description: t('profile.toast.profileUpdated'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.error'),
        description: error.message || t('profile.toast.profileUpdateFailed'),
        variant: "destructive",
      });
    },
  });

  const updateAvatarMutation = useMutation({
    mutationFn: async (avatar: string) => {
      return await apiRequest("PUT", "/api/profile", { avatar }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      setIsAvatarDialogOpen(false);
      setUploadPreview(null);
      toast({
        title: t('toast.success'),
        description: t('profile.toast.avatarUpdated'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.error'),
        description: error.message || t('profile.toast.avatarUpdateFailed'),
        variant: "destructive",
      });
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const getCookie = (name: string): string | null => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
          return parts.pop()?.split(';').shift() || null;
        }
        return null;
      };
      
      const csrfToken = getCookie("csrf_token");
      const headers: Record<string, string> = {};
      if (csrfToken) {
        headers["x-csrf-token"] = csrfToken;
      }
      
      const response = await fetch("/api/upload-avatar", {
        method: "POST",
        headers,
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload avatar");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      setIsAvatarDialogOpen(false);
      setUploadPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast({
        title: t('toast.success'),
        description: t('profile.toast.photoUploaded'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.error'),
        description: error.message || t('profile.toast.photoUploadFailed'),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const handleAvatarSelect = (avatar: string) => {
    updateAvatarMutation.mutate(avatar);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: t('profile.avatar.fileTooLarge'),
          description: t('profile.avatar.fileSizeError'),
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadAvatar = () => {
    const file = fileInputRef.current?.files?.[0];
    if (file) {
      uploadAvatarMutation.mutate(file);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('profile.loading')}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">{t('profile.notFound')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const avatars = avatarsData?.avatars || [];

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.title')}</CardTitle>
            <CardDescription>{t('profile.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24" data-testid="img-profile-avatar">
                  <AvatarImage src={profile.avatar || ""} alt={profile.name} />
                  <AvatarFallback className="text-2xl">
                    {profile.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                      data-testid="button-change-avatar"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{t('profile.avatar.selectOrUpload')}</DialogTitle>
                    </DialogHeader>
                    <Tabs defaultValue="preset" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="preset" data-testid="tab-preset-avatars">{t('profile.avatar.presetTab')}</TabsTrigger>
                        <TabsTrigger value="upload" data-testid="tab-upload-avatar">{t('profile.avatar.uploadTab')}</TabsTrigger>
                      </TabsList>
                      <TabsContent value="preset" className="mt-4">
                        <div className="grid grid-cols-5 gap-4">
                          {avatars.map((avatar: string, index: number) => (
                            <button
                              key={index}
                              onClick={() => handleAvatarSelect(avatar)}
                              className="relative hover-elevate active-elevate-2 rounded-md overflow-hidden aspect-square"
                              data-testid={`button-avatar-${index + 1}`}
                              disabled={updateAvatarMutation.isPending}
                            >
                              <img
                                src={avatar}
                                alt={`Avatar ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              {profile.avatar === avatar && (
                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                  <div className="bg-primary text-primary-foreground rounded-full p-2">
                                    ✓
                                  </div>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </TabsContent>
                      <TabsContent value="upload" className="mt-4">
                        <div className="space-y-4">
                          <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed rounded-md">
                            {uploadPreview ? (
                              <div className="relative">
                                <img
                                  src={uploadPreview}
                                  alt="Preview"
                                  className="w-32 h-32 rounded-full object-cover"
                                />
                                <Button
                                  size="icon"
                                  variant="secondary"
                                  className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
                                  onClick={() => {
                                    setUploadPreview(null);
                                    if (fileInputRef.current) {
                                      fileInputRef.current.value = '';
                                    }
                                  }}
                                  data-testid="button-remove-preview"
                                >
                                  ✕
                                </Button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2">
                                <Upload className="h-12 w-12 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                  {t('profile.avatar.choosePhoto')}
                                </p>
                              </div>
                            )}
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/jpeg,image/png,image/jpg,image/webp"
                              onChange={handleFileChange}
                              className="hidden"
                              data-testid="input-file-avatar"
                            />
                            <Button
                              onClick={() => fileInputRef.current?.click()}
                              variant="outline"
                              disabled={uploadAvatarMutation.isPending}
                              data-testid="button-choose-file"
                            >
                              <Camera className="h-4 w-4 mr-2" />
                              {t('profile.avatar.chooseFile')}
                            </Button>
                            <p className="text-xs text-muted-foreground">
                              {t('profile.avatar.fileSize')}
                            </p>
                          </div>
                          {uploadPreview && (
                            <Button
                              onClick={handleUploadAvatar}
                              className="w-full"
                              disabled={uploadAvatarMutation.isPending}
                              data-testid="button-upload-avatar"
                            >
                              {uploadAvatarMutation.isPending ? t('profile.avatar.uploading') : t('profile.avatar.uploadPhoto')}
                            </Button>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>
              </div>
              <div>
                <h2 className="text-2xl font-bold" data-testid="text-profile-name">{profile.name}</h2>
                <p className="text-muted-foreground" data-testid="text-profile-email">{profile.email}</p>
                {profile.bio && (
                  <p className="text-sm mt-2" data-testid="text-profile-bio">{profile.bio}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5" />
              {t('profile.form.editProfile')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('profile.form.nameLabel')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input {...field} className="pl-10" placeholder={t('profile.form.namePlaceholder')} data-testid="input-name" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('profile.form.bioLabel')}</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder={t('profile.form.bioPlaceholder')}
                          className="resize-none"
                          rows={3}
                          data-testid="input-bio"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('profile.form.companyLabel')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input {...field} className="pl-10" placeholder={t('profile.form.companyPlaceholder')} data-testid="input-company" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('profile.form.websiteLabel')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input {...field} className="pl-10" placeholder={t('profile.form.websitePlaceholder')} data-testid="input-website" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('profile.form.locationLabel')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input {...field} className="pl-10" placeholder={t('profile.form.locationPlaceholder')} data-testid="input-location" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.reset()}
                    disabled={updateProfileMutation.isPending}
                    data-testid="button-reset"
                  >
                    {t('profile.form.reset')}
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    data-testid="button-save"
                  >
                    {updateProfileMutation.isPending ? t('profile.form.saving') : t('profile.form.saveChanges')}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
