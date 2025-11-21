import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Check, Shield, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function Register() {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [registeredKeys, setRegisteredKeys] = useState<{
    sitekey: string;
    secretkey: string;
    name: string;
    domain: string;
  } | null>(null);
  const [copiedSitekey, setCopiedSitekey] = useState(false);
  const [copiedSecretkey, setCopiedSecretkey] = useState(false);
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/proofCaptcha/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, domain }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || t('register.registrationError'));
      }

      const data = await response.json();
      setRegisteredKeys({
        sitekey: data.publicKey,
        secretkey: data.privateKey,
        name: data.name,
        domain: data.domain,
      });

      toast({
        title: t('register.registrationSuccess'),
        description: t('register.apiKeysCreated'),
      });

      setName("");
      setDomain("");
    } catch (error: any) {
      toast({
        title: t('register.registrationFailed'),
        description: error.message || t('register.registrationError'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: "sitekey" | "secretkey") => {
    navigator.clipboard.writeText(text);
    if (type === "sitekey") {
      setCopiedSitekey(true);
      setTimeout(() => setCopiedSitekey(false), 2000);
    } else {
      setCopiedSecretkey(true);
      setTimeout(() => setCopiedSecretkey(false), 2000);
    }
    toast({
      title: t('register.copied'),
      description: t('register.copiedToClipboard', { type: type === "sitekey" ? t('register.sitekeyText') : t('register.secretkeyText') }),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4 py-6 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">{t('register.pageTitle')}</h1>
          </div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {t('register.pageSubtitle')}
          </p>
        </div>

        {!registeredKeys ? (
          <Card data-testid="card-registration">
            <CardHeader>
              <CardTitle>{t('register.registrationTitle')}</CardTitle>
              <CardDescription>
                {t('register.registrationDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('register.appNameLabel')}</Label>
                  <Input
                    id="name"
                    data-testid="input-app-name"
                    type="text"
                    placeholder={t('register.appNamePlaceholder')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="domain">{t('register.domainLabel')}</Label>
                  <Input
                    id="domain"
                    data-testid="input-domain"
                    type="text"
                    placeholder={t('register.domainPlaceholder')}
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    required
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('register.domainHelpText')}
                  </p>
                </div>

                <Button
                  type="submit"
                  data-testid="button-register"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? t('register.registering') : t('register.registerNow')}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <Key className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                {t('register.successMessage')}
              </AlertDescription>
            </Alert>

            <Card data-testid="card-keys-result">
              <CardHeader>
                <CardTitle>{t('register.yourApiKeys')}</CardTitle>
                <CardDescription>
                  {registeredKeys.name} - {registeredKeys.domain}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('register.sitekeyLabel')}</Label>
                  <div className="flex gap-2">
                    <Input
                      data-testid="text-sitekey"
                      value={registeredKeys.sitekey}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      data-testid="button-copy-sitekey"
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(registeredKeys.sitekey, "sitekey")}
                    >
                      {copiedSitekey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('register.sitekeyHelpText')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>{t('register.secretkeyLabel')}</Label>
                  <div className="flex gap-2">
                    <Input
                      data-testid="text-secretkey"
                      value={registeredKeys.secretkey}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      data-testid="button-copy-secretkey"
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(registeredKeys.secretkey, "secretkey")}
                    >
                      {copiedSecretkey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('register.secretkeyHelpText')}
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-2">{t('register.howToUse')}</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium mb-1">{t('register.step1Title')}</p>
                      <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto">
{`<!-- Load proofCaptcha API -->
<script src="${window.location.origin}/proofCaptcha/api.js" async defer></script>

<!-- Widget CAPTCHA -->
<div class="proof-captcha" data-sitekey="${registeredKeys.sitekey}"></div>`}
                      </pre>
                    </div>

                    <div>
                      <p className="font-medium mb-1">{t('register.step2Title')}</p>
                      <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto">
{`$secret_key = "${registeredKeys.secretkey}";
$response = $_POST['proof-captcha-response'];
$verify = file_get_contents("${window.location.origin}/proofCaptcha/api/siteverify?secret={$secret_key}&response={$response}");
$result = json_decode($verify);

if ($result->success) {
    // CAPTCHA valid
} else {
    // CAPTCHA tidak valid
}`}
                      </pre>
                    </div>
                  </div>
                </div>

                <Button
                  data-testid="button-register-another"
                  variant="outline"
                  onClick={() => setRegisteredKeys(null)}
                  className="w-full"
                >
                  {t('register.registerAnotherApp')}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t('register.featuresTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold">{t('register.powSecurityTitle')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('register.powSecurityDesc')}
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <Key className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold">{t('register.easyIntegrationTitle')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('register.easyIntegrationDesc')}
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold">{t('register.realtimeAnalyticsTitle')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('register.realtimeAnalyticsDesc')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
