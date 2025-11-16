import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Settings, AlertTriangle, Shield, Zap, Lock, Brain, Activity, Clock } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SecuritySettings } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ApiKeySettingsDialogProps {
  apiKeyId: string;
  apiKeyName: string;
}

// Warning messages untuk setiap security feature
const SECURITY_WARNINGS = {
  antiDebugger: {
    title: "Anti-Debugger Protection Disabled",
    description: "Disabling this feature allows developers to inspect and debug your captcha widget, making it easier for attackers to find vulnerabilities and bypass protection mechanisms."
  },
  advancedFingerprinting: {
    title: "Advanced Fingerprinting Disabled",
    description: "Without advanced fingerprinting, bots can more easily evade detection by hiding their true identity. This significantly reduces your ability to identify and block automated attacks."
  },
  sessionBinding: {
    title: "Session Binding Disabled",
    description: "Disabling session binding allows attackers to reuse captcha tokens across different sessions, making replay attacks easier to execute."
  },
  csrfProtection: {
    title: "CSRF Protection Disabled",
    description: "Without CSRF protection, your captcha system becomes vulnerable to cross-site request forgery attacks, allowing malicious websites to submit captcha solutions on behalf of users."
  },
  ipRateLimiting: {
    title: "IP Rate Limiting Disabled",
    description: "Turning off rate limiting allows attackers to make unlimited requests from the same IP address, making brute force attacks and spam much easier to execute."
  },
  automationDetection: {
    title: "Automation Detection Disabled",
    description: "Without automation detection, bots can interact with your captcha without being detected, significantly reducing the effectiveness of your security measures."
  },
  behavioralAnalysis: {
    title: "Behavioral Analysis Disabled",
    description: "Disabling behavioral analysis removes your ability to detect suspicious patterns in user interactions, making it harder to distinguish between humans and bots."
  },
  riskAdaptiveDifficulty: {
    title: "Risk-based Adaptive Difficulty Disabled",
    description: "Without adaptive difficulty, all users receive the same challenge regardless of risk level, making it easier for attackers to solve captchas while potentially frustrating legitimate users with unnecessarily difficult challenges."
  },
};

