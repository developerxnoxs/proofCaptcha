import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Settings, AlertTriangle, Shield, Zap, Lock, Brain, Activity, Clock, X, ChevronsUpDown, Check, Palette, MessageSquare, Languages, Image, Sparkles, Repeat, Database, Globe, Eye, Keyboard, FileText } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { DEFAULT_SECURITY_SETTINGS } from "@shared/schema";
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

                  {/* Anti-VPN */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="antiVpn">{t("apiKeys.settings.protectionFeatures.antiVpn.label")}</Label>
                      <p className="text-xs text-muted-foreground">
                        {t("apiKeys.settings.protectionFeatures.antiVpn.description")}
                      </p>
                    </div>
                    <Switch
                      id="antiVpn"
                      checked={settings.antiVpn}
                      onCheckedChange={() => handleToggleFeature("antiVpn", settings.antiVpn)}
                      data-testid="switch-anti-vpn"
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

              {/* ML/Bot Scoring Configuration */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-500" />
                    <CardTitle>{t("apiKeys.settings.mlScoring.title")}</CardTitle>
                  </div>
                  <CardDescription>
                    {t("apiKeys.settings.mlScoring.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Enable ML Scoring */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="mlScoringEnabled">{t("apiKeys.settings.mlScoring.enableLabel")}</Label>
                      <p className="text-xs text-muted-foreground">
                        {t("apiKeys.settings.mlScoring.enableDescription")}
                      </p>
                    </div>
                    <Switch
                      id="mlScoringEnabled"
                      checked={settings.mlScoringConfig?.enabled ?? true}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        mlScoringConfig: {
                          ...settings.mlScoringConfig!,
                          enabled: checked
                        }
                      })}
                      data-testid="switch-ml-scoring"
                    />
                  </div>

                  {settings.mlScoringConfig?.enabled && (
                    <>
                      {/* Sensitivity Level */}
                      <div className="space-y-2">
                        <Label htmlFor="mlSensitivity">{t("apiKeys.settings.mlScoring.sensitivityLabel")}</Label>
                        <Select
                          value={settings.mlScoringConfig?.sensitivity || 'medium'}
                          onValueChange={(value: 'low' | 'medium' | 'high' | 'paranoid') => setSettings({
                            ...settings,
                            mlScoringConfig: {
                              ...settings.mlScoringConfig!,
                              sensitivity: value
                            }
                          })}
                        >
                          <SelectTrigger id="mlSensitivity" data-testid="select-ml-sensitivity">
                            <SelectValue placeholder={t("apiKeys.settings.mlScoring.sensitivityPlaceholder")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">{t("apiKeys.settings.mlScoring.sensitivityLow")}</SelectItem>
                            <SelectItem value="medium">{t("apiKeys.settings.mlScoring.sensitivityMedium")}</SelectItem>
                            <SelectItem value="high">{t("apiKeys.settings.mlScoring.sensitivityHigh")}</SelectItem>
                            <SelectItem value="paranoid">{t("apiKeys.settings.mlScoring.sensitivityParanoid")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {t("apiKeys.settings.mlScoring.sensitivityHelpText")}
                        </p>
                      </div>

                      {/* Ensemble Mode */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="mlEnsemble">{t("apiKeys.settings.mlScoring.ensembleLabel")}</Label>
                          <p className="text-xs text-muted-foreground">
                            {t("apiKeys.settings.mlScoring.ensembleDescription")}
                          </p>
                        </div>
                        <Switch
                          id="mlEnsemble"
                          checked={settings.mlScoringConfig?.useEnsemble ?? true}
                          onCheckedChange={(checked) => setSettings({
                            ...settings,
                            mlScoringConfig: {
                              ...settings.mlScoringConfig!,
                              useEnsemble: checked
                            }
                          })}
                          data-testid="switch-ml-ensemble"
                        />
                      </div>

                      {/* Feature Weights */}
                      <div className="space-y-4 p-4 border rounded-lg">
                        <h4 className="text-sm font-medium">{t("apiKeys.settings.mlScoring.featureWeights.title")}</h4>
                        <p className="text-xs text-muted-foreground mb-4">
                          {t("apiKeys.settings.mlScoring.featureWeights.description")}
                        </p>

                        {/* Automation Weight */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs">{t("apiKeys.settings.mlScoring.featureWeights.automation")}</Label>
                            <span className="text-xs font-medium">{(settings.mlScoringConfig?.automationWeight || 0.25).toFixed(2)}</span>
                          </div>
                          <Slider
                            min={0}
                            max={1}
                            step={0.05}
                            value={[settings.mlScoringConfig?.automationWeight || 0.25]}
                            onValueChange={(value) => setSettings({
                              ...settings,
                              mlScoringConfig: {
                                ...settings.mlScoringConfig!,
                                automationWeight: value[0]
                              }
                            })}
                            data-testid="slider-ml-automation-weight"
                          />
                        </div>

                        {/* Behavioral Weight */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs">{t("apiKeys.settings.mlScoring.featureWeights.behavioral")}</Label>
                            <span className="text-xs font-medium">{(settings.mlScoringConfig?.behavioralWeight || 0.20).toFixed(2)}</span>
                          </div>
                          <Slider
                            min={0}
                            max={1}
                            step={0.05}
                            value={[settings.mlScoringConfig?.behavioralWeight || 0.20]}
                            onValueChange={(value) => setSettings({
                              ...settings,
                              mlScoringConfig: {
                                ...settings.mlScoringConfig!,
                                behavioralWeight: value[0]
                              }
                            })}
                            data-testid="slider-ml-behavioral-weight"
                          />
                        </div>

                        {/* Fingerprint Weight */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs">{t("apiKeys.settings.mlScoring.featureWeights.fingerprint")}</Label>
                            <span className="text-xs font-medium">{(settings.mlScoringConfig?.fingerprintWeight || 0.15).toFixed(2)}</span>
                          </div>
                          <Slider
                            min={0}
                            max={1}
                            step={0.05}
                            value={[settings.mlScoringConfig?.fingerprintWeight || 0.15]}
                            onValueChange={(value) => setSettings({
                              ...settings,
                              mlScoringConfig: {
                                ...settings.mlScoringConfig!,
                                fingerprintWeight: value[0]
                              }
                            })}
                            data-testid="slider-ml-fingerprint-weight"
                          />
                        </div>

                        {/* Reputation Weight */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs">{t("apiKeys.settings.mlScoring.featureWeights.reputation")}</Label>
                            <span className="text-xs font-medium">{(settings.mlScoringConfig?.reputationWeight || 0.15).toFixed(2)}</span>
                          </div>
                          <Slider
                            min={0}
                            max={1}
                            step={0.05}
                            value={[settings.mlScoringConfig?.reputationWeight || 0.15]}
                            onValueChange={(value) => setSettings({
                              ...settings,
                              mlScoringConfig: {
                                ...settings.mlScoringConfig!,
                                reputationWeight: value[0]
                              }
                            })}
                            data-testid="slider-ml-reputation-weight"
                          />
                        </div>

                        {/* Anomaly Weight */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs">{t("apiKeys.settings.mlScoring.featureWeights.anomaly")}</Label>
                            <span className="text-xs font-medium">{(settings.mlScoringConfig?.anomalyWeight || 0.15).toFixed(2)}</span>
                          </div>
                          <Slider
                            min={0}
                            max={1}
                            step={0.05}
                            value={[settings.mlScoringConfig?.anomalyWeight || 0.15]}
                            onValueChange={(value) => setSettings({
                              ...settings,
                              mlScoringConfig: {
                                ...settings.mlScoringConfig!,
                                anomalyWeight: value[0]
                              }
                            })}
                            data-testid="slider-ml-anomaly-weight"
                          />
                        </div>

                        {/* Temporal Weight */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs">{t("apiKeys.settings.mlScoring.featureWeights.temporal")}</Label>
                            <span className="text-xs font-medium">{(settings.mlScoringConfig?.temporalWeight || 0.10).toFixed(2)}</span>
                          </div>
                          <Slider
                            min={0}
                            max={1}
                            step={0.05}
                            value={[settings.mlScoringConfig?.temporalWeight || 0.10]}
                            onValueChange={(value) => setSettings({
                              ...settings,
                              mlScoringConfig: {
                                ...settings.mlScoringConfig!,
                                temporalWeight: value[0]
                              }
                            })}
                            data-testid="slider-ml-temporal-weight"
                          />
                        </div>

                        {/* Weight Sum Display */}
                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{t("apiKeys.settings.mlScoring.featureWeights.totalWeight")}</span>
                            <Badge variant={
                              Math.abs((
                                (settings.mlScoringConfig?.automationWeight || 0) +
                                (settings.mlScoringConfig?.behavioralWeight || 0) +
                                (settings.mlScoringConfig?.fingerprintWeight || 0) +
                                (settings.mlScoringConfig?.reputationWeight || 0) +
                                (settings.mlScoringConfig?.anomalyWeight || 0) +
                                (settings.mlScoringConfig?.temporalWeight || 0)
                              ) - 1.0) < 0.05 ? 'default' : 'destructive'
                            }>
                              {(
                                (settings.mlScoringConfig?.automationWeight || 0) +
                                (settings.mlScoringConfig?.behavioralWeight || 0) +
                                (settings.mlScoringConfig?.fingerprintWeight || 0) +
                                (settings.mlScoringConfig?.reputationWeight || 0) +
                                (settings.mlScoringConfig?.anomalyWeight || 0) +
                                (settings.mlScoringConfig?.temporalWeight || 0)
                              ).toFixed(2)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {t("apiKeys.settings.mlScoring.featureWeights.optimal")}
                          </p>
                        </div>
                      </div>

                      {/* Risk Thresholds */}
                      <div className="space-y-4 p-4 border rounded-lg">
                        <h4 className="text-sm font-medium">{t("apiKeys.settings.mlScoring.thresholds.title")}</h4>
                        <p className="text-xs text-muted-foreground mb-4">
                          {t("apiKeys.settings.mlScoring.thresholds.description")}
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="thresholdLow" className="text-xs">{t("apiKeys.settings.mlScoring.thresholds.low")}</Label>
                            <Input
                              id="thresholdLow"
                              type="number"
                              min={0}
                              max={100}
                              value={settings.mlScoringConfig?.thresholds?.low || 20}
                              onChange={(e) => setSettings({
                                ...settings,
                                mlScoringConfig: {
                                  ...settings.mlScoringConfig!,
                                  thresholds: {
                                    ...settings.mlScoringConfig!.thresholds,
                                    low: parseInt(e.target.value) || 20
                                  }
                                }
                              })}
                              data-testid="input-ml-threshold-low"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="thresholdMedium" className="text-xs">{t("apiKeys.settings.mlScoring.thresholds.medium")}</Label>
                            <Input
                              id="thresholdMedium"
                              type="number"
                              min={0}
                              max={100}
                              value={settings.mlScoringConfig?.thresholds?.medium || 40}
                              onChange={(e) => setSettings({
                                ...settings,
                                mlScoringConfig: {
                                  ...settings.mlScoringConfig!,
                                  thresholds: {
                                    ...settings.mlScoringConfig!.thresholds,
                                    medium: parseInt(e.target.value) || 40
                                  }
                                }
                              })}
                              data-testid="input-ml-threshold-medium"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="thresholdHigh" className="text-xs">{t("apiKeys.settings.mlScoring.thresholds.high")}</Label>
                            <Input
                              id="thresholdHigh"
                              type="number"
                              min={0}
                              max={100}
                              value={settings.mlScoringConfig?.thresholds?.high || 65}
                              onChange={(e) => setSettings({
                                ...settings,
                                mlScoringConfig: {
                                  ...settings.mlScoringConfig!,
                                  thresholds: {
                                    ...settings.mlScoringConfig!.thresholds,
                                    high: parseInt(e.target.value) || 65
                                  }
                                }
                              })}
                              data-testid="input-ml-threshold-high"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="thresholdCritical" className="text-xs">{t("apiKeys.settings.mlScoring.thresholds.critical")}</Label>
                            <Input
                              id="thresholdCritical"
                              type="number"
                              min={0}
                              max={100}
                              value={settings.mlScoringConfig?.thresholds?.critical || 85}
                              onChange={(e) => setSettings({
                                ...settings,
                                mlScoringConfig: {
                                  ...settings.mlScoringConfig!,
                                  thresholds: {
                                    ...settings.mlScoringConfig!.thresholds,
                                    critical: parseInt(e.target.value) || 85
                                  }
                                }
                              })}
                              data-testid="input-ml-threshold-critical"
                            />
                          </div>
                        </div>
                      </div>

                      {/* ML Info Alert */}
                      <Alert>
                        <Activity className="h-4 w-4" />
                        <AlertTitle>{t("apiKeys.settings.mlScoring.info.title")}</AlertTitle>
                        <AlertDescription>
                          {t("apiKeys.settings.mlScoring.info.description")}
                        </AlertDescription>
                      </Alert>
                    </>
                  )}
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
                        { value: 'audio', label: t("apiKeys.settings.challengeDesign.enabledTypes.audio") },
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

              {/* Widget Customization - Phase 1 */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-indigo-500" />
                    <CardTitle>{t("apiKeys.settings.widgetCustomization.title")}</CardTitle>
                  </div>
                  <CardDescription>
                    {t("apiKeys.settings.widgetCustomization.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Language Settings */}
                  <div className="space-y-4 p-4 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-2">
                      <Languages className="h-4 w-4 text-blue-500" />
                      <Label className="text-base font-medium">{t("apiKeys.settings.widgetCustomization.languageSettings.title")}</Label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="autoDetectLanguage">{t("apiKeys.settings.widgetCustomization.languageSettings.autoDetect.label")}</Label>
                        <p className="text-xs text-muted-foreground">
                          {t("apiKeys.settings.widgetCustomization.languageSettings.autoDetect.description")}
                        </p>
                      </div>
                      <Switch
                        id="autoDetectLanguage"
                        checked={settings.widgetCustomization?.autoDetectLanguage ?? true}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          widgetCustomization: {
                            ...DEFAULT_SECURITY_SETTINGS.widgetCustomization,
                            ...settings.widgetCustomization,
                            autoDetectLanguage: checked,
                          }
                        })}
                        data-testid="switch-auto-detect-language"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="defaultLanguage">{t("apiKeys.settings.widgetCustomization.languageSettings.defaultLanguage.label")}</Label>
                      <Select
                        value={settings.widgetCustomization?.defaultLanguage ?? 'en'}
                        onValueChange={(value) => setSettings({
                          ...settings,
                          widgetCustomization: {
                            ...DEFAULT_SECURITY_SETTINGS.widgetCustomization,
                            ...settings.widgetCustomization,
                            defaultLanguage: value as 'en' | 'id',
                          }
                        })}
                      >
                        <SelectTrigger id="defaultLanguage" data-testid="select-default-language">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="id">Bahasa Indonesia</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {t("apiKeys.settings.widgetCustomization.languageSettings.defaultLanguage.helpText")}
                      </p>
                    </div>
                  </div>

                  {/* Branding Settings */}
                  <div className="space-y-4 p-4 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-2">
                      <Image className="h-4 w-4 text-purple-500" />
                      <Label className="text-base font-medium">{t("apiKeys.settings.widgetCustomization.branding.title")}</Label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="showBranding">{t("apiKeys.settings.widgetCustomization.branding.showBranding.label")}</Label>
                        <p className="text-xs text-muted-foreground">
                          {t("apiKeys.settings.widgetCustomization.branding.showBranding.description")}
                        </p>
                      </div>
                      <Switch
                        id="showBranding"
                        checked={settings.widgetCustomization?.showBranding ?? true}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          widgetCustomization: {
                            ...DEFAULT_SECURITY_SETTINGS.widgetCustomization,
                            ...settings.widgetCustomization,
                            showBranding: checked,
                          }
                        })}
                        data-testid="switch-show-branding"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customLogoUrl">{t("apiKeys.settings.widgetCustomization.branding.customLogoUrl.label")}</Label>
                      <Input
                        id="customLogoUrl"
                        type="url"
                        placeholder={t("apiKeys.settings.widgetCustomization.branding.customLogoUrl.placeholder")}
                        value={settings.widgetCustomization?.customLogoUrl ?? ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          widgetCustomization: {
                            ...DEFAULT_SECURITY_SETTINGS.widgetCustomization,
                            ...settings.widgetCustomization,
                            customLogoUrl: e.target.value || null,
                          }
                        })}
                        data-testid="input-custom-logo"
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("apiKeys.settings.widgetCustomization.branding.customLogoUrl.helpText")}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customBrandText">{t("apiKeys.settings.widgetCustomization.branding.customBrandText.label")}</Label>
                      <Input
                        id="customBrandText"
                        placeholder={t("apiKeys.settings.widgetCustomization.branding.customBrandText.placeholder")}
                        value={settings.widgetCustomization?.customBrandText ?? ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          widgetCustomization: {
                            ...DEFAULT_SECURITY_SETTINGS.widgetCustomization,
                            ...settings.widgetCustomization,
                            customBrandText: e.target.value || null,
                          }
                        })}
                        data-testid="input-custom-brand-text"
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("apiKeys.settings.widgetCustomization.branding.customBrandText.helpText")}
                      </p>
                    </div>
                  </div>

                  {/* Theme Settings */}
                  <div className="space-y-4 p-4 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      <Label className="text-base font-medium">{t("apiKeys.settings.widgetCustomization.themeAppearance.title")}</Label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="allowThemeSwitch">{t("apiKeys.settings.widgetCustomization.themeAppearance.allowThemeSwitch.label")}</Label>
                        <p className="text-xs text-muted-foreground">
                          {t("apiKeys.settings.widgetCustomization.themeAppearance.allowThemeSwitch.description")}
                        </p>
                      </div>
                      <Switch
                        id="allowThemeSwitch"
                        checked={settings.widgetCustomization?.allowThemeSwitch ?? false}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          widgetCustomization: {
                            ...DEFAULT_SECURITY_SETTINGS.widgetCustomization,
                            ...settings.widgetCustomization,
                            allowThemeSwitch: checked,
                          }
                        })}
                        data-testid="switch-allow-theme-switch"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="forceTheme">{t("apiKeys.settings.widgetCustomization.themeAppearance.forceTheme.label")}</Label>
                      <Select
                        value={settings.widgetCustomization?.forceTheme ?? 'auto'}
                        onValueChange={(value) => setSettings({
                          ...settings,
                          widgetCustomization: {
                            ...DEFAULT_SECURITY_SETTINGS.widgetCustomization,
                            ...settings.widgetCustomization,
                            forceTheme: value as 'light' | 'dark' | 'auto',
                          }
                        })}
                      >
                        <SelectTrigger id="forceTheme" data-testid="select-force-theme">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">{t("apiKeys.settings.widgetCustomization.themeAppearance.forceTheme.auto")}</SelectItem>
                          <SelectItem value="light">{t("apiKeys.settings.widgetCustomization.themeAppearance.forceTheme.light")}</SelectItem>
                          <SelectItem value="dark">{t("apiKeys.settings.widgetCustomization.themeAppearance.forceTheme.dark")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {t("apiKeys.settings.widgetCustomization.themeAppearance.forceTheme.helpText")}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="widgetSize">{t("apiKeys.settings.widgetCustomization.themeAppearance.widgetSize.label")}</Label>
                      <Select
                        value={settings.widgetCustomization?.widgetSize ?? 'normal'}
                        onValueChange={(value) => setSettings({
                          ...settings,
                          widgetCustomization: {
                            ...DEFAULT_SECURITY_SETTINGS.widgetCustomization,
                            ...settings.widgetCustomization,
                            widgetSize: value as 'compact' | 'normal' | 'large',
                          }
                        })}
                      >
                        <SelectTrigger id="widgetSize" data-testid="select-widget-size">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="compact">{t("apiKeys.settings.widgetCustomization.themeAppearance.widgetSize.compact")}</SelectItem>
                          <SelectItem value="normal">{t("apiKeys.settings.widgetCustomization.themeAppearance.widgetSize.normal")}</SelectItem>
                          <SelectItem value="large">{t("apiKeys.settings.widgetCustomization.themeAppearance.widgetSize.large")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {t("apiKeys.settings.widgetCustomization.themeAppearance.widgetSize.helpText")}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customWidth">{t("apiKeys.settings.widgetCustomization.themeAppearance.customWidth.label")}</Label>
                      <Input
                        id="customWidth"
                        type="number"
                        placeholder={t("apiKeys.settings.widgetCustomization.themeAppearance.customWidth.placeholder")}
                        value={settings.widgetCustomization?.customWidth ?? ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          widgetCustomization: {
                            ...DEFAULT_SECURITY_SETTINGS.widgetCustomization,
                            ...settings.widgetCustomization,
                            customWidth: e.target.value ? parseInt(e.target.value) : null,
                          }
                        })}
                        data-testid="input-custom-width"
                        min="200"
                        max="600"
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("apiKeys.settings.widgetCustomization.themeAppearance.customWidth.helpText")}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="disableAnimations">{t("apiKeys.settings.widgetCustomization.themeAppearance.disableAnimations.label")}</Label>
                        <p className="text-xs text-muted-foreground">
                          {t("apiKeys.settings.widgetCustomization.themeAppearance.disableAnimations.description")}
                        </p>
                      </div>
                      <Switch
                        id="disableAnimations"
                        checked={settings.widgetCustomization?.disableAnimations ?? false}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          widgetCustomization: {
                            ...DEFAULT_SECURITY_SETTINGS.widgetCustomization,
                            ...settings.widgetCustomization,
                            disableAnimations: checked,
                          }
                        })}
                        data-testid="switch-disable-animations"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="animationSpeed">{t("apiKeys.settings.widgetCustomization.themeAppearance.animationSpeed.label")}</Label>
                      <Select
                        value={settings.widgetCustomization?.animationSpeed ?? 'normal'}
                        onValueChange={(value) => setSettings({
                          ...settings,
                          widgetCustomization: {
                            ...DEFAULT_SECURITY_SETTINGS.widgetCustomization,
                            ...settings.widgetCustomization,
                            animationSpeed: value as 'slow' | 'normal' | 'fast',
                          }
                        })}
                      >
                        <SelectTrigger id="animationSpeed" data-testid="select-animation-speed">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="slow">{t("apiKeys.settings.widgetCustomization.themeAppearance.animationSpeed.slow")}</SelectItem>
                          <SelectItem value="normal">{t("apiKeys.settings.widgetCustomization.themeAppearance.animationSpeed.normal")}</SelectItem>
                          <SelectItem value="fast">{t("apiKeys.settings.widgetCustomization.themeAppearance.animationSpeed.fast")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {t("apiKeys.settings.widgetCustomization.themeAppearance.animationSpeed.helpText")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* User Feedback - Phase 2 */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-green-500" />
                    <CardTitle>{t("apiKeys.settings.userFeedback.title")}</CardTitle>
                  </div>
                  <CardDescription>
                    {t("apiKeys.settings.userFeedback.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Custom Error Messages */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">{t("apiKeys.settings.userFeedback.customErrorMessages.title")}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t("apiKeys.settings.userFeedback.customErrorMessages.description")}
                    </p>

                    <div className="space-y-2">
                      <Label htmlFor="errorTimeout">{t("apiKeys.settings.userFeedback.customErrorMessages.timeout.label")}</Label>
                      <Input
                        id="errorTimeout"
                        placeholder={t("apiKeys.settings.userFeedback.customErrorMessages.timeout.placeholder")}
                        value={settings.userFeedback?.customErrorMessages?.timeout ?? ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          userFeedback: {
                            ...DEFAULT_SECURITY_SETTINGS.userFeedback,
                            ...settings.userFeedback,
                            customErrorMessages: {
                              ...DEFAULT_SECURITY_SETTINGS.userFeedback?.customErrorMessages,
                              ...settings.userFeedback?.customErrorMessages,
                              timeout: e.target.value || null,
                            }
                          }
                        })}
                        data-testid="input-error-timeout"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="errorExpired">{t("apiKeys.settings.userFeedback.customErrorMessages.expired.label")}</Label>
                      <Input
                        id="errorExpired"
                        placeholder={t("apiKeys.settings.userFeedback.customErrorMessages.expired.placeholder")}
                        value={settings.userFeedback?.customErrorMessages?.expired ?? ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          userFeedback: {
                            ...DEFAULT_SECURITY_SETTINGS.userFeedback,
                            ...settings.userFeedback,
                            customErrorMessages: {
                              ...DEFAULT_SECURITY_SETTINGS.userFeedback?.customErrorMessages,
                              ...settings.userFeedback?.customErrorMessages,
                              expired: e.target.value || null,
                            }
                          }
                        })}
                        data-testid="input-error-expired"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="errorFailed">{t("apiKeys.settings.userFeedback.customErrorMessages.failed.label")}</Label>
                      <Input
                        id="errorFailed"
                        placeholder={t("apiKeys.settings.userFeedback.customErrorMessages.failed.placeholder")}
                        value={settings.userFeedback?.customErrorMessages?.failed ?? ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          userFeedback: {
                            ...DEFAULT_SECURITY_SETTINGS.userFeedback,
                            ...settings.userFeedback,
                            customErrorMessages: {
                              ...DEFAULT_SECURITY_SETTINGS.userFeedback?.customErrorMessages,
                              ...settings.userFeedback?.customErrorMessages,
                              failed: e.target.value || null,
                            }
                          }
                        })}
                        data-testid="input-error-failed"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="errorBlocked">{t("apiKeys.settings.userFeedback.customErrorMessages.blocked.label")}</Label>
                      <Input
                        id="errorBlocked"
                        placeholder={t("apiKeys.settings.userFeedback.customErrorMessages.blocked.placeholder")}
                        value={settings.userFeedback?.customErrorMessages?.blocked ?? ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          userFeedback: {
                            ...DEFAULT_SECURITY_SETTINGS.userFeedback,
                            ...settings.userFeedback,
                            customErrorMessages: {
                              ...DEFAULT_SECURITY_SETTINGS.userFeedback?.customErrorMessages,
                              ...settings.userFeedback?.customErrorMessages,
                              blocked: e.target.value || null,
                            }
                          }
                        })}
                        data-testid="input-error-blocked"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="errorCountryBlocked">{t("apiKeys.settings.userFeedback.customErrorMessages.countryBlocked.label")}</Label>
                      <Input
                        id="errorCountryBlocked"
                        placeholder={t("apiKeys.settings.userFeedback.customErrorMessages.countryBlocked.placeholder")}
                        value={settings.userFeedback?.customErrorMessages?.countryBlocked ?? ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          userFeedback: {
                            ...DEFAULT_SECURITY_SETTINGS.userFeedback,
                            ...settings.userFeedback,
                            customErrorMessages: {
                              ...DEFAULT_SECURITY_SETTINGS.userFeedback?.customErrorMessages,
                              ...settings.userFeedback?.customErrorMessages,
                              countryBlocked: e.target.value || null,
                            }
                          }
                        })}
                        data-testid="input-error-country-blocked"
                      />
                    </div>
                  </div>

                  {/* Success & Loading Messages */}
                  <div className="space-y-4 p-4 bg-muted/50 rounded-md">
                    <Label className="text-base font-medium">{t("apiKeys.settings.userFeedback.successLoading.title")}</Label>

                    <div className="space-y-2">
                      <Label htmlFor="successMessage">{t("apiKeys.settings.userFeedback.successLoading.customSuccessMessage.label")}</Label>
                      <Input
                        id="successMessage"
                        placeholder={t("apiKeys.settings.userFeedback.successLoading.customSuccessMessage.placeholder")}
                        value={settings.userFeedback?.customSuccessMessage ?? ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          userFeedback: {
                            ...DEFAULT_SECURITY_SETTINGS.userFeedback,
                            ...settings.userFeedback,
                            customSuccessMessage: e.target.value || null,
                          }
                        })}
                        data-testid="input-success-message"
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("apiKeys.settings.userFeedback.successLoading.customSuccessMessage.helpText")}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="showComputationCount">{t("apiKeys.settings.userFeedback.successLoading.showComputationCount.label")}</Label>
                        <p className="text-xs text-muted-foreground">
                          {t("apiKeys.settings.userFeedback.successLoading.showComputationCount.description")}
                        </p>
                      </div>
                      <Switch
                        id="showComputationCount"
                        checked={settings.userFeedback?.showComputationCount ?? true}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          userFeedback: {
                            ...DEFAULT_SECURITY_SETTINGS.userFeedback,
                            ...settings.userFeedback,
                            showComputationCount: checked,
                          }
                        })}
                        data-testid="switch-show-computation"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="loadingMessage">{t("apiKeys.settings.userFeedback.successLoading.customLoadingMessage.label")}</Label>
                      <Input
                        id="loadingMessage"
                        placeholder={t("apiKeys.settings.userFeedback.successLoading.customLoadingMessage.placeholder")}
                        value={settings.userFeedback?.customLoadingMessage ?? ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          userFeedback: {
                            ...DEFAULT_SECURITY_SETTINGS.userFeedback,
                            ...settings.userFeedback,
                            customLoadingMessage: e.target.value || null,
                          }
                        })}
                        data-testid="input-loading-message"
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("apiKeys.settings.userFeedback.successLoading.customLoadingMessage.helpText")}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="showProgressBar">{t("apiKeys.settings.userFeedback.successLoading.showProgressBar.label")}</Label>
                        <p className="text-xs text-muted-foreground">
                          {t("apiKeys.settings.userFeedback.successLoading.showProgressBar.description")}
                        </p>
                      </div>
                      <Switch
                        id="showProgressBar"
                        checked={settings.userFeedback?.showProgressBar ?? false}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          userFeedback: {
                            ...DEFAULT_SECURITY_SETTINGS.userFeedback,
                            ...settings.userFeedback,
                            showProgressBar: checked,
                          }
                        })}
                        data-testid="switch-show-progress"
                      />
                    </div>
                  </div>

                  {/* Audio Feedback */}
                  <div className="space-y-4 p-4 bg-muted/50 rounded-md">
                    <Label className="text-base font-medium">{t("apiKeys.settings.userFeedback.audioFeedback.title")}</Label>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="enableSoundEffects">{t("apiKeys.settings.userFeedback.audioFeedback.enableSoundEffects.label")}</Label>
                        <p className="text-xs text-muted-foreground">
                          {t("apiKeys.settings.userFeedback.audioFeedback.enableSoundEffects.description")}
                        </p>
                      </div>
                      <Switch
                        id="enableSoundEffects"
                        checked={settings.userFeedback?.enableSoundEffects ?? false}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          userFeedback: {
                            ...DEFAULT_SECURITY_SETTINGS.userFeedback,
                            ...settings.userFeedback,
                            enableSoundEffects: checked,
                          }
                        })}
                        data-testid="switch-enable-sounds"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="successSoundUrl">{t("apiKeys.settings.userFeedback.audioFeedback.successSoundUrl.label")}</Label>
                      <Input
                        id="successSoundUrl"
                        type="url"
                        placeholder={t("apiKeys.settings.userFeedback.audioFeedback.successSoundUrl.placeholder")}
                        value={settings.userFeedback?.successSoundUrl ?? ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          userFeedback: {
                            ...DEFAULT_SECURITY_SETTINGS.userFeedback,
                            ...settings.userFeedback,
                            successSoundUrl: e.target.value || null,
                          }
                        })}
                        data-testid="input-success-sound"
                        disabled={!settings.userFeedback?.enableSoundEffects}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("apiKeys.settings.userFeedback.audioFeedback.successSoundUrl.helpText")}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="errorSoundUrl">{t("apiKeys.settings.userFeedback.audioFeedback.errorSoundUrl.label")}</Label>
                      <Input
                        id="errorSoundUrl"
                        type="url"
                        placeholder={t("apiKeys.settings.userFeedback.audioFeedback.errorSoundUrl.placeholder")}
                        value={settings.userFeedback?.errorSoundUrl ?? ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          userFeedback: {
                            ...DEFAULT_SECURITY_SETTINGS.userFeedback,
                            ...settings.userFeedback,
                            errorSoundUrl: e.target.value || null,
                          }
                        })}
                        data-testid="input-error-sound"
                        disabled={!settings.userFeedback?.enableSoundEffects}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("apiKeys.settings.userFeedback.audioFeedback.errorSoundUrl.helpText")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Challenge Behavior - Phase 3 */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Repeat className="h-5 w-5 text-orange-500" />
                    <CardTitle>{t("apiKeys.settings.challengeBehavior.title")}</CardTitle>
                  </div>
                  <CardDescription>
                    {t("apiKeys.settings.challengeBehavior.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Auto-retry Settings */}
                  <div className="space-y-4 p-4 bg-muted/50 rounded-md">
                    <Label className="text-base font-medium">{t("apiKeys.settings.challengeBehavior.autoRetrySettings.title")}</Label>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="autoRetryOnFail">{t("apiKeys.settings.challengeBehavior.autoRetrySettings.autoRetryOnFail.label")}</Label>
                        <p className="text-xs text-muted-foreground">
                          {t("apiKeys.settings.challengeBehavior.autoRetrySettings.autoRetryOnFail.description")}
                        </p>
                      </div>
                      <Switch
                        id="autoRetryOnFail"
                        checked={settings.challengeBehavior?.autoRetryOnFail ?? true}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          challengeBehavior: {
                            ...DEFAULT_SECURITY_SETTINGS.challengeBehavior,
                            ...settings.challengeBehavior,
                            autoRetryOnFail: checked,
                          }
                        })}
                        data-testid="switch-auto-retry"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="maxAutoRetries">{t("apiKeys.settings.challengeBehavior.autoRetrySettings.maxAutoRetries.label")}</Label>
                        <span className="text-sm font-medium">{settings.challengeBehavior?.maxAutoRetries ?? 3}</span>
                      </div>
                      <Slider
                        id="maxAutoRetries"
                        min={0}
                        max={5}
                        step={1}
                        value={[settings.challengeBehavior?.maxAutoRetries ?? 3]}
                        onValueChange={(value) => setSettings({
                          ...settings,
                          challengeBehavior: {
                            ...DEFAULT_SECURITY_SETTINGS.challengeBehavior,
                            ...settings.challengeBehavior,
                            maxAutoRetries: value[0],
                          }
                        })}
                        data-testid="slider-max-retries"
                        disabled={!settings.challengeBehavior?.autoRetryOnFail}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("apiKeys.settings.challengeBehavior.autoRetrySettings.maxAutoRetries.helpText")}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="retryDelay">{t("apiKeys.settings.challengeBehavior.autoRetrySettings.retryDelay.label")}</Label>
                      <Input
                        id="retryDelay"
                        type="number"
                        min={200}
                        max={3000}
                        step={100}
                        value={settings.challengeBehavior?.retryDelayMs ?? 800}
                        onChange={(e) => setSettings({
                          ...settings,
                          challengeBehavior: {
                            ...DEFAULT_SECURITY_SETTINGS.challengeBehavior,
                            ...settings.challengeBehavior,
                            retryDelayMs: parseInt(e.target.value) || 800,
                          }
                        })}
                        data-testid="input-retry-delay"
                        disabled={!settings.challengeBehavior?.autoRetryOnFail}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("apiKeys.settings.challengeBehavior.autoRetrySettings.retryDelay.helpText")}
                      </p>
                    </div>
                  </div>

                  {/* Challenge Selection */}
                  <div className="space-y-4 p-4 bg-muted/50 rounded-md">
                    <Label className="text-base font-medium">{t("apiKeys.settings.challengeBehavior.challengeSelection.title")}</Label>

                    <div className="space-y-2">
                      <Label htmlFor="selectionMode">{t("apiKeys.settings.challengeBehavior.challengeSelection.selectionMode.label")}</Label>
                      <Select
                        value={settings.challengeBehavior?.challengeSelectionMode ?? 'risk-based'}
                        onValueChange={(value) => setSettings({
                          ...settings,
                          challengeBehavior: {
                            ...DEFAULT_SECURITY_SETTINGS.challengeBehavior,
                            ...settings.challengeBehavior,
                            challengeSelectionMode: value as 'random' | 'sequential' | 'risk-based',
                          }
                        })}
                      >
                        <SelectTrigger id="selectionMode" data-testid="select-selection-mode">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="random">{t("apiKeys.settings.challengeBehavior.challengeSelection.selectionMode.random")}</SelectItem>
                          <SelectItem value="sequential">{t("apiKeys.settings.challengeBehavior.challengeSelection.selectionMode.sequential")}</SelectItem>
                          <SelectItem value="risk-based">{t("apiKeys.settings.challengeBehavior.challengeSelection.selectionMode.riskBased")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {t("apiKeys.settings.challengeBehavior.challengeSelection.selectionMode.helpText")}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="preferredChallengeType">{t("apiKeys.settings.challengeBehavior.challengeSelection.preferredChallengeType.label")}</Label>
                      <Select
                        value={settings.challengeBehavior?.preferredChallengeType ?? 'none'}
                        onValueChange={(value) => setSettings({
                          ...settings,
                          challengeBehavior: {
                            ...DEFAULT_SECURITY_SETTINGS.challengeBehavior,
                            ...settings.challengeBehavior,
                            preferredChallengeType: value === 'none' ? null : value as 'grid' | 'jigsaw' | 'gesture' | 'upside_down' | 'audio',
                          }
                        })}
                      >
                        <SelectTrigger id="preferredChallengeType" data-testid="select-preferred-challenge">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t("apiKeys.settings.challengeBehavior.challengeSelection.preferredChallengeType.none")}</SelectItem>
                          <SelectItem value="grid">{t("apiKeys.settings.challengeBehavior.challengeSelection.preferredChallengeType.grid")}</SelectItem>
                          <SelectItem value="jigsaw">{t("apiKeys.settings.challengeBehavior.challengeSelection.preferredChallengeType.jigsaw")}</SelectItem>
                          <SelectItem value="gesture">{t("apiKeys.settings.challengeBehavior.challengeSelection.preferredChallengeType.gesture")}</SelectItem>
                          <SelectItem value="upside_down">{t("apiKeys.settings.challengeBehavior.challengeSelection.preferredChallengeType.upsideDown")}</SelectItem>
                          <SelectItem value="audio">{t("apiKeys.settings.challengeBehavior.challengeSelection.preferredChallengeType.audio")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {t("apiKeys.settings.challengeBehavior.challengeSelection.preferredChallengeType.helpText")}
                      </p>
                    </div>
                  </div>

                  {/* Difficulty Settings */}
                  <div className="space-y-4 p-4 bg-muted/50 rounded-md">
                    <Label className="text-base font-medium">{t("apiKeys.settings.challengeBehavior.difficultyProgression.title")}</Label>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="enableDifficultyProgression">{t("apiKeys.settings.challengeBehavior.difficultyProgression.enable.label")}</Label>
                        <p className="text-xs text-muted-foreground">
                          {t("apiKeys.settings.challengeBehavior.difficultyProgression.enable.description")}
                        </p>
                      </div>
                      <Switch
                        id="enableDifficultyProgression"
                        checked={settings.challengeBehavior?.enableDifficultyProgression ?? true}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          challengeBehavior: {
                            ...DEFAULT_SECURITY_SETTINGS.challengeBehavior,
                            ...settings.challengeBehavior,
                            enableDifficultyProgression: checked,
                          }
                        })}
                        data-testid="switch-difficulty-progression"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="maxDifficultyLevel">{t("apiKeys.settings.challengeBehavior.difficultyProgression.maxDifficultyLevel.label")}</Label>
                        <span className="text-sm font-medium">{settings.challengeBehavior?.maxDifficultyLevel ?? 7}/10</span>
                      </div>
                      <Slider
                        id="maxDifficultyLevel"
                        min={1}
                        max={10}
                        step={1}
                        value={[settings.challengeBehavior?.maxDifficultyLevel ?? 7]}
                        onValueChange={(value) => setSettings({
                          ...settings,
                          challengeBehavior: {
                            ...DEFAULT_SECURITY_SETTINGS.challengeBehavior,
                            ...settings.challengeBehavior,
                            maxDifficultyLevel: value[0],
                          }
                        })}
                        data-testid="slider-max-difficulty"
                        disabled={!settings.challengeBehavior?.enableDifficultyProgression}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("apiKeys.settings.challengeBehavior.difficultyProgression.maxDifficultyLevel.helpText")}
                      </p>
                    </div>
                  </div>

                  {/* Trust Settings */}
                  <div className="space-y-4 p-4 bg-muted/50 rounded-md">
                    <Label className="text-base font-medium">{t("apiKeys.settings.challengeBehavior.trustedUsers.title")}</Label>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="allowSkipForTrusted">{t("apiKeys.settings.challengeBehavior.trustedUsers.allowSkip.label")}</Label>
                        <p className="text-xs text-muted-foreground">
                          {t("apiKeys.settings.challengeBehavior.trustedUsers.allowSkip.description")}
                        </p>
                      </div>
                      <Switch
                        id="allowSkipForTrusted"
                        checked={settings.challengeBehavior?.allowSkipForTrustedFingerprints ?? false}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          challengeBehavior: {
                            ...DEFAULT_SECURITY_SETTINGS.challengeBehavior,
                            ...settings.challengeBehavior,
                            allowSkipForTrustedFingerprints: checked,
                          }
                        })}
                        data-testid="switch-allow-skip-trusted"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="trustThreshold">{t("apiKeys.settings.challengeBehavior.trustedUsers.trustThreshold.label")}</Label>
                      <Input
                        id="trustThreshold"
                        type="number"
                        min={1}
                        max={365}
                        value={settings.challengeBehavior?.trustThresholdDays ?? 30}
                        onChange={(e) => setSettings({
                          ...settings,
                          challengeBehavior: {
                            ...DEFAULT_SECURITY_SETTINGS.challengeBehavior,
                            ...settings.challengeBehavior,
                            trustThresholdDays: parseInt(e.target.value) || 30,
                          }
                        })}
                        data-testid="input-trust-threshold"
                        disabled={!settings.challengeBehavior?.allowSkipForTrustedFingerprints}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("apiKeys.settings.challengeBehavior.trustedUsers.trustThreshold.helpText")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance - Phase 4 */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-cyan-500" />
                    <CardTitle>{t("apiKeys.settings.performanceOptimization.title")}</CardTitle>
                  </div>
                  <CardDescription>
                    {t("apiKeys.settings.performanceOptimization.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Preloading & Prefetching */}
                  <div className="space-y-4 p-4 bg-muted/50 rounded-md">
                    <Label className="text-base font-medium">{t("apiKeys.settings.performanceOptimization.resourceLoading.title")}</Label>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="preloadChallenges">{t("apiKeys.settings.performanceOptimization.resourceLoading.preloadChallenges.label")}</Label>
                        <p className="text-xs text-muted-foreground">
                          {t("apiKeys.settings.performanceOptimization.resourceLoading.preloadChallenges.description")}
                        </p>
                      </div>
                      <Switch
                        id="preloadChallenges"
                        checked={settings.performance?.preloadChallenges ?? false}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          performance: {
                            ...DEFAULT_SECURITY_SETTINGS.performance,
                            ...settings.performance,
                            preloadChallenges: checked,
                          }
                        })}
                        data-testid="switch-preload-challenges"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="prefetchAssets">{t("apiKeys.settings.performanceOptimization.resourceLoading.prefetchAssets.label")}</Label>
                        <p className="text-xs text-muted-foreground">
                          {t("apiKeys.settings.performanceOptimization.resourceLoading.prefetchAssets.description")}
                        </p>
                      </div>
                      <Switch
                        id="prefetchAssets"
                        checked={settings.performance?.prefetchAssets ?? true}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          performance: {
                            ...DEFAULT_SECURITY_SETTINGS.performance,
                            ...settings.performance,
                            prefetchAssets: checked,
                          }
                        })}
                        data-testid="switch-prefetch-assets"
                      />
                    </div>
                  </div>

                  {/* Caching */}
                  <div className="space-y-4 p-4 bg-muted/50 rounded-md">
                    <Label className="text-base font-medium">{t("apiKeys.settings.performanceOptimization.tokenCaching.title")}</Label>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="cacheValidTokens">{t("apiKeys.settings.performanceOptimization.tokenCaching.cacheValidTokens.label")}</Label>
                        <p className="text-xs text-muted-foreground">
                          {t("apiKeys.settings.performanceOptimization.tokenCaching.cacheValidTokens.description")}
                        </p>
                      </div>
                      <Switch
                        id="cacheValidTokens"
                        checked={settings.performance?.cacheValidTokens ?? false}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          performance: {
                            ...DEFAULT_SECURITY_SETTINGS.performance,
                            ...settings.performance,
                            cacheValidTokens: checked,
                          }
                        })}
                        data-testid="switch-cache-tokens"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tokenCacheDuration">{t("apiKeys.settings.performanceOptimization.tokenCaching.tokenCacheDuration.label")}</Label>
                      <Input
                        id="tokenCacheDuration"
                        type="number"
                        min={60}
                        max={900}
                        value={(settings.performance?.tokenCacheDurationMs ?? 300000) / 1000}
                        onChange={(e) => setSettings({
                          ...settings,
                          performance: {
                            ...DEFAULT_SECURITY_SETTINGS.performance,
                            ...settings.performance,
                            tokenCacheDurationMs: (parseInt(e.target.value) || 300) * 1000,
                          }
                        })}
                        data-testid="input-cache-duration"
                        disabled={!settings.performance?.cacheValidTokens}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("apiKeys.settings.performanceOptimization.tokenCaching.tokenCacheDuration.helpText")}
                      </p>
                    </div>
                  </div>

                  {/* Network Settings */}
                  <div className="space-y-4 p-4 bg-muted/50 rounded-md">
                    <Label className="text-base font-medium">{t("apiKeys.settings.performanceOptimization.networkCDN.title")}</Label>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="enableCompression">{t("apiKeys.settings.performanceOptimization.networkCDN.enableCompression.label")}</Label>
                        <p className="text-xs text-muted-foreground">
                          {t("apiKeys.settings.performanceOptimization.networkCDN.enableCompression.description")}
                        </p>
                      </div>
                      <Switch
                        id="enableCompression"
                        checked={settings.performance?.enableCompression ?? true}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          performance: {
                            ...DEFAULT_SECURITY_SETTINGS.performance,
                            ...settings.performance,
                            enableCompression: checked,
                          }
                        })}
                        data-testid="switch-enable-compression"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="useCDN">{t("apiKeys.settings.performanceOptimization.networkCDN.useCDN.label")}</Label>
                        <p className="text-xs text-muted-foreground">
                          {t("apiKeys.settings.performanceOptimization.networkCDN.useCDN.description")}
                        </p>
                      </div>
                      <Switch
                        id="useCDN"
                        checked={settings.performance?.useCDN ?? false}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          performance: {
                            ...DEFAULT_SECURITY_SETTINGS.performance,
                            ...settings.performance,
                            useCDN: checked,
                          }
                        })}
                        data-testid="switch-use-cdn"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cdnUrl">{t("apiKeys.settings.performanceOptimization.networkCDN.cdnUrl.label")}</Label>
                      <Input
                        id="cdnUrl"
                        type="url"
                        placeholder={t("apiKeys.settings.performanceOptimization.networkCDN.cdnUrl.placeholder")}
                        value={settings.performance?.cdnUrl ?? ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          performance: {
                            ...DEFAULT_SECURITY_SETTINGS.performance,
                            ...settings.performance,
                            cdnUrl: e.target.value || null,
                          }
                        })}
                        data-testid="input-cdn-url"
                        disabled={!settings.performance?.useCDN}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("apiKeys.settings.performanceOptimization.networkCDN.cdnUrl.helpText")}
                      </p>
                    </div>
                  </div>

                  {/* Worker Settings */}
                  <div className="space-y-4 p-4 bg-muted/50 rounded-md">
                    <Label className="text-base font-medium">{t("apiKeys.settings.performanceOptimization.webWorkers.title")}</Label>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="maxWorkerThreads">{t("apiKeys.settings.performanceOptimization.webWorkers.maxWorkerThreads.label")}</Label>
                        <span className="text-sm font-medium">{settings.performance?.maxWorkerThreads ?? 4}</span>
                      </div>
                      <Slider
                        id="maxWorkerThreads"
                        min={1}
                        max={8}
                        step={1}
                        value={[settings.performance?.maxWorkerThreads ?? 4]}
                        onValueChange={(value) => setSettings({
                          ...settings,
                          performance: {
                            ...DEFAULT_SECURITY_SETTINGS.performance,
                            ...settings.performance,
                            maxWorkerThreads: value[0],
                          }
                        })}
                        data-testid="slider-max-workers"
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("apiKeys.settings.performanceOptimization.webWorkers.maxWorkerThreads.helpText")}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="workerFallback">{t("apiKeys.settings.performanceOptimization.webWorkers.workerFallback.label")}</Label>
                        <p className="text-xs text-muted-foreground">
                          {t("apiKeys.settings.performanceOptimization.webWorkers.workerFallback.description")}
                        </p>
                      </div>
                      <Switch
                        id="workerFallback"
                        checked={settings.performance?.workerFallbackEnabled ?? true}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          performance: {
                            ...DEFAULT_SECURITY_SETTINGS.performance,
                            ...settings.performance,
                            workerFallbackEnabled: checked,
                          }
                        })}
                        data-testid="switch-worker-fallback"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Privacy & Accessibility - Phase 5 */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-500" />
                    <CardTitle>Privacy & Compliance</CardTitle>
                  </div>
                  <CardDescription>
                    GDPR compliance, data retention, and privacy settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* GDPR Settings */}
                  <div className="space-y-4 p-4 bg-muted/50 rounded-md">
                    <Label className="text-base font-medium">GDPR Compliance</Label>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="enableGDPRMode">Enable GDPR Mode</Label>
                        <p className="text-xs text-muted-foreground">
                          Activate GDPR-compliant data handling
                        </p>
                      </div>
                      <Switch
                        id="enableGDPRMode"
                        checked={settings.privacy?.enableGDPRMode ?? false}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          privacy: {
                            ...DEFAULT_SECURITY_SETTINGS.privacy,
                            ...settings.privacy,
                            enableGDPRMode: checked,
                          }
                        })}
                        data-testid="switch-gdpr-mode"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="requireExplicitConsent">Require Explicit Consent</Label>
                        <p className="text-xs text-muted-foreground">
                          Show consent dialog before data collection
                        </p>
                      </div>
                      <Switch
                        id="requireExplicitConsent"
                        checked={settings.privacy?.requireExplicitConsent ?? false}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          privacy: {
                            ...DEFAULT_SECURITY_SETTINGS.privacy,
                            ...settings.privacy,
                            requireExplicitConsent: checked,
                          }
                        })}
                        data-testid="switch-require-consent"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="minimalDataMode">Minimal Data Mode</Label>
                        <p className="text-xs text-muted-foreground">
                          Collect only essential data for verification
                        </p>
                      </div>
                      <Switch
                        id="minimalDataMode"
                        checked={settings.privacy?.minimalDataMode ?? false}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          privacy: {
                            ...DEFAULT_SECURITY_SETTINGS.privacy,
                            ...settings.privacy,
                            minimalDataMode: checked,
                          }
                        })}
                        data-testid="switch-minimal-data"
                      />
                    </div>
                  </div>

                  {/* Data Retention */}
                  <div className="space-y-4 p-4 bg-muted/50 rounded-md">
                    <Label className="text-base font-medium">Data Retention</Label>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="anonymizeFingerprints">Anonymize Fingerprints</Label>
                        <p className="text-xs text-muted-foreground">
                          Hash and anonymize device fingerprints
                        </p>
                      </div>
                      <Switch
                        id="anonymizeFingerprints"
                        checked={settings.privacy?.anonymizeFingerprints ?? false}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          privacy: {
                            ...DEFAULT_SECURITY_SETTINGS.privacy,
                            ...settings.privacy,
                            anonymizeFingerprints: checked,
                          }
                        })}
                        data-testid="switch-anonymize-fingerprints"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="deleteDataAfterDays">Auto-Delete Data After (Days)</Label>
                      <Input
                        id="deleteDataAfterDays"
                        type="number"
                        min={7}
                        max={365}
                        value={settings.privacy?.deleteDataAfterDays ?? 90}
                        onChange={(e) => setSettings({
                          ...settings,
                          privacy: {
                            ...DEFAULT_SECURITY_SETTINGS.privacy,
                            ...settings.privacy,
                            deleteDataAfterDays: parseInt(e.target.value) || 90,
                          }
                        })}
                        data-testid="input-delete-after-days"
                      />
                      <p className="text-xs text-muted-foreground">
                        Automatically delete verification data after specified days (7-365)
                      </p>
                    </div>
                  </div>

                  {/* Privacy Links */}
                  <div className="space-y-4 p-4 bg-muted/50 rounded-md">
                    <Label className="text-base font-medium">Privacy Links</Label>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="showPrivacyLink">Show Privacy Link</Label>
                        <p className="text-xs text-muted-foreground">
                          Display privacy policy link in widget
                        </p>
                      </div>
                      <Switch
                        id="showPrivacyLink"
                        checked={settings.privacy?.showPrivacyLink ?? true}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          privacy: {
                            ...DEFAULT_SECURITY_SETTINGS.privacy,
                            ...settings.privacy,
                            showPrivacyLink: checked,
                          }
                        })}
                        data-testid="switch-show-privacy-link"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customPrivacyUrl">Custom Privacy Policy URL</Label>
                      <Input
                        id="customPrivacyUrl"
                        type="url"
                        placeholder="https://example.com/privacy"
                        value={settings.privacy?.customPrivacyUrl ?? ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          privacy: {
                            ...DEFAULT_SECURITY_SETTINGS.privacy,
                            ...settings.privacy,
                            customPrivacyUrl: e.target.value || null,
                          }
                        })}
                        data-testid="input-privacy-url"
                        disabled={!settings.privacy?.showPrivacyLink}
                      />
                      <p className="text-xs text-muted-foreground">
                        Link to your privacy policy
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customTermsUrl">Custom Terms of Service URL</Label>
                      <Input
                        id="customTermsUrl"
                        type="url"
                        placeholder="https://example.com/terms"
                        value={settings.privacy?.customTermsUrl ?? ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          privacy: {
                            ...DEFAULT_SECURITY_SETTINGS.privacy,
                            ...settings.privacy,
                            customTermsUrl: e.target.value || null,
                          }
                        })}
                        data-testid="input-terms-url"
                      />
                      <p className="text-xs text-muted-foreground">
                        Link to your terms of service
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Accessibility - Phase 5 */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-pink-500" />
                    <CardTitle>Accessibility</CardTitle>
                  </div>
                  <CardDescription>
                    Make widget accessible to all users
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Screen Reader Support */}
                  <div className="space-y-4 p-4 bg-muted/50 rounded-md">
                    <Label className="text-base font-medium">Screen Reader Support</Label>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="enableAriaLabels">Enable ARIA Labels</Label>
                        <p className="text-xs text-muted-foreground">
                          Add ARIA labels for screen reader compatibility
                        </p>
                      </div>
                      <Switch
                        id="enableAriaLabels"
                        checked={settings.accessibility?.enableAriaLabels ?? true}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          accessibility: {
                            ...DEFAULT_SECURITY_SETTINGS.accessibility,
                            ...settings.accessibility,
                            enableAriaLabels: checked,
                          }
                        })}
                        data-testid="switch-aria-labels"
                      />
                    </div>
                  </div>

                  {/* Keyboard Navigation */}
                  <div className="space-y-4 p-4 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-2">
                      <Keyboard className="h-4 w-4 text-purple-500" />
                      <Label className="text-base font-medium">Keyboard Navigation</Label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="enableKeyboardNavigation">Enable Keyboard Navigation</Label>
                        <p className="text-xs text-muted-foreground">
                          Allow full keyboard control of widget
                        </p>
                      </div>
                      <Switch
                        id="enableKeyboardNavigation"
                        checked={settings.accessibility?.enableKeyboardNavigation ?? true}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          accessibility: {
                            ...DEFAULT_SECURITY_SETTINGS.accessibility,
                            ...settings.accessibility,
                            enableKeyboardNavigation: checked,
                          }
                        })}
                        data-testid="switch-keyboard-nav"
                      />
                    </div>
                  </div>

                  {/* Visual Accessibility */}
                  <div className="space-y-4 p-4 bg-muted/50 rounded-md">
                    <Label className="text-base font-medium">Visual Accessibility</Label>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="enableHighContrastMode">Enable High Contrast Mode</Label>
                        <p className="text-xs text-muted-foreground">
                          Enhance contrast for better visibility
                        </p>
                      </div>
                      <Switch
                        id="enableHighContrastMode"
                        checked={settings.accessibility?.enableHighContrastMode ?? false}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          accessibility: {
                            ...DEFAULT_SECURITY_SETTINGS.accessibility,
                            ...settings.accessibility,
                            enableHighContrastMode: checked,
                          }
                        })}
                        data-testid="switch-high-contrast"
                      />
                    </div>
                  </div>

                  {/* Alternative Challenges */}
                  <div className="space-y-4 p-4 bg-muted/50 rounded-md">
                    <Label className="text-base font-medium">Alternative Challenges</Label>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="alwaysShowAudioChallenge">Always Show Audio Challenge</Label>
                        <p className="text-xs text-muted-foreground">
                          Provide audio alternative for all challenges
                        </p>
                      </div>
                      <Switch
                        id="alwaysShowAudioChallenge"
                        checked={settings.accessibility?.alwaysShowAudioChallenge ?? false}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          accessibility: {
                            ...DEFAULT_SECURITY_SETTINGS.accessibility,
                            ...settings.accessibility,
                            alwaysShowAudioChallenge: checked,
                          }
                        })}
                        data-testid="switch-always-audio"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="enableTextBasedChallenge">Enable Text-Based Challenge</Label>
                        <p className="text-xs text-muted-foreground">
                          Offer text-based alternative for accessibility
                        </p>
                      </div>
                      <Switch
                        id="enableTextBasedChallenge"
                        checked={settings.accessibility?.enableTextBasedChallenge ?? false}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          accessibility: {
                            ...DEFAULT_SECURITY_SETTINGS.accessibility,
                            ...settings.accessibility,
                            enableTextBasedChallenge: checked,
                          }
                        })}
                        data-testid="switch-text-challenge"
                      />
                    </div>
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
