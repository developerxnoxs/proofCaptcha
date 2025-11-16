import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Eye, EyeOff, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { ApiKey } from "@shared/schema";
import { useTranslation } from "react-i18next";
import ApiKeySettingsDialog from "@/components/ApiKeySettingsDialog";

interface ApiKeyCardProps {
  apiKey: ApiKey;
  onToggleStatus?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function ApiKeyCard({ apiKey, onToggleStatus, onDelete }: ApiKeyCardProps) {
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t('apiKeys.card.copied'),
      description: `${label} ${t('toast.copiedToClipboard')}`,
    });
  };

  const maskKey = (key: string) => {
    return key.slice(0, 8) + "•".repeat(20) + key.slice(-4);
  };

  return (
    <Card data-testid={`card-apikey-${apiKey.id}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-4">
        <div className="space-y-1 flex-1">
          <CardTitle className="text-lg" data-testid="text-name">
            {apiKey.name}
          </CardTitle>
          {apiKey.domain && (
            <p className="text-sm text-muted-foreground" data-testid="text-domain">
              {t('apiKeys.card.domainLabel')}{apiKey.domain}
            </p>
          )}
        </div>
        <Badge
          variant={apiKey.isActive ? "default" : "secondary"}
          data-testid={`badge-status-${apiKey.isActive ? "active" : "inactive"}`}
        >
          {apiKey.isActive ? t('apiKeys.card.active') : t('apiKeys.card.inactive')}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('apiKeys.card.siteKey')}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(apiKey.sitekey, t('apiKeys.card.siteKey'))}
              data-testid="button-copy-public"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <code
            className="block text-xs bg-muted p-2 rounded font-mono"
            data-testid="text-public-key"
          >
            {apiKey.sitekey}
          </code>
          <p className="text-xs text-muted-foreground">
            {t('apiKeys.card.siteKeyHelpText')}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('apiKeys.card.secretKey')}</span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPrivateKey(!showPrivateKey)}
                data-testid="button-toggle-visibility"
              >
                {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(apiKey.secretkey, t('apiKeys.card.secretKey'))}
                data-testid="button-copy-private"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <code
            className="block text-xs bg-muted p-2 rounded font-mono"
            data-testid="text-private-key"
          >
            {showPrivateKey ? apiKey.secretkey : maskKey(apiKey.secretkey)}
          </code>
          <p className="text-xs text-muted-foreground">
            {t('apiKeys.card.secretKeyHelpText')}
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleStatus?.(apiKey.id)}
              data-testid="button-toggle-status"
              className="flex-1"
            >
              {apiKey.isActive ? (
                <>
                  <ToggleLeft className="h-4 w-4 mr-2" />
                  {t('apiKeys.card.deactivate')}
                </>
              ) : (
                <>
                  <ToggleRight className="h-4 w-4 mr-2" />
                  {t('apiKeys.card.activate')}
                </>
              )}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete?.(apiKey.id)}
              data-testid="button-delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          
          <ApiKeySettingsDialog apiKeyId={apiKey.id} apiKeyName={apiKey.name} />
        </div>
      </CardContent>
    </Card>
  );
}