export default function ApiKeySettingsDialog({ apiKeyId, apiKeyName }: ApiKeySettingsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [showWarning, setShowWarning] = useState<{ feature: string; show: boolean } | null>(null);
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
        title: "Settings Saved",
        description: "Security settings have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleToggleFeature = (feature: keyof typeof SECURITY_WARNINGS, currentValue: boolean) => {
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
            Settings
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Security Settings</DialogTitle>
            <DialogDescription>
              Loading settings for {apiKeyName}...
            </DialogDescription>
          </DialogHeader>
          {isLoading && <p>Loading...</p>}
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
            Settings
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Security & Design Settings</DialogTitle>
            <DialogDescription>
              Configure security features and design options for {apiKeyName}
            </DialogDescription>
          </DialogHeader>
          
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Core Security Always Active</AlertTitle>
            <AlertDescription>
              Domain validation and end-to-end encryption are always enforced and cannot be disabled. These critical protections ensure your captcha system remains secure.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="security" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="design">Design</TabsTrigger>
            </TabsList>

            <TabsContent value="security" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-500" />
                    <CardTitle>Protection Features</CardTitle>
                  </div>
                  <CardDescription>
                    Enable or disable individual security layers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Anti-Debugger */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="antiDebugger">Anti-Debugger Protection</Label>
                      <p className="text-xs text-muted-foreground">
                        Detects and prevents DevTools usage
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
                      <Label htmlFor="advancedFingerprinting">Advanced Fingerprinting</Label>
                      <p className="text-xs text-muted-foreground">
                        Canvas, WebGL, Audio, and more for bot detection
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
                      <Label htmlFor="sessionBinding">Session Binding</Label>
                      <p className="text-xs text-muted-foreground">
                        Prevents token replay across different sessions
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
                      <Label htmlFor="csrfProtection">CSRF Protection</Label>
                      <p className="text-xs text-muted-foreground">
                        Guards against cross-site request forgery attacks
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
                      <Label htmlFor="ipRateLimiting">IP Rate Limiting</Label>
                      <p className="text-xs text-muted-foreground">
                        Limits requests per IP to prevent abuse
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
                      <Label htmlFor="automationDetection">Automation Detection</Label>
                      <p className="text-xs text-muted-foreground">
                        Identifies bot behavior patterns
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
                      <Label htmlFor="behavioralAnalysis">Behavioral Analysis</Label>
                      <p className="text-xs text-muted-foreground">
                        Analyzes user interaction patterns
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
                      <Label htmlFor="riskAdaptiveDifficulty">Risk-based Adaptive Difficulty</Label>
                      <p className="text-xs text-muted-foreground">
                        Adjusts challenge difficulty based on risk score
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
                    <CardTitle>Access Control</CardTitle>
                  </div>
                  <CardDescription>
                    Block specific IP addresses or countries from accessing your captcha
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Blocked IPs */}
                  <div className="space-y-2">
                    <Label htmlFor="blockedIps">Blocked IP Addresses</Label>
                    <Input
                      id="blockedIps"
                      placeholder="e.g., 192.168.1.1, 10.0.0.*, 172.16.0.0/24"
                      value={(settings.blockedIps || []).join(', ')}
                      onChange={(e) => {
                        const ips = e.target.value.split(',').map(ip => ip.trim()).filter(ip => ip.length > 0);
                        setSettings({ ...settings, blockedIps: ips });
                      }}
                      data-testid="input-blocked-ips"
                    />
                    <p className="text-xs text-muted-foreground">
                      Comma-separated list. Supports exact IP, wildcards (192.168.*), or CIDR notation (192.168.1.0/24)
                    </p>
                  </div>

                  {/* Blocked Countries */}
                  <div className="space-y-2">
                    <Label htmlFor="blockedCountries">Blocked Countries</Label>
                    <Input
                      id="blockedCountries"
                      placeholder="e.g., CN, RU, KP (ISO 3166-1 alpha-2 codes)"
                      value={(settings.blockedCountries || []).join(', ')}
                      onChange={(e) => {
                        const countries = e.target.value.split(',').map(c => c.trim().toUpperCase()).filter(c => c.length > 0);
                        setSettings({ ...settings, blockedCountries: countries });
                      }}
                      data-testid="input-blocked-countries"
                    />
                    <p className="text-xs text-muted-foreground">
                      Comma-separated list of 2-letter country codes (e.g., US, GB, CN, RU)
                    </p>
                  </div>

                  {(settings.blockedIps && settings.blockedIps.length > 0) || (settings.blockedCountries && settings.blockedCountries.length > 0) ? (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Access Restrictions Active</AlertTitle>
                      <AlertDescription>
                        {settings.blockedIps && settings.blockedIps.length > 0 && (
                          <div>Blocking {settings.blockedIps.length} IP address(es)</div>
                        )}
                        {settings.blockedCountries && settings.blockedCountries.length > 0 && (
                          <div>Blocking {settings.blockedCountries.length} country/countries</div>
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
                    <CardTitle>Performance Settings</CardTitle>
                  </div>
                  <CardDescription>
                    Configure proof-of-work difficulty and rate limits
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Proof of Work Difficulty */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="powDifficulty">Proof-of-Work Difficulty</Label>
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
                      Higher difficulty = more secure but slower solving time
                    </p>
                  </div>

                  {/* Rate Limit Settings */}
                  <div className="space-y-2">
                    <Label htmlFor="rateLimit">Max Requests per Minute</Label>
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
                      Maximum challenge requests allowed per IP per minute
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
                    <CardTitle>Challenge Design</CardTitle>
                  </div>
                  <CardDescription>
                    Configure timeouts and enabled challenge types
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Challenge Timeout */}
                  <div className="space-y-2">
                    <Label htmlFor="challengeTimeout">Challenge Timeout (seconds)</Label>
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
                      Time limit for users to solve the challenge
                    </p>
                  </div>

                  {/* Token Expiry */}
                  <div className="space-y-2">
                    <Label htmlFor="tokenExpiry">Token Expiry (seconds)</Label>
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
                      How long the verification token remains valid after success
                    </p>
                  </div>

                  {/* Challenge Types */}
                  <div className="space-y-2">
                    <Label>Enabled Challenge Types</Label>
                    <div className="space-y-2">
                      {[
                        { value: 'grid', label: 'Grid Selection' },
                        { value: 'jigsaw', label: 'Jigsaw Puzzle' },
                        { value: 'gesture', label: 'Gesture Drawing' },
                        { value: 'upside_down', label: 'Upside Down Text' },
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
                    <p className="text-xs text-muted-foreground">
                      Select which challenge types to present to users
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save-settings">
              {saveMutation.isPending ? "Saving..." : "Save Settings"}
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
              <DialogTitle>Security Warning</DialogTitle>
            </div>
            <DialogDescription>
              Are you sure you want to disable this security feature?
            </DialogDescription>
          </DialogHeader>
          
          {showWarning && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{SECURITY_WARNINGS[showWarning.feature as keyof typeof SECURITY_WARNINGS]?.title}</AlertTitle>
              <AlertDescription>
                {SECURITY_WARNINGS[showWarning.feature as keyof typeof SECURITY_WARNINGS]?.description}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWarning(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDisable} data-testid="button-confirm-disable">
              Disable Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
