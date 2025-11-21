import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, MapPin, Briefcase, Calendar, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';

interface DeveloperProfile {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  company: string | null;
  website: string | null;
  location: string | null;
  createdAt: string;
}

interface DeveloperProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  developerId: string;
  developerName: string;
  developerAvatar: string | null;
}

export function DeveloperProfileDialog({
  open,
  onOpenChange,
  developerId,
  developerName,
  developerAvatar,
}: DeveloperProfileDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [profile, setProfile] = useState<DeveloperProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && developerId) {
      fetchProfile();
    }
  }, [open, developerId]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/developers/${developerId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setProfile(data);
    } catch (error) {
      console.error('Error fetching developer profile:', error);
      toast({
        title: t('toast.error'),
        description: t('profile.fetchError'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'long',
    }).format(date);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-developer-profile">
        <DialogHeader>
          <DialogTitle data-testid="text-dialog-title">{t('profile.title')}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12" data-testid="loader-profile">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Avatar and Name */}
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24" data-testid="avatar-profile">
                {profile.avatar && (
                  <AvatarImage src={profile.avatar} alt={profile.name} />
                )}
                <AvatarFallback className="text-2xl">
                  {getInitials(profile.name)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="text-2xl font-bold" data-testid="text-developer-name">
                  {profile.name}
                </h3>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground" data-testid="text-joined-date">
                    {t('profile.joinedOn')} {formatDate(profile.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">
                  {t('profile.bio')}
                </h4>
                <p className="text-sm leading-relaxed" data-testid="text-bio">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Additional Info */}
            <div className="space-y-3">
              {profile.company && (
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm" data-testid="text-company">
                    {profile.company}
                  </span>
                </div>
              )}

              {profile.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm" data-testid="text-location">
                    {profile.location}
                  </span>
                </div>
              )}

              {profile.website && (
                <div className="flex items-center gap-3">
                  <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline break-all"
                    data-testid="link-website"
                  >
                    {profile.website}
                  </a>
                </div>
              )}
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-4">
              <Button
                onClick={() => onOpenChange(false)}
                data-testid="button-close-profile"
              >
                {t('profile.close')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {t('profile.notFound')}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
