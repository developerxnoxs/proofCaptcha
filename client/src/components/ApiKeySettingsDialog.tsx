import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Settings, AlertTriangle, Shield, Zap, Lock, Brain, Activity, Clock, X, ChevronsUpDown, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SecuritySettings } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { COUNTRIES } from "@/lib/countries";
import { cn } from "@/lib/utils";

interface ApiKeySettingsDialogProps {
  apiKeyId: string;
  apiKeyName: string;
}

export default function ApiKeySettingsDialog({ apiKeyId, apiKeyName }: ApiKeySettingsDialogProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [showWarning, setShowWarning] = useState<{ feature: string; show: boolean } | null>(null);
  const [countryPopoverOpen, setCountryPopoverOpen] = useState(false);
  const { toast } = useToast();

  // Load settings from API
  const { data: loadedSettings, isLoading } = useQuery<SecuritySettings>({
    queryKey: ["/api/keys", apiKeyId, "settings"],
    enabled: isOpen,
  });

  // Initialize local state when data loads
  useEffect(() => {
    if (loadedSettings) {
      setSettings(loadedSettings);
    }
  }, [loadedSettings]);

  const saveMutation = useMutation({
    mutationFn: async (data: SecuritySettings) => {
      const res = await apiRequest("PUT", `/api/keys/${apiKeyId}/settings`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keys", apiKeyId, "settings"] });
      setIsOpen(false);
      toast({
        title: t("apiKeys.settings.toast.saved.title"),
        description: t("apiKeys.settings.toast.saved.description"),
      });
    },
    onError: () => {
      toast({
        title: t("apiKeys.settings.toast.error.title"),
        description: t("apiKeys.settings.toast.error.description"),
        variant: "destructive",
      });
    },
  });

  const handleToggleFeature = (feature: string, currentValue: boolean) => {
    if (!settings) return;

    // If trying to disable a security feature, show warning first
    if (currentValue === true) {
      setShowWarning({ feature, show: true });
    } else {
      // Enabling feature - no warning needed
      setSettings({ ...settings, [feature]: true });
    }
  };

  const confirmDisable = () => {
    if (!settings || !showWarning) return;
    setSettings({ ...settings, [showWarning.feature]: false });
    setShowWarning(null);
  };

  const handleSave = () => {
    if (!settings) return;
    saveMutation.mutate(settings);
  };

  if (!settings) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" data-testid={`button-settings-${apiKeyId}`}>
            <Settings className="h-4 w-4 mr-2" />
            {t("apiKeys.settings.button")}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("apiKeys.settings.title")}</DialogTitle>
            <DialogDescription>
              {t("apiKeys.settings.loading", { name: apiKeyName })}
            </DialogDescription>
          </DialogHeader>
          {isLoading && <p>{t("common.loading")}</p>}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" data-testid={`button-settings-${apiKeyId}`}>
            <Settings className="h-4 w-4 mr-2" />
            {t("apiKeys.settings.button")}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("apiKeys.settings.titleFull")}</DialogTitle>
            <DialogDescription>
              {t("apiKeys.settings.description", { name: apiKeyName })}
            </DialogDescription>
          </DialogHeader>
          
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>{t("apiKeys.settings.coreSecurityTitle")}</AlertTitle>
            <AlertDescription>
              {t("apiKeys.settings.coreSecurityDescription")}
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="security" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="security">{t("apiKeys.settings.tabs.security")}</TabsTrigger>
              <TabsTrigger value="performance">{t("apiKeys.settings.tabs.performance")}</TabsTrigger>
              <TabsTrigger value="design">{t("apiKeys.settings.tabs.design")}</TabsTrigger>
            </TabsList>

            <TabsContent value="security" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-500" />
                    <CardTitle>{t("apiKeys.settings.protectionFeatures.title")}</CardTitle>
                  </div>
                  <CardDescription>
                    {t("apiKeys.settings.protectionFeatures.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Anti-Debugger */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="antiDebugger">{t("apiKeys.settings.protectionFeatures.antiDebugger.label")}</Label>
                      <p className="text-xs text-muted-foreground">
                        {t("apiKeys.settings.protectionFeatures.antiDebugger.description")}
                      </p>
                    </div>
                    <Switch
                      id="antiDebugger"
                      checked={settings.antiDebugger}
                      onCheckedChange={() => handleToggleFeature("antiDebugger", settings.antiDebugger)}
                      data-testid="switch-anti-debugger"
                    />
                  </div>

                  {/* Advanced Fingerprinting */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="advancedFingerprinting">{t("apiKeys.settings.protectionFeatures.advancedFingerprinting.label")}</Label>
                      <p className="text-xs text-muted-foreground">
                        {t("apiKeys.settings.protectionFeatures.advancedFingerprinting.description")}
                      </p>
                    </div>
                    <Switch
                      id="advancedFingerprinting"
                      checked={settings.advancedFingerprinting}
                      onCheckedChange={() => handleToggleFeature("advancedFingerprinting", settings.advancedFingerprinting)}
                      data-testid="switch-fingerprinting"
                    />
                  </div>

                  {/* Session Binding */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sessionBinding">{t("apiKeys.settings.protectionFeatures.sessionBinding.label")}</Label>
                      <p className="text-xs text-muted-foreground">
                        {t("apiKeys.settings.protectionFeatures.sessionBinding.description")}
                      </p>
                    </div>
                    <Switch
                      id="sessionBinding"
                      checked={settings.sessionBinding}
                      onCheckedChange={() => handleToggleFeature("sessionBinding", settings.sessionBinding)}
                      data-testid="switch-session-binding"
                    />
                  </div>

                  {/* CSRF Protection */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="csrfProtection">{t("apiKeys.settings.protectionFeatures.csrfProtection.label")}</Label>
                      <p className="text-xs text-muted-foreground">
                        {t("apiKeys.settings.protectionFeatures.csrfProtection.description")}
                      </p>
                    </div>
                    <Switch
                      id="csrfProtection"
                      checked={settings.csrfProtection}
                      onCheckedChange={() => handleToggleFeature("csrfProtection", settings.csrfProtection)}
                      data-testid="switch-csrf"
                    />
                  </div>

                  {/* IP Rate Limiting */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="ipRateLimiting">{t("apiKeys.settings.protectionFeatures.ipRateLimiting.label")}</Label>
                      <p className="text-xs text-muted-foreground">
                        {t("apiKeys.settings.protectionFeatures.ipRateLimiting.description")}
                      </p>
                    </div>
                    <Switch
                      id="ipRateLimiting"
                      checked={settings.ipRateLimiting}
                      onCheckedChange={() => handleToggleFeature("ipRateLimiting", settings.ipRateLimiting)}
                      data-testid="switch-rate-limit"
                    />
                  </div>

                  {/* Automation Detection */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="automationDetection">{t("apiKeys.settings.protectionFeatures.automationDetection.label")}</Label>
                      <p className="text-xs text-muted-foreground">
                        {t("apiKeys.settings.protectionFeatures.automationDetection.description")}
                      </p>
                    </div>
                    <Switch
                      id="automationDetection"
                      checked={settings.automationDetection}
                      onCheckedChange={() => handleToggleFeature("automationDetection", settings.automationDetection)}
                      data-testid="switch-automation"
                    />
                  </div>

                  {/* Behavioral Analysis */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="behavioralAnalysis">{t("apiKeys.settings.protectionFeatures.behavioralAnalysis.label")}</Label>
                      <p className="text-xs text-muted-foreground">
                        {t("apiKeys.settings.protectionFeatures.behavioralAnalysis.description")}
                      </p>
                    </div>
                    <Switch
                      id="behavioralAnalysis"
                      checked={settings.behavioralAnalysis}
                      onCheckedChange={() => handleToggleFeature("behavioralAnalysis", settings.behavioralAnalysis)}
                      data-testid="switch-behavioral"
                    />
                  </div>

                  {/* Risk Adaptive Difficulty */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="riskAdaptiveDifficulty">{t("apiKeys.settings.protectionFeatures.riskAdaptiveDifficulty.label")}</Label>
                      <p className="text-xs text-muted-foreground">
                        {t("apiKeys.settings.protectionFeatures.riskAdaptiveDifficulty.description")}
                      </p>
                    </div>
                    <Switch
                      id="riskAdaptiveDifficulty"
                      checked={settings.riskAdaptiveDifficulty}
                      onCheckedChange={() => handleToggleFeature("riskAdaptiveDifficulty", settings.riskAdaptiveDifficulty)}
                      data-testid="switch-adaptive"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* IP and Country Blocking */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-red-500" />
                    <CardTitle>{t("apiKeys.settings.accessControl.title")}</CardTitle>
                  </div>
                  <CardDescription>
                    {t("apiKeys.settings.accessControl.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Blocked IPs */}
                  <div className="space-y-2">
                    <Label htmlFor="blockedIps">{t("apiKeys.settings.accessControl.blockedIps.label")}</Label>
                    <Input
                      id="blockedIps"
                      placeholder={t("apiKeys.settings.accessControl.blockedIps.placeholder")}
                      value={(settings.blockedIps || []).join(', ')}
                      onChange={(e) => {
                        const ips = e.target.value.split(',').map(ip => ip.trim()).filter(ip => ip.length > 0);
                        setSettings({ ...settings, blockedIps: ips });
                      }}
                      data-testid="input-blocked-ips"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("apiKeys.settings.accessControl.blockedIps.helpText")}
                    </p>
                  </div>

                  {/* Blocked Countries */}
                  <div className="space-y-2">
                    <Label>{t("apiKeys.settings.accessControl.blockedCountries.label")}</Label>
                    
                    {/* Selected Countries as Badges */}
                    {settings.blockedCountries && settings.blockedCountries.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-2 border rounded-md">
                        {settings.blockedCountries.map((code) => {
                          const country = COUNTRIES.find(c => c.code === code);
                          return (
                            <Badge key={code} variant="secondary" className="gap-1">
                              {country?.name || code}
                              <button
                                type="button"
                                onClick={() => {
                                  setSettings({
                                    ...settings,
                                    blockedCountries: settings.blockedCountries?.filter(c => c !== code) || []
                                  });
                                }}
                                className="ml-1 hover:bg-muted rounded-full"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}

                    {/* Country Selector */}
                    <Popover open={countryPopoverOpen} onOpenChange={setCountryPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={countryPopoverOpen}
                          className="w-full justify-between"
                          data-testid="button-select-countries"
                        >
                          {t("apiKeys.settings.accessControl.blockedCountries.placeholder")}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder={t("apiKeys.settings.accessControl.blockedCountries.search")} />
                          <CommandList>
                            <CommandEmpty>{t("apiKeys.settings.accessControl.blockedCountries.noResults")}</CommandEmpty>
                            <CommandGroup>
                              {COUNTRIES.map((country) => {
                                const isSelected = settings.blockedCountries?.includes(country.code);
                                return (
                                  <CommandItem
                                    key={country.code}
                                    value={`${country.name} ${country.code}`}
                                    onSelect={() => {
                                      const currentCountries = settings.blockedCountries || [];
                                      if (isSelected) {
                                        setSettings({
                                          ...settings,
                                          blockedCountries: currentCountries.filter(c => c !== country.code)
                                        });
                                      } else {
                                        setSettings({
                                          ...settings,
                                          blockedCountries: [...currentCountries, country.code]
                                        });
                                      }
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        isSelected ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {country.name}
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    
                    <p className="text-xs text-muted-foreground">
                      {t("apiKeys.settings.accessControl.blockedCountries.helpText")}
                    </p>
                  </div>

                  {(settings.blockedIps && settings.blockedIps.length > 0) || (settings.blockedCountries && settings.blockedCountries.length > 0) ? (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>{t("apiKeys.settings.accessControl.restrictionsActive.title")}</AlertTitle>
                      <AlertDescription>
                        {settings.blockedIps && settings.blockedIps.length > 0 && (
                          <div>{t("apiKeys.settings.accessControl.restrictionsActive.blockingIps", { count: settings.blockedIps.length })}</div>
                        )}
                        {settings.blockedCountries && settings.blockedCountries.length > 0 && (
                          <div>{t("apiKeys.settings.accessControl.restrictionsActive.blockingCountries", { count: settings.blockedCountries.length })}</div>
                        )}
                      </AlertDescription>
                    </Alert>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    <CardTitle>{t("apiKeys.settings.performanceSettings.title")}</CardTitle>
                  </div>
                  <CardDescription>
                    {t("apiKeys.settings.performanceSettings.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Proof of Work Difficulty */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="powDifficulty">{t("apiKeys.settings.performanceSettings.powDifficulty.label")}</Label>
                      <span className="text-sm font-medium">{settings.proofOfWorkDifficulty}/10</span>
                    </div>
                    <Slider
                      id="powDifficulty"
                      min={1}
                      max={10}
                      step={1}
                      value={[settings.proofOfWorkDifficulty]}
                      onValueChange={(value) => setSettings({ ...settings, proofOfWorkDifficulty: value[0] })}
                      data-testid="slider-difficulty"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("apiKeys.settings.performanceSettings.powDifficulty.helpText")}
                    </p>
                  </div>

                  {/* Rate Limit Settings */}
                  <div className="space-y-2">
                    <Label htmlFor="rateLimit">{t("apiKeys.settings.performanceSettings.rateLimit.label")}</Label>
                    <Input
                      id="rateLimit"
                      type="number"
                      min={1}
                      max={1000}
                      value={settings.rateLimitMaxRequests}
                      onChange={(e) => setSettings({ ...settings, rateLimitMaxRequests: parseInt(e.target.value) || 30 })}
                      data-testid="input-rate-limit"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("apiKeys.settings.performanceSettings.rateLimit.helpText")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="design" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-500" />
                    <CardTitle>{t("apiKeys.settings.challengeDesign.title")}</CardTitle>
                  </div>
                  <CardDescription>
                    {t("apiKeys.settings.challengeDesign.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Challenge Timeout */}
                  <div className="space-y-2">
                    <Label htmlFor="challengeTimeout">{t("apiKeys.settings.challengeDesign.challengeTimeout.label")}</Label>
                    <Input
                      id="challengeTimeout"
                      type="number"
                      min={10}
                      max={300}
                      value={settings.challengeTimeoutMs / 1000}
                      onChange={(e) => setSettings({ ...settings, challengeTimeoutMs: (parseInt(e.target.value) || 60) * 1000 })}
                      data-testid="input-challenge-timeout"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("apiKeys.settings.challengeDesign.challengeTimeout.helpText")}
                    </p>
                  </div>

                  {/* Token Expiry */}
                  <div className="space-y-2">
                    <Label htmlFor="tokenExpiry">{t("apiKeys.settings.challengeDesign.tokenExpiry.label")}</Label>
                    <Input
                      id="tokenExpiry"
                      type="number"
                      min={30}
                      max={600}
                      value={settings.tokenExpiryMs / 1000}
                      onChange={(e) => setSettings({ ...settings, tokenExpiryMs: (parseInt(e.target.value) || 60) * 1000 })}
                      data-testid="input-token-expiry"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("apiKeys.settings.challengeDesign.tokenExpiry.helpText")}
                    </p>
                  </div>

                  {/* Challenge Types */}
                  <div className="space-y-2">
                    <Label>{t("apiKeys.settings.challengeDesign.enabledTypes.label")}</Label>
                    <div className="space-y-2">
                      {[
                        { value: 'grid', label: t("apiKeys.settings.challengeDesign.enabledTypes.grid") },
                        { value: 'jigsaw', label: t("apiKeys.settings.challengeDesign.enabledTypes.jigsaw") },
                        { value: 'gesture', label: t("apiKeys.settings.challengeDesign.enabledTypes.gesture") },
                        { value: 'upside_down', label: t("apiKeys.settings.challengeDesign.enabledTypes.upsideDown") },
                      ].map((type) => (
                        <div key={type.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`type-${type.value}`}
                            checked={settings.enabledChallengeTypes.includes(type.value as any)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSettings({
                                  ...settings,
                                  enabledChallengeTypes: [...settings.enabledChallengeTypes, type.value as any]
                                });
                              } else {
                                setSettings({
                                  ...settings,
                                  enabledChallengeTypes: settings.enabledChallengeTypes.filter(t => t !== type.value)
                                });
                              }
                            }}
                            data-testid={`checkbox-${type.value}`}
                          />
                          <Label htmlFor={`type-${type.value}`} className="font-normal cursor-pointer">
                            {type.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {settings.enabledChallengeTypes.length === 0 && (
                      <p className="text-xs text-destructive">
                        {t("apiKeys.settings.challengeDesign.enabledTypes.atLeastOne")}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              {t("apiKeys.settings.buttons.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save-settings">
              {saveMutation.isPending ? t("apiKeys.settings.buttons.saving") : t("apiKeys.settings.buttons.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warning Dialog */}
      <Dialog open={showWarning?.show || false} onOpenChange={(open) => !open && setShowWarning(null)}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <DialogTitle>{t("apiKeys.settings.warnings.title")}</DialogTitle>
            </div>
            <DialogDescription>
              {t("apiKeys.settings.warnings.description")}
            </DialogDescription>
          </DialogHeader>
          
          {showWarning && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{t(`apiKeys.settings.warnings.${showWarning.feature}.title`)}</AlertTitle>
              <AlertDescription>
                {t(`apiKeys.settings.warnings.${showWarning.feature}.description`)}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWarning(null)}>
              {t("apiKeys.settings.buttons.cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmDisable} data-testid="button-confirm-disable">
              {t("apiKeys.settings.buttons.disableAnyway")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
